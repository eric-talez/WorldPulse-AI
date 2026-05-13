import { db, issuesTable, citiesTable, countriesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { logger } from "./logger";
import { SEED_CITIES } from "./citiesSeed";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

interface FeedSource {
  countryCode: string;
  url: string;
}

interface CityRow {
  id: string;
  countryCode: string;
  name: string;
  nameKo: string;
  latitude: number;
  longitude: number;
}

interface LocationAnchor {
  name: string;
  nameKo: string;
  latitude: number;
  longitude: number;
}

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
    category: "natural_disaster",
    patterns: [
      /\b(earthquake|tsunami|hurricane|typhoon|flood|wildfire|volcano|landslide|cyclone|tornado)\b/i,
      /지진|쓰나미|태풍|홍수|산불|화산|산사태/,
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
    category: "politics",
    patterns: [
      /\b(election|parliament|president|senate|congress|legislation|cabinet|minister|policy)\b/i,
      /대통령|총리|국회|선거|법안|장관|정책/,
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
    category: "culture",
    patterns: [
      /\b(film|movie|music|festival|museum|exhibition|concert|art|fashion)\b/i,
      /영화|음악|페스티벌|박물관|전시|콘서트|패션/,
    ],
  },
];

export function classifyCategory(input: string): string {
  for (const rule of CATEGORY_RULES) {
    for (const p of rule.patterns) {
      if (p.test(input)) return rule.category;
    }
  }
  return "news";
}

// Broad item-driven feeds. Google News country top-headlines (no API key).
// Each feed provides a default country code that is used as the country-level
// fallback when an item cannot be geolocated to a city.
const FEED_SOURCES: FeedSource[] = [
  { countryCode: "US", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en" },
  { countryCode: "KR", url: "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko" },
  { countryCode: "JP", url: "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja" },
  { countryCode: "CN", url: "https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans" },
  { countryCode: "GB", url: "https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en" },
  { countryCode: "DE", url: "https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de" },
  { countryCode: "FR", url: "https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr" },
  { countryCode: "IN", url: "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en" },
  { countryCode: "BR", url: "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419" },
  { countryCode: "RU", url: "https://news.google.com/rss?hl=ru&gl=RU&ceid=RU:ru" },
  { countryCode: "UA", url: "https://news.google.com/rss?hl=uk&gl=UA&ceid=UA:uk" },
  { countryCode: "IL", url: "https://news.google.com/rss?hl=en-IL&gl=IL&ceid=IL:en" },
  { countryCode: "SG", url: "https://news.google.com/rss?hl=en-SG&gl=SG&ceid=SG:en" },
  { countryCode: "AE", url: "https://news.google.com/rss?hl=en-AE&gl=AE&ceid=AE:en" },
];

// Anchors used to derive an item's geographic location from its text.
// Built from seeded cities; the same coords are then matched against the live
// citiesTable via haversine so newly-added cities still win the nearest match.
const LOCATION_ANCHORS: LocationAnchor[] = SEED_CITIES.map((c) => ({
  name: c.name,
  nameKo: c.nameKo,
  latitude: c.latitude,
  longitude: c.longitude,
}));

// Distance threshold (km). If the nearest city is farther than this from the
// detected anchor, we treat the item as country-level instead of forcing it
// onto an unrelated city.
const NEAREST_CITY_THRESHOLD_KM = 250;

const ITEMS_PER_FEED = 12;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, code: string) =>
      String.fromCharCode(Number(code)),
    );
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
  if (!m) return "";
  let val = m[1].trim();
  const cd = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(val);
  if (cd) val = cd[1];
  return decodeEntities(val).trim();
}

