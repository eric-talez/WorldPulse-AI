import { Planet, PLANETS, findLocation } from "./planets";

export type Horizon = "24h" | "week" | "month";

export interface ForecastEvidence {
  id: string;
  headline: string;
  category: string;
  publishedAt: string;
}

export interface Forecast {
  id: string;
  planet: Planet;
  countryCode: string;
  countryFlag: string;
  category: string;
  headlineKo: string;
  headlineEn: string;
  confidence: number;
  horizon: Horizon;
  factors: string[];
  evidence: ForecastEvidence[];
}

export interface ForecastInputIssue {
  id: string;
  countryCode: string;
  planet: Planet;
  countryFlag: string;
  category: string;
  headline: string;
  publishedAt: string;
}

interface Rule {
  category: string;
  triggerCategories: string[];
  minTriggerCount: number;
  horizon: Horizon;
  baseConfidence: number;
  headlineKo: (ctx: HeadlineCtx) => string;
  headlineEn: (ctx: HeadlineCtx) => string;
  planets?: Planet[];
}

interface HeadlineCtx {
  name: string;
  nameKo: string;
  count: number;
}

const RULES: Rule[] = [
  {
    category: "economy",
    triggerCategories: ["economy"],
    minTriggerCount: 2,
    horizon: "24h",
    baseConfidence: 60,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 24시간 내 주요 지수 변동성 확대 가능성`,
    headlineEn: ({ name }) =>
      `${name}: Index volatility likely to widen within 24 hours`,
    planets: ["earth"],
  },
  {
    category: "conflict",
    triggerCategories: ["conflict"],
    minTriggerCount: 2,
    horizon: "week",
    baseConfidence: 55,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 이번 주 충돌 격화 또는 군사 동원 추가 가능성`,
    headlineEn: ({ name }) =>
      `${name}: Escalation or fresh mobilization likely this week`,
    planets: ["earth"],
  },
  {
    category: "conflict",
    triggerCategories: ["conflict", "politics"],
    minTriggerCount: 3,
    horizon: "month",
    baseConfidence: 45,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 한 달 내 휴전·중재 협상 테이블 가시화`,
    headlineEn: ({ name }) =>
      `${name}: Ceasefire or mediation talks likely to surface within a month`,
    planets: ["earth"],
  },
  {
    category: "ai_jobs",
    triggerCategories: ["ai_jobs", "tech"],
    minTriggerCount: 2,
    horizon: "week",
    baseConfidence: 65,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: AI·테크 직군 채용 공고 단기 급증 예상`,
    headlineEn: ({ name }) =>
      `${name}: AI / tech hiring wave expected within the week`,
  },
  {
    category: "disease",
    triggerCategories: ["disease"],
    minTriggerCount: 2,
    horizon: "week",
    baseConfidence: 58,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 인접 지역 확산·격상된 보건 경보 가능성`,
    headlineEn: ({ name }) =>
      `${name}: Outbreak spread to nearby regions and raised health alert likely`,
    planets: ["earth"],
  },
  {
    category: "politics",
    triggerCategories: ["politics", "economy"],
    minTriggerCount: 2,
    horizon: "month",
    baseConfidence: 50,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 한 달 내 정책·규제 변화 발표 가능성`,
    headlineEn: ({ name }) =>
      `${name}: Policy or regulatory shift likely within a month`,
    planets: ["earth"],
  },
  {
    category: "natural_disaster",
    triggerCategories: ["natural_disaster", "climate"],
    minTriggerCount: 2,
    horizon: "24h",
    baseConfidence: 55,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 24시간 내 2차 피해·여진 또는 추가 경보 가능성`,
    headlineEn: ({ name }) =>
      `${name}: Secondary damage, aftershocks, or new alerts likely within 24 hours`,
    planets: ["earth"],
  },
  {
    category: "cyber",
    triggerCategories: ["cyber", "tech"],
    minTriggerCount: 2,
    horizon: "24h",
    baseConfidence: 60,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 24시간 내 후속 사이버 공격 또는 데이터 유출 보고 예상`,
    headlineEn: ({ name }) =>
      `${name}: Follow-up cyberattacks or data leaks likely within 24 hours`,
    planets: ["earth"],
  },
  {
    category: "terror",
    triggerCategories: ["terror", "conflict"],
    minTriggerCount: 1,
    horizon: "week",
    baseConfidence: 48,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 이번 주 보안 경계 격상 및 동조 사건 가능성`,
    headlineEn: ({ name }) =>
      `${name}: Heightened security posture and copycat incidents likely this week`,
    planets: ["earth"],
  },
  {
    category: "climate",
    triggerCategories: ["climate", "natural_disaster"],
    minTriggerCount: 2,
    horizon: "month",
    baseConfidence: 50,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 한 달 내 기후 적응 정책·예산 발표 가시화`,
    headlineEn: ({ name }) =>
      `${name}: Climate-adaptation policy or budget likely to surface within a month`,
    planets: ["earth"],
  },
  // Space-only rules
  {
    category: "lunar_base",
    triggerCategories: ["lunar_base", "space", "tech"],
    minTriggerCount: 2,
    horizon: "week",
    baseConfidence: 60,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 이번 주 달 미션 일정 갱신·계약 발표 가능성`,
    headlineEn: ({ name }) =>
      `${name}: Lunar mission schedule update or new contract likely this week`,
    planets: ["moon"],
  },
  {
    category: "space",
    triggerCategories: ["space", "tech"],
    minTriggerCount: 1,
    horizon: "month",
    baseConfidence: 45,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 한 달 내 신규 자원 탐사·과학 발견 발표 가능성`,
    headlineEn: ({ name }) =>
      `${name}: New resource survey or science finding likely within a month`,
    planets: ["moon", "mars"],
  },
  {
    category: "ai_jobs",
    triggerCategories: ["ai_jobs"],
    minTriggerCount: 1,
    horizon: "week",
    baseConfidence: 58,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 원격 로봇·우주 직군 신규 채용 공고 등장 예상`,
    headlineEn: ({ name }) =>
      `${name}: New remote-robotics / space-job postings expected this week`,
    planets: ["moon", "mars"],
  },
  {
    category: "mars_habitat",
    triggerCategories: ["mars_habitat", "space"],
    minTriggerCount: 1,
    horizon: "month",
    baseConfidence: 42,
    headlineKo: ({ nameKo }) =>
      `${nameKo}: 한 달 내 화성 거주 인프라 마일스톤 또는 발사 일정 공지`,
    headlineEn: ({ name }) =>
      `${name}: Mars habitat milestone or launch schedule announcement likely within a month`,
    planets: ["mars"],
  },
];

const COUNTRY_FALLBACK_NAME_EN: Record<string, string> = {};

export function generateForecasts(params: {
  issues: ForecastInputIssue[];
  countryNames: Map<string, { name: string; nameKo: string; flag: string }>;
  planet?: Planet;
  countryCode?: string;
  category?: string;
}): Forecast[] {
  const { issues, countryNames, planet, countryCode, category } = params;

  // Group: countryCode -> category -> count
  const byCountry = new Map<
    string,
    {
      planet: Planet;
      flag: string;
      categories: Map<string, number>;
      issuesByCategory: Map<string, ForecastInputIssue[]>;
      total: number;
    }
  >();

  for (const issue of issues) {
    if (planet && issue.planet !== planet) continue;
    if (countryCode && issue.countryCode !== countryCode.toUpperCase()) continue;
    let entry = byCountry.get(issue.countryCode);
    if (!entry) {
      entry = {
        planet: issue.planet,
        flag: issue.countryFlag,
        categories: new Map(),
        issuesByCategory: new Map(),
        total: 0,
      };
      byCountry.set(issue.countryCode, entry);
    }
    entry.categories.set(
      issue.category,
      (entry.categories.get(issue.category) ?? 0) + 1,
    );
    const list = entry.issuesByCategory.get(issue.category) ?? [];
    list.push(issue);
    entry.issuesByCategory.set(issue.category, list);
    entry.total += 1;
  }

  const forecasts: Forecast[] = [];

  for (const [code, entry] of byCountry) {
    if (entry.total < 1) continue;
    const meta = countryNames.get(code);
    const nameKo =
      meta?.nameKo ??
      findLocation(entry.planet, code)?.nameKo ??
      code;
    const name =
      meta?.name ??
      findLocation(entry.planet, code)?.name ??
      COUNTRY_FALLBACK_NAME_EN[code] ??
      code;
    const flag =
      meta?.flag || entry.flag || PLANETS[entry.planet].emoji;

    for (const rule of RULES) {
      if (rule.planets && !rule.planets.includes(entry.planet)) continue;
      if (category && rule.category !== category) continue;

      const triggerHits = rule.triggerCategories.reduce(
        (sum, c) => sum + (entry.categories.get(c) ?? 0),
        0,
      );
      if (triggerHits < rule.minTriggerCount) continue;

      // confidence: base + 5 per extra trigger hit, cap 92
      const confidence = Math.min(
        92,
        rule.baseConfidence + (triggerHits - rule.minTriggerCount) * 5,
      );

      const ctx: HeadlineCtx = { name, nameKo, count: triggerHits };
      const evidence: ForecastEvidence[] = rule.triggerCategories
        .flatMap((c) => entry.issuesByCategory.get(c) ?? [])
        .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
        .slice(0, 5)
        .map((i) => ({
          id: i.id,
          headline: i.headline,
          category: i.category,
          publishedAt: i.publishedAt,
        }));
      forecasts.push({
        id: `fc_${entry.planet}_${code}_${rule.category}_${rule.horizon}`,
        planet: entry.planet,
        countryCode: code,
        countryFlag: flag,
        category: rule.category,
        headlineKo: rule.headlineKo(ctx),
        headlineEn: rule.headlineEn(ctx),
        confidence,
        horizon: rule.horizon,
        factors: rule.triggerCategories.filter((c) =>
          entry.categories.has(c),
        ),
        evidence,
      });
    }
  }

  // Sort by confidence desc, then horizon priority (24h first)
  const horizonRank: Record<Horizon, number> = { "24h": 0, week: 1, month: 2 };
  forecasts.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return horizonRank[a.horizon] - horizonRank[b.horizon];
  });

  return forecasts;
}
