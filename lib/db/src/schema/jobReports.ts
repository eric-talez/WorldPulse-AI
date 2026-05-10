import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const jobReportsTable = pgTable("job_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobName: text("job_name").notNull(),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  automationRisk: integer("automation_risk").notNull(),
  growthScore: integer("growth_score").notNull(),
  summary: text("summary").notNull(),
  automatedTasks: text("automated_tasks").array().notNull(),
  humanStrengths: text("human_strengths").array().notNull(),
  futureChanges: text("future_changes").array().notNull(),
  recommendedSkills: text("recommended_skills").array().notNull(),
  countryOpportunities: text("country_opportunities").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type JobReport = typeof jobReportsTable.$inferSelect;
