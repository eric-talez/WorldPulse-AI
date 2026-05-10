const PRO_PRICE_USD = 19;
const ENTERPRISE_PRICE_USD = 99;

export type PlanId = "pro" | "enterprise";

export interface PaypalConfig {
  clientId: string;
  clientSecret: string;
  webhookId: string | null;
  env: "sandbox" | "live";
  baseUrl: string;
  planIds: { pro: string | null; enterprise: string | null };
}

export function priceForPlan(plan: PlanId): number {
  return plan === "pro" ? PRO_PRICE_USD : ENTERPRISE_PRICE_USD;
}

export function isPaypalConfigured(): boolean {
  return Boolean(process.env["PAYPAL_CLIENT_ID"] && process.env["PAYPAL_CLIENT_SECRET"]);
}

export function getPublicConfig(): {
  clientId: string | null;
  env: "sandbox" | "live";
  plans: {
    pro: { priceUsd: number; hasSubscriptionPlan: boolean };
    enterprise: { priceUsd: number; hasSubscriptionPlan: boolean };
  };
} {
  const env = (process.env["PAYPAL_ENV"] === "live" ? "live" : "sandbox") as "sandbox" | "live";
  return {
    clientId: process.env["PAYPAL_CLIENT_ID"] ?? null,
    env,
    plans: {
      pro: {
        priceUsd: PRO_PRICE_USD,
        hasSubscriptionPlan: Boolean(process.env["PAYPAL_PLAN_ID_PRO"]),
      },
      enterprise: {
        priceUsd: ENTERPRISE_PRICE_USD,
        hasSubscriptionPlan: Boolean(process.env["PAYPAL_PLAN_ID_ENTERPRISE"]),
      },
    },
  };
}

export function getConfig(): PaypalConfig {
  const clientId = process.env["PAYPAL_CLIENT_ID"];
  const clientSecret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new PaypalNotConfiguredError();
  }
  const env = (process.env["PAYPAL_ENV"] === "live" ? "live" : "sandbox") as "sandbox" | "live";
  return {
    clientId,
    clientSecret,
    webhookId: process.env["PAYPAL_WEBHOOK_ID"] ?? null,
    env,
    baseUrl: env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
    planIds: {
      pro: process.env["PAYPAL_PLAN_ID_PRO"] ?? null,
      enterprise: process.env["PAYPAL_PLAN_ID_ENTERPRISE"] ?? null,
    },
  };
}

export class PaypalNotConfiguredError extends Error {
  constructor() {
    super("PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }
}

export class PaypalApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`PayPal API error ${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const cfg = getConfig();
  const auth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const res = await fetch(`${cfg.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new PaypalApiError(res.status, await res.text());
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function paypalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = getConfig();
  const token = await getAccessToken();
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new PaypalApiError(res.status, body);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export async function createOrder(
  plan: PlanId,
  walletAddress: string,
): Promise<{ id: string }> {
  const price = priceForPlan(plan);
  return paypalFetch<{ id: string }>(`/v2/checkout/orders`, {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: walletAddress,
          custom_id: `${walletAddress}|${plan}`,
          description: `FutureMap AI ${plan.toUpperCase()} (one-time)`,
          amount: {
            currency_code: "USD",
            value: price.toFixed(2),
          },
        },
      ],
    }),
  });
}

export interface CapturedOrder {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: { captures?: Array<{ id: string; status: string }> };
  }>;
}

export async function captureOrder(orderId: string): Promise<CapturedOrder> {
  return paypalFetch<CapturedOrder>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function createSubscription(
  plan: PlanId,
  walletAddress: string,
): Promise<{ id: string; approveUrl: string }> {
  const cfg = getConfig();
  const planId = cfg.planIds[plan];
  if (!planId) {
    throw new PaypalApiError(
      500,
      `Subscription plan ID not configured for ${plan}. Set PAYPAL_PLAN_ID_${plan.toUpperCase()}.`,
    );
  }
  const data = await paypalFetch<{
    id: string;
    status: string;
    links: Array<{ href: string; rel: string }>;
  }>(`/v1/billing/subscriptions`, {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      custom_id: `${walletAddress}|${plan}`,
      application_context: {
        brand_name: "FutureMap AI",
        user_action: "SUBSCRIBE_NOW",
        return_url: "https://example.com/return",
        cancel_url: "https://example.com/cancel",
      },
    }),
  });
  const approve = data.links.find((l) => l.rel === "approve");
  return { id: data.id, approveUrl: approve?.href ?? "" };
}

export interface SubscriptionDetail {
  id: string;
  status: string;
  plan_id: string;
  custom_id?: string;
  billing_info?: { next_billing_time?: string };
}

export async function getSubscription(subscriptionId: string): Promise<SubscriptionDetail> {
  return paypalFetch<SubscriptionDetail>(`/v1/billing/subscriptions/${subscriptionId}`);
}

export async function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
  await paypalFetch<null>(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg.webhookId) {
    // No webhook id configured — refuse to verify.
    return false;
  }
  const headerOf = (k: string): string => {
    const v = headers[k] ?? headers[k.toLowerCase()];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };
  const payload = {
    auth_algo: headerOf("paypal-auth-algo"),
    cert_url: headerOf("paypal-cert-url"),
    transmission_id: headerOf("paypal-transmission-id"),
    transmission_sig: headerOf("paypal-transmission-sig"),
    transmission_time: headerOf("paypal-transmission-time"),
    webhook_id: cfg.webhookId,
    webhook_event: body,
  };
  const result = await paypalFetch<{ verification_status: string }>(
    `/v1/notifications/verify-webhook-signature`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return result.verification_status === "SUCCESS";
}
