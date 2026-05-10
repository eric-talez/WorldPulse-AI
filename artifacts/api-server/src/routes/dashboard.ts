import { Router, type IRouter } from "express";
import { sql, gte } from "drizzle-orm";
import {
  db,
  countriesTable,
  issuesTable,
  jobReportsTable,
  forumPostsTable,
} from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [[countriesRow], [issuesRow], [reportsRow], [postsRow], categoryRows] =
    await Promise.all([
      db.select({ c: sql<number>`count(*)::int` }).from(countriesTable),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(issuesTable)
        .where(gte(issuesTable.publishedAt, since)),
      db.select({ c: sql<number>`count(*)::int` }).from(jobReportsTable),
      db.select({ c: sql<number>`count(*)::int` }).from(forumPostsTable),
      db
        .select({
          category: issuesTable.category,
          count: sql<number>`count(*)::int`,
        })
        .from(issuesTable)
        .groupBy(issuesTable.category)
        .orderBy(sql`count(*) desc`)
        .limit(1),
    ]);

  res.json(
    GetDashboardStatsResponse.parse({
      countriesTracked: countriesRow?.c ?? 0,
      issuesToday: issuesRow?.c ?? 0,
      jobReportsGenerated: reportsRow?.c ?? 0,
      forumPosts: postsRow?.c ?? 0,
      topCategory: categoryRows[0]?.category ?? "news",
    }),
  );
});

export default router;
