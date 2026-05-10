import { pgTable, text, integer, doublePrecision } from "drizzle-orm/pg-core";

export const countriesTable = pgTable("countries", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nameKo: text("name_ko").notNull(),
  flag: text("flag").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  riskScore: integer("risk_score").notNull().default(50),
  region: text("region").notNull(),
});

export type Country = typeof countriesTable.$inferSelect;
