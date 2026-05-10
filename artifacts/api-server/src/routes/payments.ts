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
  getPublicConfig,
  isPaypalConfigured,
  PaypalApiError,
  PaypalNotConfiguredError,
  verifyWebhookSignature,
  type PlanId,
} from "../lib/paypal";
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

router.get("/payments/config", (_req, res): void => {
  res.json(getPublicConfig());
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
      walletAddress: wallet,
      plan,
      kind: "one_time",
      paypalId: order.id,
      status: "CREATED",
      amountCents: priceForPlan(plan) * 100,
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
      .where(eq(paymentSessionsTable.paypalId, orderId));
    if (!session || session.walletAddress !== wallet) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    await db
      .update(paymentSessionsTable)
      .set({ status: captured.status, updatedAt: new Date() })
      .where(eq(paymentSessionsTable.paypalId, orderId));
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
      paypalSubscriptionId: sub.id,
      walletAddress: wallet,
      plan,
      status: "APPROVAL_PENDING",
    });
    await db.insert(paymentSessionsTable).values({
      walletAddress: wallet,
      plan,
      kind: "subscription",
      paypalId: sub.id,
      status: "APPROVAL_PENDING",
      amountCents: priceForPlan(plan) * 100,
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
      .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
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
      .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
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
      .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
    if (!stored || stored.walletAddress !== wallet) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }
    await cancelSubscription(subId, "User requested cancellation");
    await db
      .update(subscriptionsTable)
      .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
    await setUserTier(wallet, "free");
    const user = await ensureUser(wallet);
    const active = await getActiveSubscription(wallet);
    res.json(buildCurrentUser(user, active));
  } catch (err) {
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
  await handleWebhookEvent(event, req.log);
  res.json({ ok: true });
});

async function handleWebhookEvent(
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
      .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
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
        .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
      await setUserTier(stored.walletAddress, stored.plan as PlanId);
    } else if (
      type === "BILLING.SUBSCRIPTION.CANCELLED" ||
      type === "BILLING.SUBSCRIPTION.EXPIRED" ||
      type === "BILLING.SUBSCRIPTION.SUSPENDED"
    ) {
      await db
        .update(subscriptionsTable)
        .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
      await setUserTier(stored.walletAddress, "free");
    }
    return;
  }

  if (type === "PAYMENT.SALE.COMPLETED" && subId) {
    await db
      .update(subscriptionsTable)
      .set({ updatedAt: new Date() })
      .where(eq(subscriptionsTable.paypalSubscriptionId, subId));
    return;
  }

  if (type === "PAYMENT.CAPTURE.REFUNDED") {
    const captureId = resource["id"] as string | undefined;
    if (captureId) {
      log.info({ captureId }, "Refund received");
    }
  }
}

export default router;
