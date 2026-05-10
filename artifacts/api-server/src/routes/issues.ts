import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, issuesTable, countriesTable } from "@workspace/db";
import {
  ListIssuesQueryParams,
  ListIssuesResponse,
  GetIssueSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/issues", async (req, res): Promise<void> => {
  const parsed = ListIssuesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, country, limit } = parsed.data;
  const filters = [];
  if (category) filters.push(eq(issuesTable.category, category));
  if (country) filters.push(eq(issuesTable.countryCode, country.toUpperCase()));

  const rows = await db
    .select({
      id: issuesTable.id,
      countryCode: issuesTable.countryCode,
      category: issuesTable.category,
      headline: issuesTable.headline,
      body: issuesTable.body,
      sourceUrl: issuesTable.sourceUrl,
      publishedAt: issuesTable.publishedAt,
      countryFlag: countriesTable.flag,
    })
    .from(issuesTable)
    .leftJoin(countriesTable, eq(countriesTable.code, issuesTable.countryCode))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(issuesTable.publishedAt))
    .limit(limit ?? 30);

  const shaped = rows.map((r) => ({
    id: r.id,
    countryCode: r.countryCode,
    countryFlag: r.countryFlag ?? "",
    category: r.category,
    headline: r.headline,
    body: r.body,
    sourceUrl: r.sourceUrl,
    publishedAt: r.publishedAt,
  }));

  res.json(ListIssuesResponse.parse(shaped));
});

router.get("/issues/summary", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: issuesTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(issuesTable)
    .groupBy(issuesTable.category);
  res.json(GetIssueSummaryResponse.parse(rows));
});

export default router;
