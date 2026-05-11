import Stripe from "stripe";
import { getUncachableStripeClient } from "./stripeClient";

// Verifier-only Stripe instance. Constructed lazily; uses a dummy secret because
// `webhooks.constructEvent` is purely cryptographic (HMAC over the raw payload).
let verifierClient: Stripe | null = null;
function getVerifierClient(): Stripe {
  if (!verifierClient) {
    verifierClient = new Stripe("sk_test_signature_verifier");
  }
  return verifierClient;
}

export type PlanId = "pro" | "enterprise";
export type CheckoutMode = "subscription" | "one_time";

const PRO_PRICE_USD = 19;
const ENTERPRISE_PRICE_USD = 99;

export class StripeNotConfiguredError extends Error {
  constructor(message = "Stripe is not configured.") {
    super(message);
  }
}

export function priceForPlan(plan: PlanId): number {
  return plan === "pro" ? PRO_PRICE_USD : ENTERPRISE_PRICE_USD;
}

export function getStripePlanIds(): { pro: string | null; enterprise: string | null } {
  return {
    pro: process.env["STRIPE_PRICE_ID_PRO"] ?? null,
    enterprise: process.env["STRIPE_PRICE_ID_ENTERPRISE"] ?? null,
  };
}

export function getStripePublicConfig(): {
  plans: {
    pro: { priceUsd: number; hasSubscriptionPlan: boolean };
    enterprise: { priceUsd: number; hasSubscriptionPlan: boolean };
  };
} {
  const planIds = getStripePlanIds();
  return {
    plans: {
      pro: { priceUsd: PRO_PRICE_USD, hasSubscriptionPlan: Boolean(planIds.pro) },
      enterprise: { priceUsd: ENTERPRISE_PRICE_USD, hasSubscriptionPlan: Boolean(planIds.enterprise) },
    },
  };
}

interface CreateSessionInput {
  plan: PlanId;
  mode: CheckoutMode;
  walletAddress: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(input: CreateSessionInput): Promise<{ id: string; url: string }> {
  const stripe = await getUncachableStripeClient();
  const { plan, mode, walletAddress, successUrl, cancelUrl } = input;

  type LineItem = Parameters<Stripe["checkout"]["sessions"]["create"]>[0] extends infer P
    ? P extends { line_items?: infer L }
      ? L extends Array<infer Item>
        ? Item
        : never
      : never
    : never;
  let lineItems: LineItem[];
  if (mode === "subscription") {
    const planIds = getStripePlanIds();
    const priceId = planIds[plan];
    if (!priceId) {
      throw new StripeNotConfiguredError(
        `Stripe subscription price ID not configured for ${plan}. Set STRIPE_PRICE_ID_${plan.toUpperCase()}.`,
      );
    }
    lineItems = [{ price: priceId, quantity: 1 }];
  } else {
    // One-time uses inline price_data per the user's spec
    // (subscription-only env vars STRIPE_PRICE_ID_*).
    lineItems = [
      {
        price_data: {
          currency: "usd",
          unit_amount: priceForPlan(plan) * 100,
          product_data: {
            name: `FutureMap AI ${plan === "pro" ? "Pro" : "Enterprise"} (one-time)`,
          },
        },
        quantity: 1,
      },
    ];
  }

  const session = await stripe.checkout.sessions.create({
    mode: mode === "subscription" ? "subscription" : "payment",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: walletAddress,
    metadata: { walletAddress, plan },
    ...(mode === "subscription"
      ? { subscription_data: { metadata: { walletAddress, plan } } }
      : { payment_intent_data: { metadata: { walletAddress, plan } } }),
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return { id: session.id, url: session.url };
}

export function verifyWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) {
    throw new StripeNotConfiguredError("STRIPE_WEBHOOK_SECRET is not set.");
  }
  return getVerifierClient().webhooks.constructEvent(payload, signature, secret);
}

export async function fetchCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = await getUncachableStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const stripe = await getUncachableStripeClient();
  await stripe.subscriptions.cancel(subscriptionId);
}