async function fetchRss(url: string, signal: AbortSignal): Promise<RssItem[]> {
  const res = await fetch(url, {
    signal,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; FutureMapNewsStream/1.0; +https://futuremap.ai)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });
  if (!res.ok) {
    throw new Error(`RSS ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const items: RssItem[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate: extractTag(block, "pubDate"),
      description: stripHtml(extractTag(block, "description")),
    });
  }
  return items;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Detect a geographic anchor by scanning the text for any known city/landmark
 * name (English or Korean). Returns null if no anchor mention is found.
 */
export function detectAnchor(text: string): LocationAnchor | null {
  const lower = text.toLowerCase();
  for (const a of LOCATION_ANCHORS) {
    if (a.name && lower.includes(a.name.toLowerCase())) return a;
    if (a.nameKo && text.includes(a.nameKo)) return a;
  }
  return null;
}

/**
 * Find the city in `cities` closest (by great-circle distance) to a given
 * lat/lon. Returns the city only when it falls within `thresholdKm`; otherwise
 * the caller should fall back to a country-level insert (cityId=null).
 */
export function nearestCity(
  cities: CityRow[],
  lat: number,
  lon: number,
  thresholdKm: number,
): { city: CityRow; distanceKm: number } | null {
  let best: { city: CityRow; distanceKm: number } | null = null;
  for (const c of cities) {
    const d = haversineKm(lat, lon, c.latitude, c.longitude);
    if (!best || d < best.distanceKm) best = { city: c, distanceKm: d };
  }
  if (!best || best.distanceKm > thresholdKm) return null;
  return best;
}

let timer: NodeJS.Timeout | null = null;
let cycleIndex = 0;
let running = false;

export interface NewsStreamCycleResult {
  inserted: number;
  cityTagged: number;
  countryFallback: number;
  feedsProcessed: number;
}

export async function runNewsStreamCycle(): Promise<NewsStreamCycleResult> {
  if (running) {
    logger.info("news stream cycle already running, skipping");
    return { inserted: 0, cityTagged: 0, countryFallback: 0, feedsProcessed: 0 };
  }
  running = true;
  try {
    const cities: CityRow[] = await db
      .select({
        id: citiesTable.id,
        countryCode: citiesTable.countryCode,
        name: citiesTable.name,
        nameKo: citiesTable.nameKo,
        latitude: citiesTable.latitude,
        longitude: citiesTable.longitude,
      })
      .from(citiesTable);
    const knownCountries = new Set(
      (await db.select({ code: countriesTable.code }).from(countriesTable)).map(
        (r) => r.code,
      ),
    );

    const batchSize = Math.max(
      1,
      Number(process.env["NEWS_STREAM_BATCH"] ?? 4),
    );
    const start = (cycleIndex * batchSize) % FEED_SOURCES.length;
    let batch = FEED_SOURCES.slice(start, start + batchSize);
    if (batch.length < batchSize) {
      batch = batch.concat(
        FEED_SOURCES.slice(0, batchSize - batch.length),
      );
    }
    cycleIndex += 1;

    let inserted = 0;
    let cityTagged = 0;
    let countryFallback = 0;

    for (const feed of batch) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const items = (await fetchRss(feed.url, controller.signal)).slice(
          0,
          ITEMS_PER_FEED,
        );
        if (items.length === 0) continue;

        const links = items.map((i) => i.link);
        const existing = await db
          .select({ sourceUrl: issuesTable.sourceUrl })
          .from(issuesTable)
          .where(inArray(issuesTable.sourceUrl, links));
        const seen = new Set(existing.map((e) => e.sourceUrl));
        const fresh = items.filter((i) => !seen.has(i.link));
        if (fresh.length === 0) continue;

        const rows: Array<typeof issuesTable.$inferInsert> = [];
        for (const i of fresh) {
          const text = `${i.title} ${i.description}`;
          const anchor = detectAnchor(text);
          let cityId: string | null = null;
          let countryCode = feed.countryCode;
          if (anchor) {
            const match = nearestCity(
              cities,
              anchor.latitude,
              anchor.longitude,
              NEAREST_CITY_THRESHOLD_KM,
            );
            if (match) {
              cityId = match.city.id;
              countryCode = match.city.countryCode;
              cityTagged += 1;
            } else {
              countryFallback += 1;
            }
          } else {
            countryFallback += 1;
          }
          // Skip items whose fallback country isn't in the seeded set —
          // the issues row would be orphaned in the UI.
          if (!cityId && !knownCountries.has(countryCode)) continue;

          const pub = i.pubDate ? new Date(i.pubDate) : new Date();
          rows.push({
            countryCode,
            cityId,
            planet: "earth",
            category: classifyCategory(text),
            headline: i.title.slice(0, 280),
            body: i.description ? i.description.slice(0, 600) : null,
            sourceUrl: i.link,
            publishedAt: Number.isNaN(pub.getTime()) ? new Date() : pub,
          });
        }

        if (rows.length > 0) {
          await db.insert(issuesTable).values(rows);
          inserted += rows.length;
        }
      } catch (err) {
        logger.warn(
          { err, feed: feed.url },
          "news stream feed fetch failed",
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    const result: NewsStreamCycleResult = {
      inserted,
      cityTagged,
      countryFallback,
      feedsProcessed: batch.length,
    };
    logger.info({ ...result, cycleIndex }, "news stream cycle complete");
    return result;
  } finally {
    running = false;
  }
}

export function startNewsStream(): void {
  if (timer) return;
  if (process.env["NEWS_STREAM_DISABLED"] === "1") {
    logger.info("news stream disabled via NEWS_STREAM_DISABLED");
    return;
  }
  if (process.env["NODE_ENV"] === "test") return;
  const intervalMin = Math.max(
    1,
    Number(process.env["NEWS_STREAM_INTERVAL_MIN"] ?? 15),
  );
  const intervalMs = intervalMin * 60 * 1000;
  setTimeout(() => {
    runNewsStreamCycle().catch((err) =>
      logger.warn({ err }, "news stream initial cycle failed"),
    );
  }, 30_000);
  timer = setInterval(() => {
    runNewsStreamCycle().catch((err) =>
      logger.warn({ err }, "news stream cycle failed"),
    );
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  logger.info({ intervalMin }, "news stream scheduler started");
}

export function stopNewsStream(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
