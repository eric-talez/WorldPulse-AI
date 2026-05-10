import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const paymentSessionsTable = pgTable("payment_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").notNull(),
  plan: text("plan").notNull(),
  kind: text("kind").notNull(),
  paypalId: text("paypal_id").notNull(),
  status: text("status").notNull(),
  amountCents: integer("amount_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PaymentSession = typeof paymentSessionsTable.$inferSelect;
