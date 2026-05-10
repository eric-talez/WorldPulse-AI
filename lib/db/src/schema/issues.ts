import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const issuesTable = pgTable("issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: text("country_code").notNull(),
  category: text("category").notNull(),
  headline: text("headline").notNull(),
  body: text("body"),
  sourceUrl: text("source_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Issue = typeof issuesTable.$inferSelect;
