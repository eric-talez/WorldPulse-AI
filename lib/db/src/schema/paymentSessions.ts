import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const paymentSessionsTable = pgTable("payment_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().default("paypal"),
  walletAddress: text("wallet_address").notNull(),
  plan: text("plan").notNull(),
  kind: text("kind").notNull(),
  providerPaymentId: text("provider_payment_id").notNull(),
  providerCustomerId: text("provider_customer_id"),
  status: text("status").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PaymentSession = typeof paymentSessionsTable.$inferSelect;
