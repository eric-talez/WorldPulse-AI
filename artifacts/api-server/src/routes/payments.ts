import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  paymentSessionsTable,
  subscriptionsTable,
} from "@workspace/db";
import {
  CreatePaypalOrderBody,
  CreatePaypalSubscriptionBody,
  CreateStripeCheckoutBody,
} from "@workspace/api-zod";
import {
  requireAuth,
  type AuthedRequest,
} from "../lib/session";
import {
  createOrder,
  captureOrder,
  createSubscription,
  cancelSubscription,
  getSubscription,
  priceForPlan,
  getPublicConfig as getPaypalPublicConfig,
  isPaypalConfigured,
  PaypalApiError,
  PaypalNotConfiguredError,
  verifyWebhookSignature,
  type PlanId,
} from "../lib/paypal";
import {
  createCheckoutSession,
  fetchCheckoutSession,
  cancelStripeSubscription,
  getStripePublicConfig,
  StripeNotConfiguredError,
} from "../lib/stripe";
import { isStripeAvailable } from "../lib/stripeClient";
import {
  setUserTier,
  ensureUser,
  getActiveSubscription,
  buildCurrentUser,
} from "../lib/userTier";

const router: IRouter = Router();

function handlePaypalError(res: import("express").Response, err: unknown): void {
  if (err instanceof PaypalNotConfiguredError) {
    res.status(503).json({ error: err.message });
    return;
  }
  if (err instanceof PaypalApiError) {
    res.status(502).json({ error: err.message });
    return;
  }
  throw err;
}

router.get("/payments/config", async (_req, res): Promise<void> => {
  const paypal = getPaypalPublicConfig();
  const stripeAvailable = await isStripeAvailable();
  const stripe = getStripePublicConfig();
  res.json({
    paypal,
    stripe: { available: stripeAvailable, plans: stripe.plans },
    // Legacy flat fields for backward compatibility with the existing PayPal UI.
    clientId: paypal.clientId,
    env: paypal.env,
    plans: paypal.plans,
  });
});

router.post("/payments/orders", requireAuth, async (req, res): Promise<void> => {
  if (!isPaypalConfigured()) {
    res.status(503).json({ error: "PayPal is not configured." });
    return;
  }
  const parsed = CreatePaypalOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const wallet = (req as AuthedRequest).walletAddress;
  const plan = parsed.data.plan as PlanId;
  try {
    const order = await createOrder(plan, wallet);
    await db.insert(paymentSessionsTable).values({
      provider: "paypal",
      walletAddress: wallet,
      plan,
      kind: "one_time",
      providerPaymentId: order.id,
      status: "CREATED",
      amountCents: priceForPlan(plan) * 100,
      currency: "USD",
    });
    res.json({ orderId: order.id });
  } catch (err) {
    handlePaypalError(res, err);
  }
});

router.post("/payments/orders/:orderId/capture", requireAuth, async (req, res): Promise<void> => {
  const wallet = (req as AuthedRequest).walletAddress;
  const orderId = String(req.params["orderId"]);
  try {
    const captured = await captureOrder(orderId);
    const [session] = await db
      .select()
      .from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.providerPaymentId, orderId));
    if (!session || session.walletAddress !== wallet) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    await db
      .update(paymentSessionsTable)
      .set({ status: captured.status, updatedAt: new Date() })
      .where(eq(paymentSessionsTable.providerPaymentId, orderId));
    if (captured.status === "COMPLETED") {
      await setUserTier(wallet, session.plan as PlanId);
    }
    const user = await ensureUser(wallet);
    const sub = await getActiveSubscription(wallet);
    res.json(buildCurrentUser(user, sub));
  } catch (err) {
    handlePaypalError(res, err);
  }
});

router.post("/payments/subscriptions", requireAuth, async (req, res): Promise<void> => {
  if (!isPaypalConfigured()) {
    res.status(503).json({ error: "PayPal is not configured." });
    return;
  }
  const parsed = CreatePaypalSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const wallet = (req as AuthedRequest).walletAddress;
  const plan = parsed.data.plan as PlanId;
  try {
    const sub = await createSubscription(plan, wallet);
    await db.insert(subscriptionsTable).values({
      providerSubscriptionId: sub.id,
      provider: "paypal",
      walletAddress: wallet,
      plan,
      status: "APPROVAL_PENDING",
    });
    await db.insert(paymentSessionsTable).values({
      provider: "paypal",
      walletAddress: wallet,
      plan,
      kind: "subscription",
      providerPaymentId: sub.id,
      status: "APPROVAL_PENDING",
      amountCents: priceForPlan(plan) * 100,
      currency: "USD",
    });
    res.json({ subscriptionId: sub.id, approveUrl: sub.approveUrl });
  } catch (err) {
    handlePaypalError(res, err);
  }
});

