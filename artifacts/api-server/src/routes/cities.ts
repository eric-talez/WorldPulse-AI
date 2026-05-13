import { Router, type IRouter } from "express";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, citiesTable, issuesTable, countriesTable } from "@workspace/db";
import {
  ListCountryCitiesParams,
  ListCountryCitiesResponse,
  ListCityIssuesParams,
  ListCityIssuesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/countries/:code/cities", async (req, res): Promise<void> => {
  const params = ListCountryCitiesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const code = params.data.code.toUpperCase();
  const rows = await db
    .select()
    .from(citiesTable)
    .where(eq(citiesTable.countryCode, code))
    .orderBy(desc(citiesTable.importance));

  // Aggregate per-city signal mix so the globe can tint pins by their
  // dominant category. Single grouped query keeps this O(1) round-trips.
  const cityIds = rows.map((r) => r.id);
  const dominantByCity = new Map<
    string,
    { category: string; count: number; total: number }
  >();
  if (cityIds.length > 0) {
    const counts = await db
      .select({
        cityId: issuesTable.cityId,
        category: issuesTable.category,
        count: sql<number>`count(*)::int`,
      })
      .from(issuesTable)
      .where(inArray(issuesTable.cityId, cityIds))
      .groupBy(issuesTable.cityId, issuesTable.category);
    // Deterministic tie-break: when two categories have the same count for
    // a site, prefer the one earlier in this priority list. Categories not
    // listed fall back to alphabetical order so the result is stable.
    const TIE_BREAK_PRIORITY = [
      "ai_jobs",
      "mars_habitat",
      "lunar_base",
      "conflict",
      "cyber",
      "climate",
      "space",
      "tech",
      "news",
      "culture",
    ];
    const priorityOf = (cat: string) => {
      const idx = TIE_BREAK_PRIORITY.indexOf(cat);
      return idx === -1 ? TIE_BREAK_PRIORITY.length : idx;
    };
    const beats = (a: { category: string; count: number }, b: { category: string; count: number }) => {
      if (a.count !== b.count) return a.count > b.count;
      const pa = priorityOf(a.category);
      const pb = priorityOf(b.category);
      if (pa !== pb) return pa < pb;
      return a.category < b.category;
    };
    for (const c of counts) {
      if (!c.cityId) continue;
      const prev = dominantByCity.get(c.cityId);
      const total = (prev?.total ?? 0) + c.count;
      if (!prev || beats({ category: c.category, count: c.count }, prev)) {
        dominantByCity.set(c.cityId, {
          category: c.category,
          count: c.count,
          total,
        });
      } else {
        dominantByCity.set(c.cityId, { ...prev, total });
      }
    }
  }

  const shaped = rows.map((r) => {
    const agg = dominantByCity.get(r.id);
    return {
      ...r,
      dominantCategory: agg?.category ?? null,
      signalCount: agg?.total ?? 0,
    };
  });
  res.json(ListCountryCitiesResponse.parse(shaped));
});

router.get("/cities/:id/issues", async (req, res): Promise<void> => {
  const params = ListCityIssuesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
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
    .where(eq(issuesTable.cityId, params.data.id))
    .orderBy(desc(issuesTable.publishedAt))
    .limit(50);

  const shaped = rows.map((r) => ({
    id: r.id,
    countryCode: r.countryCode,
    countryFlag: r.countryFlag ?? "",
    cityId: r.cityId,
    planet: r.planet === "moon" || r.planet === "mars" ? r.planet : "earth",
    category: r.category,
    headline: r.headline,
    body: r.body,
    sourceUrl: r.sourceUrl,
    publishedAt: r.publishedAt,
  }));

  res.json(ListCityIssuesResponse.parse(shaped));
});

export default router;
