import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const countryBannersTable = pgTable("country_banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: text("country_code").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CountryBanner = typeof countryBannersTable.$inferSelect;
