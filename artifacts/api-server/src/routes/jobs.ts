import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, jobReportsTable, countriesTable } from "@workspace/db";
import {
  AnalyzeJobBody,
  AnalyzeJobResponse,
  ListRecentJobReportsQueryParams,
  ListRecentJobReportsResponse,
} from "@workspace/api-zod";
import { analyzeJob, analyzeSpaceJob } from "../lib/jobAnalysis";
import { isPlanet, findLocation } from "../lib/planets";

const router: IRouter = Router();

router.post("/jobs/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { jobName, countryCode } = parsed.data;
  const planet = isPlanet(parsed.data.planet) ? parsed.data.planet! : "earth";
  const code = countryCode.toUpperCase();

  let countryName = code;
  let result;
  if (planet === "earth") {
    const [country] = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.code, code));
    if (!country) {
      res.status(404).json({ error: "Country not found" });
      return;
    }
    countryName = country.nameKo;
    result = analyzeJob(jobName, code, country.nameKo);
  } else {
    const location = findLocation(planet, code);
    if (!location) {
      res.status(404).json({ error: "Planet location not found" });
      return;
    }
    countryName = location.nameKo;
    result = analyzeSpaceJob(jobName, code, location.nameKo);
  }

  const [report] = await db
    .insert(jobReportsTable)
    .values({
      jobName,
      countryCode: code,
      countryName,
      planet,
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
  const planet = isPlanet(parsed.data.planet) ? parsed.data.planet! : "earth";
  const rows = await db
    .select()
    .from(jobReportsTable)
    .where(eq(jobReportsTable.planet, planet))
    .orderBy(desc(jobReportsTable.createdAt))
    .limit(limit);
  res.json(ListRecentJobReportsResponse.parse(rows));
});

export default router;