router.post("/payments/subscriptions/:subscriptionId/activate", requireAuth, async (req, res): Promise<void> => {
  const wallet = (req as AuthedRequest).walletAddress;
  const subId = String(req.params["subscriptionId"]);
  try {
    const detail = await getSubscription(subId);
    const [stored] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.providerSubscriptionId, subId));
    if (!stored || stored.walletAddress !== wallet) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }
    const next = detail.billing_info?.next_billing_time
      ? new Date(detail.billing_info.next_billing_time)
      : null;
    await db
      .update(subscriptionsTable)
      .set({ status: detail.status, nextBillingAt: next, updatedAt: new Date() })
      .where(eq(subscriptionsTable.providerSubscriptionId, subId));
    if (detail.status === "ACTIVE") {
      await setUserTier(wallet, stored.plan as PlanId);
    }
    const user = await ensureUser(wallet);
    const active = await getActiveSubscription(wallet);
    res.json(buildCurrentUser(user, active));
  } catch (err) {
    handlePaypalError(res, err);
  }
});

router.post("/payments/subscriptions/:subscriptionId/cancel", requireAuth, async (req, res): Promise<void> => {
  const wallet = (req as AuthedRequest).walletAddress;
  const subId = String(req.params["subscriptionId"]);
  try {
    const [stored] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.providerSubscriptionId, subId));
    if (!stored || stored.walletAddress !== wallet) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }
    if (stored.provider === "stripe") {
      await cancelStripeSubscription(subId);
    } else {
      await cancelSubscription(subId, "User requested cancellation");
    }
    await db
      .update(subscriptionsTable)
      .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(subscriptionsTable.providerSubscriptionId, subId));
    await setUserTier(wallet, "free");
    const user = await ensureUser(wallet);
    const active = await getActiveSubscription(wallet);
    res.json(buildCurrentUser(user, active));
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      res.status(503).json({ error: err.message });
      return;
    }
    handlePaypalError(res, err);
  }
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const event = req.body as { id?: string; event_type?: string; resource?: Record<string, unknown> };
  let verified = false;
  try {
    verified = await verifyWebhookSignature(req.headers, event);
  } catch (err) {
    req.log.warn({ err }, "PayPal webhook verification failed");
  }
  if (!verified) {
    req.log.warn({ eventType: event?.event_type }, "Rejecting unverified PayPal webhook");
    res.status(400).json({ ok: false });
    return;
  }
  await handlePaypalWebhookEvent(event, req.log);
  res.json({ ok: true });
});

async function handlePaypalWebhookEvent(
  event: { event_type?: string; resource?: Record<string, unknown> },
  log: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void },
): Promise<void> {
  const type = event.event_type ?? "";
  const resource = (event.resource ?? {}) as Record<string, unknown>;
  log.info({ type }, "Handling PayPal webhook");

  const subId =
    (resource["id"] as string | undefined) ??
    (resource["billing_agreement_id"] as string | undefined);

  if (type.startsWith("BILLING.SUBSCRIPTION.") && subId) {
    const [stored] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.providerSubscriptionId, subId));
    if (!stored) {
      log.warn({ subId }, "Webhook for unknown subscription");
      return;
    }
    if (type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const billing = resource["billing_info"] as { next_billing_time?: string } | undefined;
      const next = billing?.next_billing_time ? new Date(billing.next_billing_time) : null;
      await db
        .update(subscriptionsTable)
        .set({ status: "ACTIVE", nextBillingAt: next, updatedAt: new Date() })
        .where(eq(subscriptionsTable.providerSubscriptionId, subId));
      await setUserTier(stored.walletAddress, stored.plan as PlanId);
    } else if (
      type === "BILLING.SUBSCRIPTION.CANCELLED" ||
      type === "BILLING.SUBSCRIPTION.EXPIRED" ||
      type === "BILLING.SUBSCRIPTION.SUSPENDED"
    ) {
      await db
        .update(subscriptionsTable)
        .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptionsTable.providerSubscriptionId, subId));
      await setUserTier(stored.walletAddress, "free");
    }
    return;
  }

  if (type === "PAYMENT.SALE.COMPLETED" && subId) {
    await db
      .update(subscriptionsTable)
      .set({ updatedAt: new Date() })
      .where(eq(subscriptionsTable.providerSubscriptionId, subId));
    return;
  }

  if (type === "PAYMENT.CAPTURE.REFUNDED") {
    const captureId = resource["id"] as string | undefined;
    if (captureId) {
      log.info({ captureId }, "Refund received");
    }
  }
}

// ── Stripe ───────────────────────────────────────────────────────────────────

