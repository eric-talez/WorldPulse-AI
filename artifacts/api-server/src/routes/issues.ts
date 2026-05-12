import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, issuesTable, countriesTable } from "@workspace/db";
import {
  ListIssuesQueryParams,
  ListIssuesResponse,
  GetIssueSummaryQueryParams,
  GetIssueSummaryResponse,
  GetIssueParams,
  GetIssueResponse,
} from "@workspace/api-zod";
import { PLANETS, isPlanet, findLocation } from "../lib/planets";

const router: IRouter = Router();

router.get("/issues", async (req, res): Promise<void> => {
  const parsed = ListIssuesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, country, limit, planet } = parsed.data;
  const planetKey = isPlanet(planet) ? planet : "earth";
  const filters = [eq(issuesTable.planet, planetKey)];
  if (category) filters.push(eq(issuesTable.category, category));
  if (country) filters.push(eq(issuesTable.countryCode, country.toUpperCase()));

  const rows = await db
    .select({
      id: issuesTable.id,
      countryCode: issuesTable.countryCode,
      cityId: issuesTable.cityId,
      planet: issuesTable.planet,
      category: issuesTable.category,
      headline: issuesTable.headline,
      body: issuesTable.body,
      sourceUrl: issuesTable.sourceUrl,
      publishedAt: issuesTable.publishedAt,
      countryFlag: countriesTable.flag,
    })
    .from(issuesTable)
    .leftJoin(countriesTable, eq(countriesTable.code, issuesTable.countryCode))
    .where(and(...filters))
    .orderBy(desc(issuesTable.publishedAt))
    .limit(limit ?? 30);

  const shaped = rows.map((r) => {
    let flag = r.countryFlag ?? "";
    if (!flag && isPlanet(r.planet) && r.planet !== "earth") {
      flag =
        findLocation(r.planet, r.countryCode)?.flag ?? PLANETS[r.planet].emoji;
    }
    return {
      id: r.id,
      countryCode: r.countryCode,
      countryFlag: flag,
      cityId: r.cityId,
      planet: isPlanet(r.planet) ? r.planet : "earth",
      category: r.category,
      headline: r.headline,
      body: r.body,
      sourceUrl: r.sourceUrl,
      publishedAt: r.publishedAt,
    };
  });

  res.json(ListIssuesResponse.parse(shaped));
});

router.get("/issues/summary", async (req, res): Promise<void> => {
  const parsed = GetIssueSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const planetKey = isPlanet(parsed.data.planet) ? parsed.data.planet! : "earth";
  const rows = await db
    .select({
      category: issuesTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(issuesTable)
    .where(eq(issuesTable.planet, planetKey))
    .groupBy(issuesTable.category);
  res.json(GetIssueSummaryResponse.parse(rows));
});

router.get("/issues/:id", async (req, res): Promise<void> => {
  const parsed = GetIssueParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .select({
      id: issuesTable.id,
      countryCode: issuesTable.countryCode,
      cityId: issuesTable.cityId,
      planet: issuesTable.planet,
      category: issuesTable.category,
      headline: issuesTable.headline,
      body: issuesTable.body,
      sourceUrl: issuesTable.sourceUrl,
      publishedAt: issuesTable.publishedAt,
      countryFlag: countriesTable.flag,
    })
    .from(issuesTable)
    .leftJoin(countriesTable, eq(countriesTable.code, issuesTable.countryCode))
    .where(eq(issuesTable.id, parsed.data.id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  let flag = row.countryFlag ?? "";
  if (!flag && isPlanet(row.planet) && row.planet !== "earth") {
    flag =
      findLocation(row.planet, row.countryCode)?.flag ?? PLANETS[row.planet].emoji;
  }

  res.json(
    GetIssueResponse.parse({
      id: row.id,
      countryCode: row.countryCode,
      countryFlag: flag,
      cityId: row.cityId,
      planet: isPlanet(row.planet) ? row.planet : "earth",
      category: row.category,
      headline: row.headline,
      body: row.body,
      sourceUrl: row.sourceUrl,
      publishedAt: row.publishedAt,
    }),
  );
});

export default router;
