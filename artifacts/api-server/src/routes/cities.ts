import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
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
  res.json(ListCountryCitiesResponse.parse(rows));
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