router.post("/payments/stripe/checkout", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateStripeCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const wallet = (req as AuthedRequest).walletAddress;
  const { plan, mode, successUrl, cancelUrl } = parsed.data;
  try {
    const session = await createCheckoutSession({
      plan: plan as PlanId,
      mode: mode as "subscription" | "one_time",
      walletAddress: wallet,
      successUrl,
      cancelUrl,
    });
    await db.insert(paymentSessionsTable).values({
      provider: "stripe",
      walletAddress: wallet,
      plan,
      kind: mode,
      providerPaymentId: session.id,
      status: "open",
      amountCents: priceForPlan(plan as PlanId) * 100,
      currency: "USD",
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// Confirms a Stripe Checkout session result via the success-redirect.
// Webhooks remain the source of truth, but this gives the UI an immediate
// authoritative answer (server-verified, never trusting the client).
router.post("/payments/stripe/sessions/:sessionId/confirm", requireAuth, async (req, res): Promise<void> => {
  const wallet = (req as AuthedRequest).walletAddress;
  const sessionId = String(req.params["sessionId"]);
  try {
    const session = await fetchCheckoutSession(sessionId);
    if (session.client_reference_id !== wallet) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const plan = (session.metadata?.["plan"] as PlanId | undefined) ?? null;
    const paid = session.payment_status === "paid" || session.status === "complete";

    await db
      .update(paymentSessionsTable)
      .set({ status: session.status ?? "complete", updatedAt: new Date() })
      .where(eq(paymentSessionsTable.providerPaymentId, sessionId));

    if (paid && plan) {
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        await upsertStripeSubscription({
          subscriptionId: session.subscription,
          walletAddress: wallet,
          plan,
          status: "active",
        });
      }
      await setUserTier(wallet, plan);
    }
    const user = await ensureUser(wallet);
    const sub = await getActiveSubscription(wallet);
    res.json(buildCurrentUser(user, sub));
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }
});

async function upsertStripeSubscription(input: {
  subscriptionId: string;
  walletAddress: string;
  plan: string;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.providerSubscriptionId, input.subscriptionId));
  if (existing) {
    await db
      .update(subscriptionsTable)
      .set({
        status: input.status,
        currentPeriodStart: input.currentPeriodStart ?? existing.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd ?? existing.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.providerSubscriptionId, input.subscriptionId));
    return;
  }
  await db.insert(subscriptionsTable).values({
    providerSubscriptionId: input.subscriptionId,
    provider: "stripe",
    walletAddress: input.walletAddress,
    plan: input.plan,
    status: input.status,
    currentPeriodStart: input.currentPeriodStart ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
  });
}

// Stripe webhook handler is mounted in app.ts BEFORE express.json() — see app.ts.
// This export is consumed by app.ts to keep all webhook logic colocated.
export async function processStripeWebhookEvent(
  event: import("stripe").Stripe.Event,
  log: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void },
): Promise<void> {
  log.info({ type: event.type }, "Handling Stripe webhook");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;
      const wallet = session.client_reference_id ?? session.metadata?.["walletAddress"] ?? null;
      const plan = session.metadata?.["plan"] ?? null;
      if (!wallet || !plan) {
        log.warn({ sessionId: session.id }, "Stripe session missing wallet/plan metadata");
        return;
      }
      await db
        .update(paymentSessionsTable)
        .set({ status: "complete", updatedAt: new Date() })
        .where(eq(paymentSessionsTable.providerPaymentId, session.id));

      if (session.mode === "subscription" && typeof session.subscription === "string") {
        await upsertStripeSubscription({
          subscriptionId: session.subscription,
          walletAddress: wallet,
          plan,
          status: "active",
        });
      }
      await setUserTier(wallet, plan as "pro" | "enterprise");
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as import("stripe").Stripe.Subscription;
      const wallet = sub.metadata?.["walletAddress"] ?? null;
      const plan = sub.metadata?.["plan"] ?? null;
      if (!wallet || !plan) return;
      await upsertStripeSubscription({
        subscriptionId: sub.id,
        walletAddress: wallet,
        plan,
        status: sub.status,
        currentPeriodStart: sub.start_date ? new Date(sub.start_date * 1000) : null,
        currentPeriodEnd: null,
      });
      if (sub.status === "active" || sub.status === "trialing") {
        await setUserTier(wallet, plan as "pro" | "enterprise");
      }
      return;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as import("stripe").Stripe.Subscription;
      const [stored] = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.providerSubscriptionId, sub.id));
      if (!stored) return;
      await db
        .update(subscriptionsTable)
        .set({ status: "canceled", cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptionsTable.providerSubscriptionId, sub.id));
      await setUserTier(stored.walletAddress, "free");
      return;
    }
    default:
      return;
  }
}

export default router;
