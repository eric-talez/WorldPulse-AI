import { db, issuesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const CATEGORY_RULES: Array<{ category: string; patterns: RegExp[] }> = [
  {
    category: "cyber",
    patterns: [
      /\b(hack(ed|ing)?|ransomware|breach|cyber|phishing|malware|exploit|zero[- ]day|ddos)\b/i,
      /해킹|랜섬웨어|사이버|유출|취약점/,
    ],
  },
  {
    category: "terror",
    patterns: [
      /\b(terror|terrorist|bombing|gunman|hostage|extremist)\b/i,
      /테러|폭탄|인질/,
    ],
  },
  {
    category: "conflict",
    patterns: [
      /\b(war|military|missile|drone strike|troops|frontline|invasion|ceasefire|airstrike)\b/i,
      /전쟁|군사|미사일|휴전|공습|드론 공격/,
    ],
  },
  {
    category: "quake",
    patterns: [
      /\b(earthquake|tsunami|seismic|aftershock|magnitude\s*\d)\b/i,
      /지진|쓰나미|진도\s?\d|여진|규모\s?\d/,
    ],
  },
  {
    category: "storm",
    patterns: [
      /\b(hurricane|typhoon|flood(ing|s|ed)?|cyclone|tornado|storm surge|monsoon|torrential rain)\b/i,
      /태풍|홍수|폭우|호우|침수|사이클론|토네이도|장마/,
    ],
  },
  {
    category: "wildfire",
    patterns: [
      /\b(wildfire|bushfire|brush fire|forest fire|heatwave|heat wave)\b/i,
      /산불|들불|폭염|열파/,
    ],
  },
  {
    category: "volcano",
    patterns: [
      /\b(volcano|volcanic|eruption|lava flow|landslide|mudslide|rockslide)\b/i,
      /화산|분화|산사태|토사|용암/,
    ],
  },
  {
    category: "natural_disaster",
    patterns: [
      /\b(earthquake|tsunami|hurricane|typhoon|flood|wildfire|volcano|landslide|cyclone|tornado|natural disaster)\b/i,
      /지진|쓰나미|태풍|홍수|산불|화산|산사태|자연재해/,
    ],
  },
  {
    category: "climate",
    patterns: [
      /\b(climate|emissions|carbon|net[- ]zero|drought|heatwave|greenhouse)\b/i,
      /기후|탄소|배출|가뭄|폭염|온실가스/,
    ],
  },
  {
    category: "health",
    patterns: [
      /\b(hospital|healthcare|public health|mental health|vaccine|vaccination|surgery|clinic|medicare|nhs)\b/i,
      /병원|의료|보건|백신|접종|수술|정신건강|의료진/,
    ],
  },
  {
    category: "disease",
    patterns: [
      /\b(virus|outbreak|epidemic|pandemic|infection|measles|covid|influenza|dengue|cholera)\b/i,
      /바이러스|확산|감염|전염|독감|뎅기/,
    ],
  },
  {
    category: "ai_jobs",
    patterns: [
      /\b(ai|artificial intelligence|machine learning|llm|gpt|copilot)\b.*\b(hir(e|ing)|jobs?|layoff|workforce|wage|salary|engineer)\b/i,
      /\b(ai|artificial intelligence)\b/i,
      /AI|인공지능|채용|일자리|구조조정|연봉/,
    ],
  },
  {
    category: "tech",
    patterns: [
      /\b(startup|semiconductor|chip|robot|quantum|biotech|software|cloud|datacenter|fintech)\b/i,
      /스타트업|반도체|로봇|양자|클라우드|핀테크/,
    ],
  },
  {
    category: "diplomacy",
    patterns: [
      /\b(g7|g20|summit|diplomacy|diplomatic|treaty|sanction(s|ed)?|nato|united nations|un security council|foreign minister|bilateral|multilateral|alliance)\b/i,
      /정상회담|G20|G7|외교|외무|조약|제재|유엔|UN|NATO|동맹|회담/,
    ],
  },
  {
    category: "politics",
    patterns: [
      /\b(election|parliament|president|senate|congress|legislation|cabinet|minister|policy)\b/i,
      /대통령|총리|국회|선거|법안|장관|정책/,
    ],
  },
  {
    category: "energy",
    patterns: [
      /\b(oil|crude|gas pipeline|opec|electricity|power grid|power plant|nuclear plant|reactor|solar power|wind power|lng|renewable)\b/i,
      /석유|원유|천연가스|OPEC|전력|원전|원자력|태양광|풍력|LNG|재생에너지/,
    ],
  },
  {
    category: "economy",
    patterns: [
      /\b(stocks?|market|gdp|inflation|trade|economy|earnings|recession|exports?|imports?)\b/i,
      /증시|주가|경제|무역|수출|수입|물가|인플레이션|GDP/,
    ],
  },
  {
    category: "sports",
    patterns: [
      /\b(olympics?|world cup|fifa|nba|nfl|mlb|premier league|champions league|football|baseball|soccer|tournament|medal)\b/i,
      /올림픽|월드컵|NBA|MLB|프리미어리그|챔피언스리그|축구|야구|메달|결승전/,
    ],
  },
  {
    category: "education",
    patterns: [
      /\b(university|universities|college|school|students?|education|curriculum|tuition|exam|professor|graduation)\b/i,
      /대학|학교|학생|교육|입시|수능|교수|졸업|커리큘럼/,
    ],
  },
  {
    category: "culture",
    patterns: [
      /\b(film|movie|music|festival|museum|exhibition|concert|art|fashion)\b/i,
      /영화|음악|페스티벌|박물관|전시|콘서트|패션/,
    ],
  },
  {
    category: "society",
    patterns: [
      /\b(protest|rally|strike|labor union|crime|housing|homelessness|inequality|demonstration)\b/i,
      /시위|집회|파업|노조|범죄|주거|불평등|사회/,
    ],
  },
];

function classifyCategory(input: string): string {
  for (const rule of CATEGORY_RULES) {
    for (const p of rule.patterns) {
      if (p.test(input)) return rule.category;
    }
  }
  return "news";
}

const NEW_FINE_GRAINED = new Set([
  "quake",
  "storm",
  "wildfire",
  "volcano",
  "diplomacy",
  "energy",
  "health",
  "society",
  "sports",
  "education",
]);

async function main(): Promise<void> {
  const rows = await db
    .select({
      id: issuesTable.id,
      category: issuesTable.category,
      headline: issuesTable.headline,
      body: issuesTable.body,
    })
    .from(issuesTable);

  console.log(`scanning ${rows.length} issues rows`);

  const transitions = new Map<string, number>();
  const targetTotals = new Map<string, number>();
  let updated = 0;

  for (const row of rows) {
    const text = `${row.headline} ${row.body ?? ""}`;
    const next = classifyCategory(text);
    if (next === row.category) continue;
    if (!NEW_FINE_GRAINED.has(next)) continue;

    await db
      .update(issuesTable)
      .set({ category: next })
      .where(eq(issuesTable.id, row.id));

    updated += 1;
    const key = `${row.category} -> ${next}`;
    transitions.set(key, (transitions.get(key) ?? 0) + 1);
    targetTotals.set(next, (targetTotals.get(next) ?? 0) + 1);
  }

  console.log(`scanned=${rows.length} updated=${updated}`);
  if (updated === 0) {
    console.log("no rows needed re-tagging (idempotent re-run is safe)");
    return;
  }
  console.log("rows changed by new category:");
  for (const [cat, n] of [...targetTotals.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${cat}: ${n}`);
  }
  console.log("transitions:");
  for (const [k, v] of [...transitions.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${k}: ${v}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
