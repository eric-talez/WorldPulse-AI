import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, countriesTable, jobReportsTable } from "@workspace/db";
import {
  ListCountriesResponse,
  GetCountryParams,
  GetCountryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/countries", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(countriesTable)
    .orderBy(desc(countriesTable.riskScore));
  res.json(ListCountriesResponse.parse(rows));
});

router.get("/countries/:code", async (req, res): Promise<void> => {
  const params = GetCountryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const code = params.data.code.toUpperCase();
  const [country] = await db
    .select()
    .from(countriesTable)
    .where(eq(countriesTable.code, code));

  if (!country) {
    res.status(404).json({ error: "Country not found" });
    return;
  }

  const reports = await db
    .select()
    .from(jobReportsTable)
    .where(eq(jobReportsTable.countryCode, code))
    .orderBy(desc(jobReportsTable.createdAt))
    .limit(20);

  const ranked = new Map<
    string,
    { automation: number; growth: number; n: number }
  >();
  for (const r of reports) {
    const cur = ranked.get(r.jobName) ?? { automation: 0, growth: 0, n: 0 };
    cur.automation += r.automationRisk;
    cur.growth += r.growthScore;
    cur.n += 1;
    ranked.set(r.jobName, cur);
  }
  const insights = Array.from(ranked.entries()).map(([title, v]) => ({
    title,
    automation: v.automation / v.n,
    growth: v.growth / v.n,
  }));

  const fallbackRisks = [
    { title: "세무사", score: 156 },
    { title: "콜센터 상담원", score: 148 },
    { title: "데이터 입력원", score: 142 },
    { title: "단순 번역가", score: 134 },
  ];
  const fallbackGrowth = [
    { title: "AI 엔지니어", score: 178 },
    { title: "데이터 분석가", score: 168 },
    { title: "사이버보안 전문가", score: 162 },
    { title: "전문 간호사", score: 156 },
  ];

  const topRisks =
    insights.length > 0
      ? insights
          .map((i) => ({ title: i.title, score: Math.round(i.automation + 60) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
      : fallbackRisks;

  const topGrowth =
    insights.length > 0
      ? insights
          .map((i) => ({ title: i.title, score: Math.round(i.growth + 80) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
      : fallbackGrowth;

  const summary = `${country.nameKo}에서는 AI 전환에 따라 일부 직군의 자동화 위험이 두드러지는 한편, 새로운 성장 직군이 빠르게 부상하고 있습니다.`;

  res.json(
    GetCountryResponse.parse({
      country,
      summary,
      topRisks,
      topGrowth,
    }),
  );
});

export default router;
