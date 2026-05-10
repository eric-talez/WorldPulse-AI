import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const subscriptionsTable = pgTable("subscriptions", {
  paypalSubscriptionId: text("paypal_subscription_id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  nextBillingAt: timestamp("next_billing_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;
