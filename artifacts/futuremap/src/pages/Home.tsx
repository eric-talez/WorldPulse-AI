import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/language";
import {
  useListCountries,
  useListIssues,
  useGetIssueSummary,
  useGetDashboardStats,
  useGetCountry,
  useListPlanets,
  useGetPlanetLocation,
  useListForecasts,
  useGetForecastAccuracy,
  useListCountryCities,
  useListCityIssues,
  useGetIssue,
  type Planet,
  type PlanetInfo,
  type PlanetLocation,
  type City,
  type Issue,
  type ListIssuesCategory,
  type ListForecastsCategory,
} from "@workspace/api-client-react";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  RotateCcw,
  Plus,
  Minus,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const countryDetailQueryKey = (code: string) =>
  [`/api/countries/${code}`] as const;

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
    Cesium: any;
  }
}

const CATEGORY_STYLE: Record<string, string> = {
  conflict: "bg-red-500/20 text-red-400 border-red-500/30",
  politics: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  economy: "bg-green-500/20 text-green-400 border-green-500/30",
  culture: "bg-white/10 text-white border-white/20",
  ai_jobs: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  disease: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  tech: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  news: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  natural_disaster: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  cyber: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  terror: "bg-rose-600/20 text-rose-400 border-rose-600/40",
  climate: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  space: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  lunar_base: "bg-slate-300/15 text-slate-200 border-slate-300/30",
  mars_habitat: "bg-red-700/20 text-red-300 border-red-700/40",
};
const CATEGORY_LABEL_KO: Record<string, string> = {
  conflict: "분쟁",
  politics: "정치",
  economy: "경제",
  culture: "문화",
  ai_jobs: "AI 일자리",
  disease: "질병",
  tech: "기술",
  news: "뉴스",
  natural_disaster: "자연재해",
  cyber: "사이버",
  terror: "테러",
  climate: "기후",
  space: "우주",
  lunar_base: "달 기지",
  mars_habitat: "화성 거주",
};
const CATEGORY_LABEL_EN: Record<string, string> = {
  conflict: "Conflict",
  politics: "Politics",
  economy: "Economy",
  culture: "Culture",
  ai_jobs: "AI Jobs",
  disease: "Disease",
  tech: "Tech",
  news: "News",
  natural_disaster: "Natural Disaster",
  cyber: "Cyber",
  terror: "Terror",
  climate: "Climate",
  space: "Space",
  lunar_base: "Lunar Base",
  mars_habitat: "Mars Habitat",
};
const catStyle = (c: string) =>
  CATEGORY_STYLE[c] ?? "bg-secondary text-muted-foreground border-border";
const catLabel = (c: string, lang: "ko" | "en") =>
  (lang === "ko" ? CATEGORY_LABEL_KO[c] : CATEGORY_LABEL_EN[c]) ??
  c.toUpperCase();

const planetLocationDetailKey = (planet: Planet, code: string) =>
  [`/api/planets/${planet}/locations/${code}`] as const;

const countryCitiesQueryKey = (code: string) =>
  [`/api/countries/${code}/cities`] as const;
const cityIssuesQueryKey = (id: string) =>
  [`/api/cities/${id}/issues`] as const;
const issueDetailQueryKey = (id: string) =>
  [`/api/issues/${id}`] as const;

// Tint Moon/Mars site pins by the dominant signal category, mirroring
// Earth's risk-tinted country pins. Falls back to the per-planet accent.
const SPACE_CATEGORY_COLOR: Record<string, string> = {
  ai_jobs: "#ef4444",
  mars_habitat: "#f59e0b",
  lunar_base: "#f59e0b",
  space: "#22d3ee",
  tech: "#10b981",
  news: "#0ea5e9",
  culture: "#a78bfa",
  conflict: "#ef4444",
  cyber: "#a855f7",
  climate: "#14b8a6",
};
const spaceCategoryColor = (
  category: string | null | undefined,
  planet: Planet,
): string => {
  if (category && SPACE_CATEGORY_COLOR[category]) {
    return SPACE_CATEGORY_COLOR[category];
  }
  return planet === "moon" ? "#cbd5f5" : "#ff7a59";
};

// Camera altitudes per drilldown level (meters)
const ALTITUDE_COUNTRY = 1_500_000;
const ALTITUDE_CITY = 50_000;
const ALTITUDE_EVENT = 25_000;

type ForecastEvidence = {
  id: string;
  category: string;
  headline: string;
  publishedAt: string;
};

type ForecastItem = {
  id: string;
  planet: Planet;
  countryFlag: string;
  category: string;
  headlineKo: string;
  headlineEn: string;
  confidence: number;
  horizon: string;
  factors: string[];
  evidence?: ForecastEvidence[];
};

