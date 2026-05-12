import { Router, type IRouter } from "express";
import { and, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import {
  db,
  issuesTable,
  countriesTable,
  forecastsTable,
} from "@workspace/db";
import {
  ListForecastsQueryParams,
  ListForecastsResponse,
  GetForecastAccuracyQueryParams,
  GetForecastAccuracyResponse,
} from "@workspace/api-zod";
import { PLANETS, isPlanet, findLocation, type Planet } from "../lib/planets";
import { generateForecasts, type Horizon } from "../lib/forecast";

const router: IRouter = Router();

const HORIZON_MS: Record<Horizon, number> = {
  "24h": 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

const ACCURACY_WINDOW_DAYS = 14;

/**
 * Score every pending forecast whose horizon has elapsed: hit if a follow-up
 * issue in the same planet+country+predicted-category landed between createdAt
 * and horizonEndsAt; miss otherwise. Lazy on-read scoring keeps the platform
 * job-runner-free.
 */
async function resolveDueForecasts(): Promise<void> {
  const now = new Date();
  const due = await db
    .select()
    .from(forecastsTable)
    .where(
      and(
        eq(forecastsTable.status, "pending"),
        lt(forecastsTable.horizonEndsAt, now),
      ),
    )
    .limit(200);
  if (due.length === 0) return;

  for (const fc of due) {
    const match = await db
      .select({ id: issuesTable.id })
      .from(issuesTable)
      .where(
        and(
          eq(issuesTable.planet, fc.planet),
          eq(issuesTable.countryCode, fc.countryCode),
          eq(issuesTable.category, fc.category),
          gt(issuesTable.publishedAt, fc.createdAt),
          lt(issuesTable.publishedAt, fc.horizonEndsAt),
        ),
      )
      .limit(1);

    await db
      .update(forecastsTable)
      .set({
        status: match.length > 0 ? "hit" : "miss",
        resolvedAt: now,
        matchingIssueId: match[0]?.id ?? null,
      })
      .where(eq(forecastsTable.id, fc.id));
  }
}

router.get("/forecasts", async (req, res): Promise<void> => {
  const parsed = ListForecastsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { planet, countryCode, category } = parsed.data;
  const planetKey: Planet | undefined = isPlanet(planet) ? planet : undefined;

  const filters = [];
  if (planetKey) filters.push(eq(issuesTable.planet, planetKey));
  if (countryCode)
    filters.push(eq(issuesTable.countryCode, countryCode.toUpperCase()));

  const rows = await db
    .select({
      id: issuesTable.id,
      countryCode: issuesTable.countryCode,
      planet: issuesTable.planet,
      category: issuesTable.category,
      headline: issuesTable.headline,
      publishedAt: issuesTable.publishedAt,
      countryFlag: countriesTable.flag,
    })
    .from(issuesTable)
    .leftJoin(countriesTable, eq(countriesTable.code, issuesTable.countryCode))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(issuesTable.publishedAt))
    .limit(120);

  const countryMeta = new Map<
    string,
    { name: string; nameKo: string; flag: string }
  >();
  const countryRows = await db
    .select({
      code: countriesTable.code,
      name: countriesTable.name,
      nameKo: countriesTable.nameKo,
      flag: countriesTable.flag,
    })
    .from(countriesTable);
  for (const c of countryRows) {
    countryMeta.set(c.code, {
      name: c.name,
      nameKo: c.nameKo,
      flag: c.flag ?? "",
    });
  }
  for (const p of Object.values(PLANETS)) {
    for (const loc of p.locations) {
      countryMeta.set(loc.code, {
        name: loc.name,
        nameKo: loc.nameKo,
        flag: loc.flag,
      });
    }
  }

  const issuesShaped = rows
    .filter((r) => isPlanet(r.planet))
    .map((r) => {
      const p = r.planet as Planet;
      const flag =
        r.countryFlag ??
        findLocation(p, r.countryCode)?.flag ??
        PLANETS[p].emoji;
      return {
        id: r.id,
        countryCode: r.countryCode,
        planet: p,
        countryFlag: flag,
        category: r.category,
        headline: r.headline,
        publishedAt: r.publishedAt.toISOString(),
      };
    });

  const forecasts = generateForecasts({
    issues: issuesShaped,
    countryNames: countryMeta,
    planet: planetKey,
    countryCode,
    category,
  });

  // Persist newly-generated forecasts so we can later check whether each
  // prediction matched a real follow-up issue. The partial unique index on
  // forecast_key WHERE status='pending' guarantees we keep at most one open
  // prediction per (planet, country, category, horizon).
  if (forecasts.length > 0) {
    try {
      const keys = forecasts.map((f) => f.id);
      const existing = await db
        .select({ key: forecastsTable.forecastKey })
        .from(forecastsTable)
        .where(
          and(
            eq(forecastsTable.status, "pending"),
            inArray(forecastsTable.forecastKey, keys),
          ),
        );
      const existingKeys = new Set(existing.map((r) => r.key));
      const now = new Date();
      const rowsToInsert = forecasts
        .filter((fc) => !existingKeys.has(fc.id))
        .map((fc) => ({
          forecastKey: fc.id,
          planet: fc.planet,
          countryCode: fc.countryCode,
          category: fc.category,
          horizon: fc.horizon,
          confidence: fc.confidence,
          headlineKo: fc.headlineKo,
          headlineEn: fc.headlineEn,
          factors: fc.factors,
          triggerCategories: fc.factors,
          createdAt: now,
          horizonEndsAt: new Date(now.getTime() + HORIZON_MS[fc.horizon]),
        }));
      if (rowsToInsert.length > 0) {
        await db.insert(forecastsTable).values(rowsToInsert);
      }
    } catch (err) {
      req.log?.error?.(
        { err, event: "forecast_persist_failed", count: forecasts.length },
        "forecast persist failed",
      );
    }
  }

  // Lazy scoring of any forecasts whose horizon just elapsed — best-effort,
  // never blocks the response on errors. Failures are logged at error level
  // so a degrading accuracy pipeline is detectable in operational logs.
  resolveDueForecasts().catch((err) =>
    req.log?.error?.(
      { err, event: "forecast_scoring_failed" },
      "forecast scoring failed",
    ),
  );

  res.json(ListForecastsResponse.parse(forecasts));
});

router.get("/forecasts/accuracy", async (req, res): Promise<void> => {
  const parsed = GetForecastAccuracyQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { planet } = parsed.data;
  const planetKey: Planet | undefined = isPlanet(planet) ? planet : undefined;

  await resolveDueForecasts().catch((err) =>
    req.log?.error?.(
      { err, event: "forecast_scoring_failed" },
      "forecast scoring failed",
    ),
  );

  const since = new Date(
    Date.now() - ACCURACY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const filters = [
    inArray(forecastsTable.status, ["hit", "miss"]),
    gt(forecastsTable.createdAt, since),
  ];
  if (planetKey) filters.push(eq(forecastsTable.planet, planetKey));

  const counts = await db
    .select({
      status: forecastsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(forecastsTable)
    .where(and(...filters))
    .groupBy(forecastsTable.status);

  let hits = 0;
  let misses = 0;
  for (const row of counts) {
    if (row.status === "hit") hits = row.count;
    else if (row.status === "miss") misses = row.count;
  }
  const resolved = hits + misses;
  const accuracy =
    resolved === 0 ? 0 : Math.round((hits / resolved) * 100);

  res.json(
    GetForecastAccuracyResponse.parse({
      resolved,
      hits,
      misses,
      accuracy,
      windowDays: ACCURACY_WINDOW_DAYS,
    }),
  );
});

export default router;
