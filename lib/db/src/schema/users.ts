import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  walletAddress: text("wallet_address").primaryKey(),
  tier: text("tier").notNull().default("free"),
  email: text("email"),
  displayName: text("display_name"),
  age: integer("age"),
  gender: text("gender"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }).notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  suspensionReason: text("suspension_reason"),
});

export type User = typeof usersTable.$inferSelect;
export type UserTier = "free" | "pro" | "enterprise";
