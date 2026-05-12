import { Router, type IRouter } from "express";
import { sql, gte, eq, and } from "drizzle-orm";
import {
  db,
  countriesTable,
  issuesTable,
  jobReportsTable,
  forumPostsTable,
} from "@workspace/db";
import {
  GetDashboardStatsQueryParams,
  GetDashboardStatsResponse,
} from "@workspace/api-zod";
import { isPlanet, PLANETS } from "../lib/planets";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const parsed = GetDashboardStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const planet = isPlanet(parsed.data.planet) ? parsed.data.planet! : "earth";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [issuesRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(issuesTable)
    .where(
      and(eq(issuesTable.planet, planet), gte(issuesTable.publishedAt, since)),
    );

  const [reportsRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(jobReportsTable)
    .where(eq(jobReportsTable.planet, planet));

  const categoryRows = await db
    .select({
      category: issuesTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(issuesTable)
    .where(eq(issuesTable.planet, planet))
    .groupBy(issuesTable.category)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  let countriesTracked = 0;
  let forumPosts = 0;
  if (planet === "earth") {
    const [countriesRow] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(countriesTable);
    const [postsRow] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(forumPostsTable);
    countriesTracked = countriesRow?.c ?? 0;
    forumPosts = postsRow?.c ?? 0;
  } else {
    countriesTracked = PLANETS[planet].locations.length;
    forumPosts = 0;
  }

  res.json(
    GetDashboardStatsResponse.parse({
      countriesTracked,
      issuesToday: issuesRow?.c ?? 0,
      jobReportsGenerated: reportsRow?.c ?? 0,
      forumPosts,
      topCategory: categoryRows[0]?.category ?? "news",
    }),
  );
});

export default router;