function ForecastCard({
  fc,
  language,
  t,
  showFlag = true,
  showPlanetBadge = false,
  expanded = false,
  onToggleExpand,
}: {
  fc: ForecastItem;
  language: "ko" | "en";
  t: (ko: string, en: string) => string;
  showFlag?: boolean;
  showPlanetBadge?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const expandable = !!onToggleExpand;
  const horizonLabel =
    fc.horizon === "24h"
      ? t("향후 24시간", "Next 24 hours")
      : fc.horizon === "week"
        ? t("이번 주", "This week")
        : t("한 달 내", "Within a month");
  const confTier =
    fc.confidence >= 70
      ? { ko: "높음", en: "High", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" }
      : fc.confidence >= 50
        ? { ko: "보통", en: "Med", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" }
        : { ko: "낮음", en: "Low", cls: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
  const evidence = fc.evidence ?? [];
  return (
    <div
      onClick={expandable ? onToggleExpand : undefined}
      className={`p-3 bg-secondary/40 border rounded-lg transition-all ${
        expandable ? "cursor-pointer hover:bg-secondary/60" : ""
      } ${
        expandable && expanded
          ? "border-primary/60 ring-1 ring-primary/30"
          : expandable
            ? "border-border/50 hover:border-primary/40"
            : "border-border/50"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {showFlag && (
            <span className="text-lg leading-none">{fc.countryFlag}</span>
          )}
          {showPlanetBadge && (
            <span
              className="text-[10px] font-mono text-muted-foreground px-1 py-0.5 border border-border/50 rounded"
              title={
                fc.planet === "earth"
                  ? t("지구", "Earth")
                  : fc.planet === "moon"
                    ? t("달", "Moon")
                    : t("화성", "Mars")
              }
            >
              {fc.planet === "earth" ? "🌍" : fc.planet === "moon" ? "🌕" : "🔴"}
            </span>
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${catStyle(fc.category)}`}
          >
            {catLabel(fc.category, language)}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${confTier.cls}`}
          title={`${t("신뢰도", "Confidence")}: ${fc.confidence}%`}
        >
          {t(confTier.ko, confTier.en)} · {fc.confidence}%
        </span>
      </div>
      <h4 className="text-sm font-medium text-foreground/90">
        {language === "ko" ? fc.headlineKo : fc.headlineEn}
      </h4>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-mono uppercase text-primary/80 px-1.5 py-0.5 border border-primary/30 rounded">
          {horizonLabel}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t("근거", "Based on")}:
        </span>
        {fc.factors.map((f) => (
          <span
            key={f}
            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 border rounded ${catStyle(f)}`}
          >
            {catLabel(f, language)}
          </span>
        ))}
        {expandable && (
          <span className="ml-auto text-[10px] text-primary/70 hover:text-primary">
            {expanded
              ? t("근거 숨기기 ▲", "Hide evidence ▲")
              : t("근거 보기 ▼", "See evidence ▼")}
          </span>
        )}
      </div>
      {expandable && expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t(
              `최근 신호 ${evidence.length}건`,
              `${evidence.length} recent signals`,
            )}
          </div>
          {evidence.length === 0 && (
            <div className="text-[11px] text-muted-foreground italic">
              {t(
                "연결된 신호를 찾을 수 없습니다",
                "No linked signals found",
              )}
            </div>
          )}
          {evidence.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-2 p-2 bg-background/40 border border-border/30 rounded"
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded shrink-0 ${catStyle(ev.category)}`}
              >
                {catLabel(ev.category, language)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-foreground/90 leading-snug">
                  {ev.headline}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  {(() => {
                    try {
                      return formatDistanceToNow(new Date(ev.publishedAt), {
                        addSuffix: true,
                      });
                    } catch {
                      return ev.publishedAt;
                    }
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { t, language } = useLanguage();
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [cesiumLoaded, setCesiumLoaded] = useState(false);
  const viewerRef = useRef<any>(null);
  const [planet, setPlanet] = useState<Planet>("earth");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null,
  );
  const [selectedLocationCode, setSelectedLocationCode] = useState<
    string | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<
    ListIssuesCategory | undefined
  >(undefined);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [cityCategory, setCityCategory] = useState<string | undefined>(undefined);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("futuremap.rightCollapsed") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "futuremap.rightCollapsed",
        rightCollapsed ? "1" : "0",
      );
    } catch {
      // storage unavailable (private mode, quota, etc.) — ignore
    }
  }, [rightCollapsed]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [streamMode, setStreamMode] = useState<"live" | "predicted">("live");
  const [expandedForecastId, setExpandedForecastId] = useState<string | null>(
    null,
  );
  const [webglAvailable, setWebglAvailable] = useState(true);

  // Refs for stale-closure-safe access inside Cesium event handlers.
  const selectedIssueIdRef = useRef<string | null>(null);
  const selectedCityIdRef = useRef<string | null>(null);
  const selectedCountryCodeRef = useRef<string | null>(null);
  const selectedLocationCodeRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIssueIdRef.current = selectedIssueId;
  }, [selectedIssueId]);
  useEffect(() => {
    selectedCityIdRef.current = selectedCityId;
  }, [selectedCityId]);
  useEffect(() => {
    selectedCountryCodeRef.current = selectedCountryCode;
  }, [selectedCountryCode]);
  useEffect(() => {
    selectedLocationCodeRef.current = selectedLocationCode;
  }, [selectedLocationCode]);

  // Reset left panel collapse state when a new selection is made
  useEffect(() => {
    setLeftCollapsed(false);
  }, [selectedCountryCode, selectedLocationCode, selectedIssueId, selectedCityId]);

  // ---- URL <-> state sync (?planet=&country=&city=&issue=) ----
  // Read once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("planet") as Planet | null;
    if (p === "earth" || p === "moon" || p === "mars") setPlanet(p);
    const country = params.get("country");
    if (country) setSelectedCountryCode(country);
    const loc = params.get("location");
    if (loc) setSelectedLocationCode(loc);
    const city = params.get("city");
    if (city) setSelectedCityId(city);
    const issue = params.get("issue");
    if (issue) setSelectedIssueId(issue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write whenever drilldown state changes.
  useEffect(() => {
    const params = new URLSearchParams();
    if (planet !== "earth") params.set("planet", planet);
    if (selectedCountryCode) params.set("country", selectedCountryCode);
    if (selectedLocationCode) params.set("location", selectedLocationCode);
    if (selectedCityId) params.set("city", selectedCityId);
    if (selectedIssueId) params.set("issue", selectedIssueId);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [planet, selectedCountryCode, selectedLocationCode, selectedCityId, selectedIssueId]);

  // Collapse any expanded forecast when the relevant filters change
  useEffect(() => {
    setExpandedForecastId(null);
  }, [planet, selectedCategory, streamMode]);

  const { data: planets } = useListPlanets();
  const planetInfo: PlanetInfo | undefined = useMemo(
    () => planets?.find((p) => p.planet === planet),
    [planets, planet],
  );

  const { data: stats } = useGetDashboardStats({ planet });
  const { data: issues } = useListIssues({
    planet,
    category: selectedCategory,
    limit: 50,
  });
  const { data: issueSummary } = useGetIssueSummary({ planet });
  const { data: forecastAccuracy } = useGetForecastAccuracy(
    { planet },
    {
      query: {
        enabled: streamMode === "predicted",
        queryKey: [`/api/forecasts/accuracy`, planet] as const,
      },
    },
  );
  const { data: forecasts } = useListForecasts(
    {
      planet,
      category: selectedCategory as ListForecastsCategory | undefined,
    },
    {
      query: {
        enabled: streamMode === "predicted",
        queryKey: [`/api/forecasts`, planet, selectedCategory ?? "all"] as const,
      },
    },
  );
  const { data: countries } = useListCountries();
  const { data: countryDetail } = useGetCountry(selectedCountryCode || "", {
    query: {
      enabled: planet === "earth" && !!selectedCountryCode,
      queryKey: countryDetailQueryKey(selectedCountryCode || ""),
    },
  });
  const activePanelCode =
    planet === "earth" ? selectedCountryCode : selectedLocationCode;
  const { data: panelForecasts } = useListForecasts(
    {
      planet,
      countryCode: activePanelCode ?? undefined,
    },
    {
      query: {
        enabled: !!activePanelCode,
        queryKey: [
          `/api/forecasts`,
          planet,
          "panel",
          activePanelCode ?? "",
        ] as const,
      },
    },
  );
  const { data: locationDetail } = useGetPlanetLocation(
    planet,
    selectedLocationCode || "",
    {
      query: {
        enabled: planet !== "earth" && !!selectedLocationCode,
        queryKey: planetLocationDetailKey(planet, selectedLocationCode || ""),
      },
    },
  );
  // Cities also back Moon/Mars sub-locations ("sites") — countryCode there
  // is the parent location code (e.g. "MOON-ARTEMIS"). Use activePanelCode so
  // the same flow works on Earth and in space.
  const { data: countryCities } = useListCountryCities(
    activePanelCode || "",
    {
      query: {
        enabled: !!activePanelCode,
        queryKey: countryCitiesQueryKey(activePanelCode || ""),
      },
    },
  );
  const { data: cityIssues } = useListCityIssues(selectedCityId || "", {
    query: {
      enabled: !!selectedCityId,
      queryKey: cityIssuesQueryKey(selectedCityId || ""),
    },
  });
  const selectedCity: City | undefined = useMemo(
    () => countryCities?.find((c) => c.id === selectedCityId),
    [countryCities, selectedCityId],
  );
  // Reset city category filter when switching city.
  useEffect(() => {
    setCityCategory(undefined);
  }, [selectedCityId]);
  const filteredCityIssues = useMemo(
    () =>
      cityIssues?.filter((i) => !cityCategory || i.category === cityCategory) ??
      [],
    [cityIssues, cityCategory],
  );
  const cityCategorySummary = useMemo(() => {
    const counts = new Map<string, number>();
    cityIssues?.forEach((i) =>
      counts.set(i.category, (counts.get(i.category) ?? 0) + 1),
    );
    return Array.from(counts.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }, [cityIssues]);

  // Authoritative event detail — independent of the global stream so
  // city-only or stale-list selections always resolve.
  const { data: issueDetail } = useGetIssue(selectedIssueId || "", {
    query: {
      enabled: !!selectedIssueId,
      queryKey: issueDetailQueryKey(selectedIssueId || ""),
    },
  });

  // Reset selections + category filter on planet switch.
  // Skip the initial mount so URL hydration (e.g. ?planet=moon&location=...)
  // is preserved on share/reload.
  const planetMountedRef = useRef(false);
  useEffect(() => {
    if (!planetMountedRef.current) {
      planetMountedRef.current = true;
      return;
    }
    setSelectedCountryCode(null);
    setSelectedLocationCode(null);
    setSelectedCityId(null);
    setSelectedIssueId(null);
    setSelectedCategory(undefined);
  }, [planet]);

  // If country / location is cleared, also clear city / site.
  useEffect(() => {
    if (!selectedCountryCode && !selectedLocationCode) setSelectedCityId(null);
  }, [selectedCountryCode, selectedLocationCode]);

  // Load Cesium SDK once.
  useEffect(() => {
    const swallow = (ev: ErrorEvent | PromiseRejectionEvent) => {
      const msg = String(
        (ev as ErrorEvent).message ??
          (ev as PromiseRejectionEvent).reason ??
          "",
      );
      if (
        /cesium|webgl|CesiumWidget|constructing|viewer|unknown runtime|imagery/i.test(
          msg,
        )
      ) {
        ev.stopImmediatePropagation?.();
        ev.preventDefault?.();
      }
    };
    window.addEventListener("error", swallow, true);
    window.addEventListener("unhandledrejection", swallow as any, true);

    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href =
      "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/Widgets/widgets.css";
    document.head.appendChild(styleLink);

    const style = document.createElement("style");
    style.innerHTML = `
      .cesium-viewer-bottom { display: none !important; }
      .cesium-widget-credits { display: none !important; }
    `;
    document.head.appendChild(style);

    const probe = document.createElement("canvas");
    const gl =
      probe.getContext("webgl2") ||
      probe.getContext("webgl") ||
      probe.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL unavailable");
      setWebglAvailable(false);
      return;
    }

    window.CESIUM_BASE_URL =
      "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/";

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/Cesium.js";
    script.onload = () => setCesiumLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(style);
      if (document.head.contains(styleLink))
        document.head.removeChild(styleLink);
      window.removeEventListener("error", swallow, true);
      window.removeEventListener("unhandledrejection", swallow as any, true);
    };
  }, []);

  // (Re)build viewer when SDK is loaded, planet metadata changes, or planet switches.
  useEffect(() => {
    if (!cesiumLoaded || !planetInfo || !cesiumContainer.current) return;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    // Tear down previous viewer
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
      } catch {
        // ignore
      }
      viewerRef.current = null;
      setGlobeReady(false);
    }

    try {
      const radius = planetInfo.ellipsoidRadius;
      const ellipsoid = new Cesium.Ellipsoid(radius, radius, radius);

      let imageryProvider: any = null;
      try {
        if (planet === "earth") {
          // ESRI World Imagery — public, no token, WebMercator. Replaces Cesium ion default
          // (which requires an access token and otherwise leaves Earth as a flat baseColor).
          imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            maximumLevel: 18,
            credit: "Esri, Maxar, Earthstar Geographics",
          });
        } else if (planetInfo.imageryUrl) {
          // NASA Trek WMTS (default028mm) — Geographic 2x1 tiling, max ~7.
          imageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: planetInfo.imageryUrl,
            tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid }),
            tileWidth: 256,
            tileHeight: 256,
            maximumLevel: 7,
            credit: "NASA Trek",
          });
        }
      } catch {
        imageryProvider = null;
      }

      // Degrade gracefully: if tiles 404 / network-fail, log once and let the
      // baseColor globe + markers remain visible instead of cascading errors.
      if (imageryProvider && imageryProvider.errorEvent) {
        let warned = false;
        imageryProvider.errorEvent.addEventListener((err: any) => {
          if (!warned) {
            warned = true;
            console.warn(`Imagery load failed for ${planet}:`, err?.message ?? err);
          }
        });
      }

      const viewerOptions: any = {
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        globe: new Cesium.Globe(ellipsoid),
        // Earth gets Cesium's built-in starfield skyBox + atmosphere shell for the
        // cinematic "view from orbit" look. Moon/Mars stay on the dark backgroundColor
        // (no atmosphere) so they read as airless bodies.
        skyBox: planet === "earth" ? undefined : false,
        skyAtmosphere: planet === "earth" ? undefined : false,
      };
      if (imageryProvider) {
        viewerOptions.imageryProvider = imageryProvider;
      } else {
        // Explicitly disable default ion imagery only when we have nothing —
        // otherwise Cesium would attempt an ion request without a token.
        viewerOptions.imageryProvider = false;
      }

      const viewer = new Cesium.Viewer(cesiumContainer.current, viewerOptions);

      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(
        planetInfo.baseColor,
      );
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#05070d");
      viewer.scene.globe.showGroundAtmosphere = planet === "earth";
      // Earth uses sun-based shading so the day/night terminator reads as a
      // real photograph; the night hemisphere is rescued by a NASA GIBS
      // city-lights overlay (added below) plus a non-zero base nightAlpha so
      // continents stay visible on the dark side.
      viewer.scene.globe.enableLighting = planet === "earth";

      if (planet === "earth") {
        // Cinematic atmospherics — all free, no ion token required.
        const scene: any = viewer.scene;
        const globe: any = scene.globe;
        if ("dynamicAtmosphereLighting" in globe) {
          globe.dynamicAtmosphereLighting = true;
        }
        if ("dynamicAtmosphereLightingFromSun" in globe) {
          globe.dynamicAtmosphereLightingFromSun = true;
        }
        // Atmosphere shell tint (the blue rim visible from space).
        if (scene.skyAtmosphere) {
          scene.skyAtmosphere.hueShift = -0.02;
          scene.skyAtmosphere.saturationShift = 0.15;
          scene.skyAtmosphere.brightnessShift = 0.1;
        }
        // Soft horizon fog when zoomed close.
        if (scene.fog) {
          scene.fog.enabled = true;
          scene.fog.density = 1.2e-4;
        }
        // Bright ground atmosphere halo, tuned for the lit Earth.
        if ("atmosphereLightIntensity" in globe) globe.atmosphereLightIntensity = 12;
      }

      const baseLayer = viewer.imageryLayers.get(0);
      if (baseLayer) {
        // Render imagery at natural color so each body looks like its real
        // photographs (ESRI World Imagery for Earth, NASA LRO mosaic for the
        // Moon, NASA Viking color mosaic for Mars). No brightness/contrast/
        // saturation overrides — those were making the surfaces look filtered.
        baseLayer.brightness = 1.0;
        baseLayer.contrast = 1.0;
        baseLayer.saturation = 1.0;
        baseLayer.gamma = 1.0;
        if (planet === "earth") {
          // With sun-based lighting on, dim the day-side imagery slightly on
          // the night hemisphere so the terminator is visible but continents
          // don't disappear into pure black.
          baseLayer.dayAlpha = 1.0;
          baseLayer.nightAlpha = 0.45;
        }
      }

      // Earth-only reference overlay: country borders, place names and roads from
      // ESRI's free "World_Boundaries_and_Places" tile service. Provides the
      // cartographic detail that real D5/Cesium scenes get from labeled basemaps,
      // again with no ion token required.
      if (planet === "earth") {
        try {
          const labelsProvider = new Cesium.UrlTemplateImageryProvider({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            maximumLevel: 12,
            credit: "Esri Reference",
          });
          if (labelsProvider.errorEvent) {
            let warnedLabels = false;
            labelsProvider.errorEvent.addEventListener(() => {
              if (!warnedLabels) {
                warnedLabels = true;
                console.warn("Earth label overlay failed to load; continuing without labels.");
              }
            });
          }
          const labelsLayer = viewer.imageryLayers.addImageryProvider(labelsProvider);
          labelsLayer.alpha = 0.85;
          labelsLayer.brightness = 1.1;
        } catch (err) {
          console.warn("Could not attach Earth label overlay:", err);
        }

        // NASA GIBS VIIRS city-lights composite (2012 snapshot, public, no key).
        // Combined with `globe.enableLighting = true`, the layer's
        // `dayAlpha = 0` / `nightAlpha = 1` confines it to the night side, so
        // continents glow with city lights instead of disappearing into black.
        try {
          const nightLightsProvider = new Cesium.UrlTemplateImageryProvider({
            url: "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_CityLights_2012/default/500m/{z}/{y}/{x}.jpg",
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileWidth: 512,
            tileHeight: 512,
            maximumLevel: 8,
            credit: "NASA GIBS / Earth Observatory",
          });
          if (nightLightsProvider.errorEvent) {
            let warnedNight = false;
            nightLightsProvider.errorEvent.addEventListener(() => {
              if (!warnedNight) {
                warnedNight = true;
                console.warn("Night-lights overlay failed to load; continuing without it.");
              }
            });
          }
          const nightLayer = viewer.imageryLayers.addImageryProvider(nightLightsProvider);
          // Only render on the night hemisphere; brighten lights a touch.
          nightLayer.dayAlpha = 0.0;
          nightLayer.nightAlpha = 1.0;
          nightLayer.brightness = 1.4;
        } catch (err) {
          console.warn("Could not attach Earth night-lights overlay:", err);
        }
      }

      let isRotating = true;
      const rotateListener = () => {
        if (isRotating) {
          viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0003);
        }
      };
      viewer.scene.preRender.addEventListener(rotateListener);

      // Hide entities (pins + labels) sitting on the far side of the globe so
      // the user no longer sees a constellation of pins bleeding through the
      // sphere when they spin it. Selected pin is always kept visible so the
      // user does not lose their context if they rotate after selecting.
      const occluder = new Cesium.EllipsoidalOccluder(
        ellipsoid,
        viewer.camera.positionWC,
      );
      let lastOcclusionTime = 0;
      let lastRealignTime = 0;
      const isEntitySelected = (id: any): boolean => {
        if (!id) return false;
        if (id.cityId && id.cityId === selectedCityIdRef.current) return true;
        if (id.countryCode && id.countryCode === selectedCountryCodeRef.current)
          return true;
        if (id.locationCode && id.locationCode === selectedLocationCodeRef.current)
          return true;
        return false;
      };
      // When a selected pin rotates behind the globe (e.g. user spun the
      // planet after selecting), auto-fly the camera back to face it. This
      // is the "selected pin must remain understandable when occluded"
      // contract from the task spec — depth testing means we cannot just
      // keep drawing the pin through the sphere, so we restore the user's
      // line-of-sight instead. Debounced to 2s so we do not fight the
      // user's own dragging.
      const realignToSelected = (pos: any) => {
        const now = performance.now();
        if (now - lastRealignTime < 2000) return;
        lastRealignTime = now;
        const carto = Cesium.Cartographic.fromCartesian(pos, ellipsoid);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const height = Math.max(
          viewer.camera.positionCartographic.height,
          ALTITUDE_COUNTRY,
        );
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
          duration: 1.0,
        });
      };
      const occlusionListener = () => {
        const now = performance.now();
        // Throttle to ~30fps; cheap, but avoids work on every preRender frame
        // when requestRenderMode kicks in repeatedly during a flyTo.
        if (now - lastOcclusionTime < 33) return;
        lastOcclusionTime = now;
        occluder.cameraPosition = viewer.camera.positionWC;
        const entities = viewer.entities.values;
        let selectedHiddenPos: any = null;
        for (let i = 0; i < entities.length; i++) {
          const ent: any = entities[i];
          if (!ent.position) continue;
          const pos = ent.position.getValue
            ? ent.position.getValue(viewer.clock.currentTime)
            : ent.position;
          if (!pos) continue;
          const visible = occluder.isPointVisible(pos);
          if (isEntitySelected(ent)) {
            // Selected entity stays "shown" in the entity collection, but
            // because depth testing is on, the globe will still occlude it
            // when behind the horizon. We mark its hidden state so we can
            // realign the camera below, and shrink/desaturate any visible
            // chrome so it doesn't read as a duplicate when partially hit.
            ent.show = true;
            if (ent.point) {
              ent.point.pixelSize = visible
                ? ent._fmFullSize ?? ent.point.pixelSize
                : 6;
            }
            if (!visible && !selectedHiddenPos) selectedHiddenPos = pos;
            continue;
          }
          if (ent.show !== visible) ent.show = visible;
        }
        viewer.scene.requestRender();
        // Auto-realign the camera once when the selected pin has rotated
        // out of sight. Skipped while a flyTo is already in flight (the
        // 2s debounce above absorbs that).
        if (selectedHiddenPos) realignToSelected(selectedHiddenPos);
      };
      viewer.scene.preRender.addEventListener(occlusionListener);

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction(() => {
        isRotating = false;
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      handler.setInputAction(() => {
        isRotating = false;
      }, Cesium.ScreenSpaceEventType.WHEEL);

      handler.setInputAction((click: any) => {
        const picked = viewer.scene.pick(click.position);
        if (Cesium.defined(picked) && picked.id) {
          const id = picked.id;
          if (id.cityId) {
            setSelectedIssueId(null);
            setSelectedCityId(id.cityId);
            isRotating = false;
            return;
          }
          if (id.countryCode) {
            setSelectedIssueId(null);
            setSelectedCityId(null);
            setSelectedCountryCode(id.countryCode);
            setSelectedLocationCode(null);
            isRotating = false;
            return;
          }
          if (id.locationCode) {
            setSelectedIssueId(null);
            setSelectedLocationCode(id.locationCode);
            setSelectedCountryCode(null);
            isRotating = false;
            return;
          }
        }
        // Background click: drill back up one level (read latest via refs).
        if (selectedIssueIdRef.current) {
          setSelectedIssueId(null);
        } else if (selectedCityIdRef.current) {
          setSelectedCityId(null);
        } else if (
          selectedCountryCodeRef.current ||
          selectedLocationCodeRef.current
        ) {
          setSelectedCountryCode(null);
          setSelectedLocationCode(null);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Frame the planet
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, radius * 3.5),
        duration: 0,
      });

      viewerRef.current = viewer;
      setGlobeReady(true);

      return () => {
        try {
          viewer.scene.preRender.removeEventListener(rotateListener);
        } catch {
          // viewer may already be destroyed
        }
        try {
          viewer.scene.preRender.removeEventListener(occlusionListener);
        } catch {
          // ignore
        }
        try {
          handler.destroy();
        } catch {
          // ignore
        }
        try {
          if (!viewer.isDestroyed()) viewer.destroy();
        } catch {
          // ignore
        }
        if (viewerRef.current === viewer) {
          viewerRef.current = null;
          setGlobeReady(false);
        }
      };
    } catch (e) {
      console.warn("Cesium init failed:", e);
    }
    return undefined;
  }, [cesiumLoaded, planetInfo, planet]);

  // Sync Earth pins / Moon-Mars markers
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!globeReady || !viewer || !planetInfo) return;
    const Cesium = window.Cesium;
    viewer.entities.removeAll();

    if (planet === "earth" && countries) {
      // City pins when a country is selected and cities have loaded.
      if (selectedCountryCode && countryCities && countryCities.length > 0) {
        countryCities.forEach((city) => {
          const ent: any = viewer.entities.add({
            id: `city-${city.id}`,
            cityId: city.id,
            position: Cesium.Cartesian3.fromDegrees(city.longitude, city.latitude),
            point: {
              pixelSize: 9,
              color: Cesium.Color.fromCssColorString("#22d3ee").withAlpha(0.9),
              outlineColor: Cesium.Color.fromCssColorString("#22d3ee"),
              outlineWidth: 2,
            },
            label: {
              text: language === "ko" ? city.nameKo : city.name,
              font: "11px sans-serif",
              fillColor: Cesium.Color.fromCssColorString("#e5e7eb"),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -16),
              scale: 0.85,
            },
          });
          ent._fmFullSize = 9;
        });
      }
      countries.forEach((country) => {
        let colorStr = "#0ea5e9";
        if (country.riskScore > 75) colorStr = "#ef4444";
        else if (country.riskScore > 50) colorStr = "#f59e0b";

        const size = 8 + country.riskScore / 20;
        const ent: any = viewer.entities.add({
          id: `pin-${country.code}`,
          countryCode: country.code,
          position: Cesium.Cartesian3.fromDegrees(
            country.longitude,
            country.latitude,
          ),
          point: {
            pixelSize: size,
            color:
              Cesium.Color.fromCssColorString(colorStr).withAlpha(0.85),
            outlineColor: Cesium.Color.fromCssColorString(colorStr),
            outlineWidth: 2,
          },
        });
        ent._fmFullSize = size;
      });
    } else if (planet !== "earth") {
      // Site (sub-location) pins when a location is selected and sites loaded.
      if (selectedLocationCode && countryCities && countryCities.length > 0) {
        countryCities.forEach((site) => {
          const tint = spaceCategoryColor(site.dominantCategory ?? null, planet);
          const count = site.signalCount ?? 0;
          const size = 8 + Math.min(count, 6);
          const ent: any = viewer.entities.add({
            id: `site-${site.id}`,
            cityId: site.id,
            position: Cesium.Cartesian3.fromDegrees(site.longitude, site.latitude),
            point: {
              pixelSize: size,
              color: Cesium.Color.fromCssColorString(tint).withAlpha(0.9),
              outlineColor: Cesium.Color.fromCssColorString(tint),
              outlineWidth: 2,
            },
            label: {
              text: language === "ko" ? site.nameKo : site.name,
              font: "11px sans-serif",
              fillColor: Cesium.Color.fromCssColorString("#e5e7eb"),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -16),
              scale: 0.85,
            },
          });
          ent._fmFullSize = size;
        });
      }
      planetInfo.locations.forEach((loc) => {
        const accent = planet === "moon" ? "#cbd5f5" : "#ff7a59";
        const ent: any = viewer.entities.add({
          id: `loc-${loc.code}`,
          locationCode: loc.code,
          position: Cesium.Cartesian3.fromDegrees(loc.longitude, loc.latitude),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString(accent).withAlpha(0.9),
            outlineColor: Cesium.Color.fromCssColorString(accent),
            outlineWidth: 2,
          },
          label: {
            text: language === "ko" ? loc.nameKo : loc.name,
            font: "11px sans-serif",
            fillColor: Cesium.Color.fromCssColorString("#e5e7eb"),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            scale: 0.9,
          },
        });
        ent._fmFullSize = 12;
      });
    }
  }, [globeReady, planetInfo, planet, countries, language, selectedCountryCode, selectedLocationCode, countryCities]);

  // Fly to selected country / city / event on Earth
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !globeReady || planet !== "earth") return;
    const Cesium = window.Cesium;

    // Event level: prefer authoritative issue detail, then city issues,
    // then the global stream (covers fresh page loads from a shared URL).
    if (selectedIssueId) {
      const issue =
        issueDetail ??
        cityIssues?.find((i) => i.id === selectedIssueId) ??
        issues?.find((i) => i.id === selectedIssueId);
      const city = countryCities?.find((c) => c.id === issue?.cityId);
      const country = countries?.find((c) => c.code === issue?.countryCode);
      const lon = city?.longitude ?? country?.longitude;
      const lat = city?.latitude ?? country?.latitude;
      if (lon != null && lat != null) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, ALTITUDE_EVENT),
          duration: 1.0,
        });
        return;
      }
    }

    if (selectedCityId) {
      const city = countryCities?.find((c) => c.id === selectedCityId);
      if (city) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            city.longitude,
            city.latitude,
            ALTITUDE_CITY,
          ),
          duration: 1.2,
        });
        return;
      }
    }

    if (selectedCountryCode) {
      const country = countries?.find((c) => c.code === selectedCountryCode);
      if (country) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            country.longitude,
            country.latitude,
            ALTITUDE_COUNTRY,
          ),
          duration: 1.2,
        });
      }
    }
  }, [
    selectedCountryCode,
    selectedCityId,
    selectedIssueId,
    issueDetail,
    countries,
    countryCities,
    cityIssues,
    issues,
    globeReady,
    planet,
  ]);

  // Fly to selected location / site / event on Moon or Mars.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (
      !viewer ||
      !globeReady ||
      planet === "earth" ||
      !planetInfo
    )
      return;
    const Cesium = window.Cesium;

    if (selectedIssueId) {
      const issue =
        issueDetail ??
        cityIssues?.find((i) => i.id === selectedIssueId) ??
        issues?.find((i) => i.id === selectedIssueId);
      const site = countryCities?.find((c) => c.id === issue?.cityId);
      const loc = planetInfo.locations.find(
        (l) => l.code === (issue?.countryCode ?? selectedLocationCode),
      );
      const lon = site?.longitude ?? loc?.longitude;
      const lat = site?.latitude ?? loc?.latitude;
      if (lon != null && lat != null) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, ALTITUDE_EVENT),
          duration: 1.0,
        });
        return;
      }
    }

    if (selectedCityId) {
      const site = countryCities?.find((c) => c.id === selectedCityId);
      if (site) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            site.longitude,
            site.latitude,
            ALTITUDE_CITY,
          ),
          duration: 1.2,
        });
        return;
      }
    }

    if (selectedLocationCode) {
      const loc = planetInfo.locations.find(
        (l) => l.code === selectedLocationCode,
      );
      if (loc) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            loc.longitude,
            loc.latitude,
            ALTITUDE_CITY,
          ),
          duration: 1.2,
        });
      }
    }
  }, [
    selectedLocationCode,
    selectedCityId,
    selectedIssueId,
    issueDetail,
    countryCities,
    cityIssues,
    issues,
    planetInfo,
    planet,
    globeReady,
  ]);

  const handleIssueClick = (
    issueId: string,
    issueCountryCode: string,
    issueCityId?: string | null,
  ) => {
    setSelectedIssueId(issueId);
    if (planet === "earth") {
      setSelectedCountryCode(issueCountryCode);
      setSelectedLocationCode(null);
      if (issueCityId) setSelectedCityId(issueCityId);
    } else {
      // For Moon/Mars the issue's "countryCode" is the parent location code
      // (sites live under that location with countryCode = location code).
      setSelectedLocationCode(issueCountryCode);
      setSelectedCountryCode(null);
      if (issueCityId) setSelectedCityId(issueCityId);
    }
  };

  // Navigation controls (click-only)
  const goHome = () => {
    setSelectedIssueId(null);
    setSelectedCityId(null);
    setSelectedCountryCode(null);
    setSelectedLocationCode(null);
    const viewer = viewerRef.current;
    if (viewer && planetInfo) {
      const Cesium = window.Cesium;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          0,
          0,
          planetInfo.ellipsoidRadius * 3.5,
        ),
        duration: 1.2,
      });
    }
  };
  const goBack = () => {
    if (selectedIssueId) {
      setSelectedIssueId(null);
      return;
    }
    if (selectedCityId) {
      setSelectedCityId(null);
      return;
    }
    if (selectedCountryCode || selectedLocationCode) {
      setSelectedCountryCode(null);
      setSelectedLocationCode(null);
      return;
    }
  };
  const zoomBy = (factor: number) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const Cesium = window.Cesium;
    const cartographic = viewer.camera.positionCartographic;
    const height = cartographic.height;
    if (factor > 1) viewer.camera.zoomOut(height * (factor - 1));
    else viewer.camera.zoomIn(height * (1 - factor));
    void Cesium;
  };

  // Resolve selected issue from any known source, preferring the
  // authoritative detail endpoint, then city issues, then global stream.
  const selectedIssue: Issue | null =
    issueDetail ??
    cityIssues?.find((i) => i.id === selectedIssueId) ??
    issues?.find((i) => i.id === selectedIssueId) ??
    null;

  const issueThumbnail = (id: string) =>
    `https://picsum.photos/seed/${encodeURIComponent(id)}/640/320`;
  const showIssuePanel = !!selectedIssue;
  const showCityPanel =
    !showIssuePanel && !!selectedCityId && !!selectedCity;
  const showCountryPanel =
    !showIssuePanel &&
    !showCityPanel &&
    planet === "earth" &&
    !!selectedCountryCode &&
    !!countryDetail;
  const showLocationPanel =
    !showIssuePanel &&
    !showCityPanel &&
    planet !== "earth" &&
    !!selectedLocationCode &&
    !!locationDetail;
  const showLeftPanel =
    showIssuePanel || showCityPanel || showCountryPanel || showLocationPanel;

  // Breadcrumb crumbs (click-only navigation)
  const crumbs: { label: string; onClick: () => void; current?: boolean }[] = [];
  if (planetInfo) {
    crumbs.push({
      label: `${planetInfo.emoji} ${language === "ko" ? planetInfo.labelKo : planetInfo.label}`,
      onClick: goHome,
      current:
        !selectedCountryCode &&
        !selectedLocationCode &&
        !selectedCityId &&
        !selectedIssueId,
    });
  }
  if (planet === "earth" && selectedCountryCode && countryDetail) {
    crumbs.push({
      label: `${countryDetail.country.flag} ${language === "ko" ? countryDetail.country.nameKo : countryDetail.country.name}`,
      onClick: () => {
        setSelectedIssueId(null);
        setSelectedCityId(null);
      },
      current: !selectedCityId && !selectedIssueId,
    });
  }
  if (planet !== "earth" && selectedLocationCode && locationDetail) {
    crumbs.push({
      label: `${locationDetail.location.flag} ${language === "ko" ? locationDetail.location.nameKo : locationDetail.location.name}`,
      onClick: () => {
        setSelectedIssueId(null);
        setSelectedCityId(null);
      },
      current: !selectedCityId && !selectedIssueId,
    });
  }
  if (selectedCity) {
    crumbs.push({
      label: language === "ko" ? selectedCity.nameKo : selectedCity.name,
      onClick: () => setSelectedIssueId(null),
      current: !selectedIssueId,
    });
  }
  if (selectedIssue) {
    const eventLabel =
      selectedIssue.headline.length > 28
        ? selectedIssue.headline.slice(0, 27) + "…"
        : selectedIssue.headline;
    crumbs.push({ label: eventLabel, onClick: () => {}, current: true });
  }

  const planetSignals = planetInfo?.signalCategories ?? [];
  const filteredSummary = issueSummary?.filter((s) =>
    planet === "earth" || planetSignals.length === 0
      ? true
      : planetSignals.includes(s.category),
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0a0f1c] relative overflow-hidden">
      {/* System HUD overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur border border-border/50 p-3 rounded-lg pointer-events-auto">
          <div className="text-[10px] font-mono text-primary mb-1 tracking-widest">
            SYSTEM STATUS: NOMINAL
          </div>
          <div className="text-xs font-medium text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {planetInfo
              ? language === "ko"
                ? `${planetInfo.labelKo} · ${planetInfo.taglineKo ?? ""}`
                : `${planetInfo.label} · ${planetInfo.tagline ?? ""}`
              : t("실시간 데이터 스트림", "Live Data Stream Active")}
          </div>
        </div>
      </div>

      {/* Breadcrumb (click-only drilldown nav) */}
      {crumbs.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 max-w-[60vw] md:max-w-[55vw] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 pointer-events-auto overflow-x-auto whitespace-nowrap shadow-lg shadow-black/40">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                )}
                <button
                  onClick={c.onClick}
                  disabled={c.current}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                    c.current
                      ? "text-primary cursor-default"
                      : "text-foreground/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {c.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Bottom-right click-only controls (Home / Back / Zoom +/-).
          Anchored to the right of the signal-stream rail on desktop so the
          buttons stay flush with the rest of the HUD chrome. */}
      <div className="absolute bottom-4 right-4 md:right-[360px] lg:right-[410px] z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={goHome}
          aria-label={t("처음으로", "Home")}
          title={t("처음으로", "Home")}
          className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-md flex items-center justify-center hover:border-primary/60 hover:text-primary transition-colors text-foreground/80 shadow-lg shadow-black/40"
        >
          <HomeIcon className="w-4 h-4" />
        </button>
        <button
          onClick={goBack}
          disabled={
            !selectedIssueId &&
            !selectedCityId &&
            !selectedCountryCode &&
            !selectedLocationCode
          }
          aria-label={t("뒤로", "Back")}
          title={t("뒤로", "Back")}
          className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-md flex items-center justify-center hover:border-primary/60 hover:text-primary transition-colors text-foreground/80 shadow-lg shadow-black/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-foreground/80"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomBy(0.5)}
          aria-label={t("확대", "Zoom in")}
          title={t("확대", "Zoom in")}
          className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-md flex items-center justify-center hover:border-primary/60 hover:text-primary transition-colors text-foreground/80 shadow-lg shadow-black/40"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomBy(2)}
          aria-label={t("축소", "Zoom out")}
          title={t("축소", "Zoom out")}
          className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-md flex items-center justify-center hover:border-primary/60 hover:text-primary transition-colors text-foreground/80 shadow-lg shadow-black/40"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Planet switcher — anchored just inside the signal-stream rail on
          desktop; on mobile/tablet it tucks into the top-right corner above
          the (bottom-docked) signal stream so it never collides with the
          centered breadcrumb. */}
      <div className="absolute top-3 right-3 md:right-[360px] lg:right-[410px] z-20">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-1 flex gap-1 shadow-lg shadow-black/40">
          {(planets ?? []).map((p) => {
            const active = p.planet === planet;
            return (
              <button
                key={p.planet}
                onClick={() => setPlanet(p.planet)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  active
                    ? "bg-primary/20 text-primary border border-primary/50"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <span className="text-base leading-none">{p.emoji}</span>
                <span>{language === "ko" ? p.labelKo : p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats ribbon */}
      {stats && (
        <div className="absolute bottom-4 left-4 z-10 flex gap-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md pointer-events-auto shadow-lg shadow-black/40">
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">
              {planet === "earth"
                ? t("국가", "Countries")
                : t("거점", "Sites")}
            </div>
            <div className="text-base font-bold font-mono text-primary leading-tight">
              {stats.countriesTracked}
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md pointer-events-auto shadow-lg shadow-black/40">
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">
              {t("오늘 이슈", "Today")}
            </div>
            <div className="text-base font-bold font-mono text-accent leading-tight">
              {stats.issuesToday}
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md pointer-events-auto shadow-lg shadow-black/40 hidden sm:block">
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">
              {t("리포트", "Reports")}
            </div>
            <div className="text-base font-bold font-mono text-foreground leading-tight">
              {stats.jobReportsGenerated}
            </div>
          </div>
        </div>
      )}

      {/* Main Globe Area */}
      <div className="flex-1 relative min-h-[50vh] md:min-h-full">
        {!globeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1c] z-0">
            <div className="text-primary animate-pulse font-mono tracking-widest text-sm">
              INITIALIZING{" "}
              {planet === "earth"
                ? "GEOSPATIAL"
                : planet === "moon"
                  ? "LUNAR"
                  : "MARTIAN"}{" "}
              ENGINE...
            </div>
          </div>
        )}
        <div ref={cesiumContainer} className="absolute inset-0 z-0" />

        {/* WebGL fallback: hierarchical click-only list view */}
        {!webglAvailable && (
          <div className="absolute inset-0 z-10 overflow-y-auto bg-[#0a0f1c] p-4 sm:p-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="text-[10px] font-mono text-amber-400 tracking-widest uppercase">
                {t(
                  "WebGL 비활성 — 목록 모드",
                  "WebGL unavailable — list mode",
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {planetInfo
                  ? language === "ko"
                    ? planetInfo.labelKo
                    : planetInfo.label
                  : t("지구", "Earth")}
              </h2>
              {/* Country / Location list */}
              {!selectedCountryCode && !selectedLocationCode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {planet === "earth"
                    ? countries?.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => setSelectedCountryCode(c.code)}
                          className="text-left p-3 bg-secondary/40 border border-border/50 rounded-lg hover:border-primary/50 transition-colors flex items-center gap-3"
                        >
                          <span className="text-2xl">{c.flag}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground/90">
                              {language === "ko" ? c.nameKo : c.name}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {t("위험도", "Risk")} {c.riskScore}
                            </div>
                          </div>
                        </button>
                      ))
                    : planetInfo?.locations.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => setSelectedLocationCode(l.code)}
                          className="text-left p-3 bg-secondary/40 border border-border/50 rounded-lg hover:border-primary/50 transition-colors flex items-center gap-3"
                        >
                          <span className="text-2xl">{l.flag}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground/90">
                              {language === "ko" ? l.nameKo : l.name}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {l.code}
                            </div>
                          </div>
                        </button>
                      ))}
                </div>
              )}
              {/* City / Site list */}
              {((planet === "earth" && selectedCountryCode) ||
                (planet !== "earth" && selectedLocationCode)) &&
                !selectedCityId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {countryCities?.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => setSelectedCityId(city.id)}
                      className="text-left p-3 bg-secondary/40 border border-border/50 rounded-lg hover:border-primary/50 transition-colors flex items-center gap-3"
                    >
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground/90">
                          {language === "ko" ? city.nameKo : city.name}
                        </div>
                        {city.population != null && (
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {city.population.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  {countryCities?.length === 0 && (
                    <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                      {t("등록된 도시 없음", "No cities yet")}
                    </div>
                  )}
                </div>
              )}
              {/* Event list (city / site issues) */}
              {selectedCityId && (
                <div className="space-y-2">
                  {cityCategorySummary.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <button
                        onClick={() => setCityCategory(undefined)}
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase border rounded transition-colors ${!cityCategory ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted-foreground border-transparent"}`}
                      >
                        ALL
                      </button>
                      {cityCategorySummary.map((s) => (
                        <button
                          key={s.category}
                          onClick={() => setCityCategory(s.category)}
                          className={`px-2 py-0.5 text-[10px] font-mono border rounded transition-colors ${cityCategory === s.category ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted-foreground border-transparent"}`}
                        >
                          {catLabel(s.category, language)}: {s.count}
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredCityIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() =>
                        handleIssueClick(
                          issue.id,
                          issue.countryCode,
                          issue.cityId,
                        )
                      }
                      className="w-full text-left p-3 bg-secondary/40 border border-border/50 rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${catStyle(issue.category)}`}
                      >
                        {catLabel(issue.category, language)}
                      </span>
                      <div className="text-sm font-medium text-foreground/90 mt-1.5">
                        {issue.headline}
                      </div>
                    </button>
                  ))}
                  {cityIssues?.length === 0 && (
                    <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                      {t("아직 신호 없음", "No signals yet")}
                    </div>
                  )}
                  {cityIssues && cityIssues.length > 0 && filteredCityIssues.length === 0 && (
                    <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                      {t("이 카테고리에 시그널 없음", "No signals in this category")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Left Overlay - collapsed rail (desktop only) */}
        {showLeftPanel && leftCollapsed && (
          <button
            onClick={() => setLeftCollapsed(false)}
            aria-label={t("펼치기", "Expand")}
            title={t("펼치기", "Expand")}
            className="hidden md:flex absolute top-20 left-4 bottom-24 w-9 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl z-20 flex-col items-center justify-start py-3 gap-3 hover:border-primary/50 transition-colors"
          >
            <span className="text-2xl leading-none">
              {showIssuePanel
                ? selectedIssue!.countryFlag
                : showCountryPanel
                  ? countryDetail!.country.flag
                  : showLocationPanel
                    ? locationDetail!.location.flag
                    : ""}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Issue Detail Overlay (left) */}
        <div className={`absolute top-20 left-4 bottom-4 w-80 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-500 transform ${
          showIssuePanel && !leftCollapsed ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 pointer-events-none"
        } z-20 flex flex-col overflow-hidden`}>
          {selectedIssue && (
            <>
              <div className="relative">
                <img
                  src={issueThumbnail(selectedIssue.id)}
                  alt=""
                  loading="lazy"
                  className="w-full h-36 object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/90 pointer-events-none" />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => setLeftCollapsed(true)}
                    aria-label={t("접기", "Collapse")}
                    title={t("접기", "Collapse")}
                    className="hidden md:inline-flex p-1 bg-black/50 backdrop-blur hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setSelectedIssueId(null)}
                    aria-label={t("닫기", "Close")}
                    title={t("닫기", "Close")}
                    className="p-1 bg-black/50 backdrop-blur hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                  <span className="text-xl leading-none drop-shadow">{selectedIssue.countryFlag}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded backdrop-blur ${catStyle(selectedIssue.category)}`}>
                    {catLabel(selectedIssue.category, language)}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase flex items-center justify-between">
                  <span>{selectedIssue.countryCode}</span>
                  <span>{formatDistanceToNow(new Date(selectedIssue.publishedAt))} ago</span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {selectedIssue.headline}
                </h3>
                {selectedIssue.body && (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {selectedIssue.body}
                  </p>
                )}
                <button
                  onClick={() => {
                    setSelectedIssueId(null);
                    if (planet === "earth") {
                      setSelectedCountryCode(selectedIssue.countryCode);
                    } else {
                      setSelectedLocationCode(selectedIssue.countryCode);
                    }
                  }}
                  className="w-full mt-2 px-3 py-2 text-xs font-mono uppercase tracking-wider bg-primary/15 text-primary border border-primary/40 rounded hover:bg-primary/25 transition-colors"
                >
                  {planet === "earth"
                    ? t("국가 상세 보기", "View Country Detail")
                    : t("거점 상세 보기", "View Site Detail")}
                </button>
                {selectedIssue.sourceUrl && (
                  <a
                    href={selectedIssue.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-3 py-2 text-xs font-mono uppercase tracking-wider text-center bg-secondary/60 text-foreground/80 border border-border/50 rounded hover:border-primary/50 transition-colors"
                  >
                    {t("원문 열기", "Open Source")}
                  </a>
                )}
                {planet === "earth" && selectedIssue.category === "ai_jobs" && (
                  <a
                    href={`${import.meta.env.BASE_URL}job?country=${encodeURIComponent(selectedIssue.countryCode)}`}
                    className="block w-full px-3 py-2 text-xs font-mono uppercase tracking-wider text-center bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-500/25 transition-colors"
                  >
                    {t("직업 영향 보기 →", "View Job Impact →")}
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Earth Country Overlay */}
        {planet === "earth" && (
          <div
            className={`absolute top-20 left-4 bottom-4 w-80 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-500 transform ${
              showCountryPanel && !leftCollapsed
                ? "translate-x-0 opacity-100"
                : "-translate-x-[110%] opacity-0 pointer-events-none"
            } z-20 flex flex-col overflow-hidden`}
          >
            {countryDetail && (
              <>
                <div className="p-4 border-b border-border/50 flex justify-between items-start bg-secondary/30">
                  <div>
                    <div className="text-3xl mb-1">
                      {countryDetail.country.flag}
                    </div>
                    <h2 className="text-xl font-bold">
                      {language === "ko"
                        ? countryDetail.country.nameKo
                        : countryDetail.country.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLeftCollapsed(true)}
                      aria-label={t("접기", "Collapse")}
                      title={t("접기", "Collapse")}
                      className="hidden md:inline-flex p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setSelectedCountryCode(null)}
                      aria-label={t("닫기", "Close")}
                      title={t("닫기", "Close")}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-mono text-muted-foreground tracking-wider">
                        {t("국가 위험도", "Risk Score")}
                      </span>
                      <span className="text-xl font-mono font-bold text-destructive">
                        {countryDetail.country.riskScore}/100
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {countryDetail.summary}
                    </p>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-destructive mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      {t("고위험 직업군", "High Risk Jobs")}
                    </h3>
                    <div className="space-y-3">
                      {countryDetail.topRisks.map((job, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground/90">
                              {job.title}
                            </span>
                            <span className="text-destructive font-mono">
                              {job.score}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-destructive rounded-full"
                              style={{
                                width: `${Math.min(job.score, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-primary mb-3">
                      <TrendingUp className="w-4 h-4" />
                      {t("고성장 직업군", "High Growth Jobs")}
                    </h3>
                    <div className="space-y-3">
                      {countryDetail.topGrowth.map((job, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground/90">
                              {job.title}
                            </span>
                            <span className="text-primary font-mono">
                              +{job.score}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.min(job.score, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-primary mb-3">
                      <Activity className="w-4 h-4" />
                      {t("예상 뉴스", "Predicted")}
                    </h3>
                    {!panelForecasts ? null : panelForecasts.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                        {t(
                          "예측을 위한 신호가 부족합니다",
                          "Not enough signals to forecast yet",
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {panelForecasts.map((fc) => (
                          <ForecastCard
                            key={fc.id}
                            fc={fc}
                            language={language}
                            t={t}
                            showFlag={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* City / Site Overlay (Earth cities + Moon/Mars sites) */}
      {(
        <div
          className={`absolute top-20 left-4 bottom-4 w-80 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-500 transform ${
            showCityPanel && !leftCollapsed
              ? "translate-x-0 opacity-100"
              : "-translate-x-[110%] opacity-0 pointer-events-none"
          } z-20 flex flex-col overflow-hidden`}
        >
          {selectedCity && (
            <>
              <div className="p-4 border-b border-border/50 flex justify-between items-start bg-secondary/30">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
                      {(countryDetail?.country.flag ??
                        locationDetail?.location.flag) ?? ""}{" "}
                      {language === "ko"
                        ? (countryDetail?.country.nameKo ??
                          locationDetail?.location.nameKo)
                        : (countryDetail?.country.name ??
                          locationDetail?.location.name)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">
                    {language === "ko" ? selectedCity.nameKo : selectedCity.name}
                  </h2>
                  {selectedCity.population != null && selectedCity.population > 0 && (
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {t("인구", "Pop")}:{" "}
                      {selectedCity.population.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLeftCollapsed(true)}
                    aria-label={t("접기", "Collapse")}
                    title={t("접기", "Collapse")}
                    className="hidden md:inline-flex p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setSelectedCityId(null)}
                    aria-label={t("닫기", "Close")}
                    title={t("닫기", "Close")}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Activity className="w-4 h-4" />
                  {t("도시 시그널", "City Signals")}
                </h3>
                {cityCategorySummary.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCityCategory(undefined)}
                      className={`px-2 py-0.5 text-[10px] font-mono uppercase border rounded transition-colors ${!cityCategory ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted-foreground border-transparent hover:border-border"}`}
                    >
                      ALL
                    </button>
                    {cityCategorySummary.map((s) => (
                      <button
                        key={s.category}
                        onClick={() => setCityCategory(s.category)}
                        className={`px-2 py-0.5 text-[10px] font-mono border rounded transition-colors ${cityCategory === s.category ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted-foreground border-transparent hover:border-border"}`}
                      >
                        {catLabel(s.category, language)}: {s.count}
                      </button>
                    ))}
                  </div>
                )}
                {(!cityIssues || cityIssues.length === 0) && (
                  <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                    {t("아직 신호 없음", "No signals yet")}
                  </div>
                )}
                {cityIssues && cityIssues.length > 0 && filteredCityIssues.length === 0 && (
                  <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                    {t("이 카테고리에 시그널 없음", "No signals in this category")}
                  </div>
                )}
                {filteredCityIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() =>
                      handleIssueClick(
                        issue.id,
                        issue.countryCode,
                        issue.cityId,
                      )
                    }
                    className="w-full text-left p-2.5 bg-secondary/40 border border-border/40 rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${catStyle(issue.category)}`}
                      >
                        {catLabel(issue.category, language)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(issue.publishedAt))} ago
                      </span>
                    </div>
                    <h4 className="text-xs font-medium text-foreground/90">
                      {issue.headline}
                    </h4>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Moon/Mars Location Overlay */}
        {planet !== "earth" && (
          <div
            className={`absolute top-20 left-4 bottom-4 w-80 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-500 transform ${
              showLocationPanel && !leftCollapsed
                ? "translate-x-0 opacity-100"
                : "-translate-x-[110%] opacity-0 pointer-events-none"
            } z-20 flex flex-col overflow-hidden`}
          >
            {locationDetail && (
              <>
                <div className="p-4 border-b border-border/50 flex justify-between items-start bg-secondary/30">
                  <div>
                    <div className="text-3xl mb-1">
                      {locationDetail.location.flag}
                    </div>
                    <h2 className="text-xl font-bold">
                      {language === "ko"
                        ? locationDetail.location.nameKo
                        : locationDetail.location.name}
                    </h2>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1 tracking-wider">
                      {locationDetail.location.code}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLeftCollapsed(true)}
                      aria-label={t("접기", "Collapse")}
                      title={t("접기", "Collapse")}
                      className="hidden md:inline-flex p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setSelectedLocationCode(null)}
                      aria-label={t("닫기", "Close")}
                      title={t("닫기", "Close")}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {language === "ko"
                      ? locationDetail.location.descriptionKo
                      : locationDetail.location.description}
                  </p>

                  {countryCities && countryCities.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-primary mb-3">
                        <MapPin className="w-4 h-4" />
                        {t("사이트", "Sites")}
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {countryCities.map((site) => (
                          <button
                            key={site.id}
                            onClick={() => setSelectedCityId(site.id)}
                            className="text-left p-2.5 bg-secondary/40 border border-border/40 rounded-lg hover:border-primary/50 transition-colors flex items-center gap-2"
                          >
                            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                            <div className="text-xs font-medium text-foreground/90">
                              {language === "ko" ? site.nameKo : site.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-primary mb-3">
                      <Activity className="w-4 h-4" />
                      {t("관련 시그널", "Related Signals")}
                    </h3>
                    {locationDetail.signals.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                        {t("아직 신호 없음", "No signals yet")}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {locationDetail.signals.map((s) => (
                          <button
                            key={s.id}
                            onClick={() =>
                              handleIssueClick(s.id, s.countryCode)
                            }
                            className="w-full text-left p-2.5 bg-secondary/40 border border-border/40 rounded-lg hover:border-primary/50 transition-colors"
                          >
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${catStyle(s.category)}`}
                            >
                              {catLabel(s.category, language)}
                            </span>
                            <h4 className="text-xs font-medium text-foreground/90 mt-1.5">
                              {s.headline}
                            </h4>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-primary mb-3">
                      <Activity className="w-4 h-4" />
                      {t("예상 뉴스", "Predicted")}
                    </h3>
                    {!panelForecasts ? null : panelForecasts.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded">
                        {t(
                          "예측을 위한 신호가 부족합니다",
                          "Not enough signals to forecast yet",
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {panelForecasts.map((fc) => (
                          <ForecastCard
                            key={fc.id}
                            fc={fc}
                            language={language}
                            t={t}
                            showFlag={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Signal Stream Sidebar (animated width on desktop = smooth slide) */}
      <aside
        className={`relative bg-background/90 backdrop-blur-md border-l border-border/50 overflow-hidden flex flex-col z-20 w-full h-[32vh] md:h-full md:transition-[width] md:duration-500 md:ease-in-out ${rightCollapsed ? 'md:w-9' : 'md:w-[350px] lg:w-[400px]'}`}
      >
        {/* Collapsed rail (desktop only) */}
        <button
          onClick={() => setRightCollapsed(false)}
          aria-label={t("펼치기", "Expand")}
          title={t("펼치기", "Expand")}
          className={`hidden md:flex absolute inset-y-0 left-0 w-9 flex-col items-center justify-start py-4 gap-3 hover:bg-white/5 transition-opacity duration-300 z-10 ${rightCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          <Activity className="w-4 h-4 text-primary" />
        </button>

        {/* Inner-edge collapse toggle (desktop only, when expanded) */}
        <button
          onClick={() => setRightCollapsed(true)}
          aria-label={t("접기", "Collapse")}
          title={t("접기", "Collapse")}
          className={`hidden md:inline-flex absolute top-3 left-2 p-1 hover:bg-white/10 rounded-full transition-opacity duration-300 z-10 ${rightCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Full content - keeps its width so layout doesn't reflow during animation */}
        <div
          className={`flex flex-col w-full md:w-[350px] md:min-w-[350px] lg:w-[400px] lg:min-w-[400px] h-full md:transition-opacity md:duration-300 ${rightCollapsed ? 'md:opacity-0 md:pointer-events-none' : 'opacity-100'}`}
        >
        <div className="p-4 md:pl-10 border-b border-border/50">
          <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2 mb-4 text-foreground">
            <Activity className="w-4 h-4 text-primary" />
            {planet === "earth"
              ? t("글로벌 시그널 스트림", "Global Signal Stream")
              : planet === "moon"
                ? t("달 시그널 스트림", "Lunar Signal Stream")
                : t("화성 시그널 스트림", "Martian Signal Stream")}
          </h2>

          <div className="flex gap-1 mb-3 p-0.5 bg-secondary/50 border border-border/50 rounded">
            <button
              onClick={() => setStreamMode("live")}
              className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${streamMode === "live" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("실시간", "Live")}
            </button>
            <button
              onClick={() => setStreamMode("predicted")}
              className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 ${streamMode === "predicted" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>{t("예상", "Predicted")}</span>
              {forecastAccuracy && forecastAccuracy.resolved > 0 && (
                <span
                  className={`text-[9px] font-mono px-1 py-0.5 border rounded normal-case tracking-normal ${
                    forecastAccuracy.accuracy >= 60
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : forecastAccuracy.accuracy >= 40
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}
                  title={t(
                    `최근 ${forecastAccuracy.windowDays}일 적중 ${forecastAccuracy.hits}/${forecastAccuracy.resolved}`,
                    `Last ${forecastAccuracy.windowDays}d: ${forecastAccuracy.hits}/${forecastAccuracy.resolved} hit`,
                  )}
                >
                  {t("적중", "Hit")} {forecastAccuracy.accuracy}%
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase border rounded transition-colors ${!selectedCategory ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted-foreground border-transparent hover:border-border"}`}
            >
              ALL
            </button>
            {filteredSummary?.map((summary) => (
              <button
                key={summary.category}
                onClick={() => setSelectedCategory(summary.category)}
                className={`px-2.5 py-1 text-[10px] font-mono border rounded transition-colors ${selectedCategory === summary.category ? "bg-primary/20 text-primary border-primary/50" : "bg-secondary text-muted-foreground border-transparent hover:border-border"}`}
              >
                {catLabel(summary.category, language)}: {summary.count}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[16vh] md:max-h-[45vh]">
          {streamMode === "predicted" && (
            <>
              {forecasts?.map((fc) => (
                <ForecastCard
                  key={fc.id}
                  fc={fc}
                  language={language}
                  t={t}
                  showPlanetBadge
                  expanded={expandedForecastId === fc.id}
                  onToggleExpand={() =>
                    setExpandedForecastId(
                      expandedForecastId === fc.id ? null : fc.id,
                    )
                  }
                />
              ))}
              {forecasts && forecasts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {t(
                    "예측을 위한 신호가 부족합니다",
                    "Not enough signals to forecast yet",
                  )}
                </div>
              )}
            </>
          )}
          {streamMode === "live" && issues?.map((issue) => (
            <div
              key={issue.id}
              onClick={() => handleIssueClick(issue.id, issue.countryCode, issue.cityId)}
              className={`p-3 bg-secondary/40 border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/60 transition-all group ${
                selectedIssueId === issue.id
                  ? "border-primary/70 ring-1 ring-primary/40"
                  : "border-border/50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">
                    {issue.countryFlag}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${catStyle(issue.category)}`}
                  >
                    {catLabel(issue.category, language)}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatDistanceToNow(new Date(issue.publishedAt))} ago
                </span>
              </div>
              <h4 className="text-sm font-medium text-foreground/90 group-hover:text-white transition-colors">
                {issue.headline}
              </h4>
            </div>
          ))}
          {streamMode === "live" && issues?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t("아직 신호 없음", "No signals yet")}
            </div>
          )}
        </div>
        </div>
      </aside>
    </div>
  );
}

// Silence unused-import warnings if PlanetLocation is not directly referenced by name elsewhere.
export type _PlanetLocationKeep = PlanetLocation;
