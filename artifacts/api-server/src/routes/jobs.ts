import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, jobReportsTable, countriesTable } from "@workspace/db";
import {
  AnalyzeJobBody,
  AnalyzeJobResponse,
  ListRecentJobReportsQueryParams,
  ListRecentJobReportsResponse,
} from "@workspace/api-zod";
import { analyzeJob } from "../lib/jobAnalysis";

const router: IRouter = Router();

router.post("/jobs/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { jobName, countryCode } = parsed.data;
  const code = countryCode.toUpperCase();

  const [country] = await db
    .select()
    .from(countriesTable)
    .where(eq(countriesTable.code, code));
  if (!country) {
    res.status(404).json({ error: "Country not found" });
    return;
  }

  const result = analyzeJob(jobName, code, country.nameKo);

  const [report] = await db
    .insert(jobReportsTable)
    .values({
      jobName,
      countryCode: code,
      countryName: country.nameKo,
      ...result,
    })
    .returning();

  res.json(AnalyzeJobResponse.parse(report));
});

router.get("/jobs/reports/recent", async (req, res): Promise<void> => {
  const parsed = ListRecentJobReportsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 8;
  const rows = await db
    .select()
    .from(jobReportsTable)
    .orderBy(desc(jobReportsTable.createdAt))
    .limit(limit);
  res.json(ListRecentJobReportsResponse.parse(rows));
});

export default router;
