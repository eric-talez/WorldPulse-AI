import { pgTable, text, integer, doublePrecision } from "drizzle-orm/pg-core";

export const citiesTable = pgTable("cities", {
  id: text("id").primaryKey(),
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
  nameKo: text("name_ko").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  population: integer("population").notNull().default(0),
  importance: integer("importance").notNull().default(50),
});

export type City = typeof citiesTable.$inferSelect;
