import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const forecastsTable = pgTable(
  "forecasts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    forecastKey: text("forecast_key").notNull(),
    planet: text("planet").notNull().default("earth"),
    countryCode: text("country_code").notNull(),
    category: text("category").notNull(),
    horizon: text("horizon").notNull(),
    confidence: integer("confidence").notNull(),
    headlineKo: text("headline_ko").notNull(),
    headlineEn: text("headline_en").notNull(),
    factors: text("factors").array().notNull(),
    triggerCategories: text("trigger_categories").array().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    horizonEndsAt: timestamp("horizon_ends_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("pending"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    matchingIssueId: uuid("matching_issue_id"),
  },
  (t) => ({
    pendingKeyIdx: uniqueIndex("forecasts_pending_key_idx")
      .on(t.forecastKey)
      .where(sql`status = 'pending'`),
  }),
);

export type ForecastRow = typeof forecastsTable.$inferSelect;
