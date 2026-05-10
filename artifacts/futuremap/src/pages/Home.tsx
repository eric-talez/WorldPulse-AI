import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language";
import { 
  useListCountries, 
  useListIssues, 
  useGetIssueSummary, 
  useGetDashboardStats,
  useGetCountry,
  getGetCountryQueryKey
} from "@workspace/api-client-react";
import { Activity, AlertTriangle, TrendingUp, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
};
const CATEGORY_LABEL: Record<string, string> = {
  conflict: "Conflict",
  politics: "Politics",
  economy: "Economy",
  culture: "Culture",
  ai_jobs: "AI Jobs",
  disease: "Disease",
  tech: "Tech",
  news: "News",
};
const catStyle = (c: string) => CATEGORY_STYLE[c] ?? "bg-secondary text-muted-foreground border-border";
const catLabel = (c: string) => CATEGORY_LABEL[c] ?? c.toUpperCase();

export default function Home() {
  const { t, language } = useLanguage();
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: stats } = useGetDashboardStats();
  const { data: issues } = useListIssues({ category: selectedCategory as any, limit: 50 });
  const { data: issueSummary } = useGetIssueSummary();
  const { data: countries } = useListCountries();
  const { data: countryDetail, isLoading: isLoadingCountry } = useGetCountry(selectedCountryCode || "", {
    query: { enabled: !!selectedCountryCode, queryKey: getGetCountryQueryKey(selectedCountryCode || "") }
  });

  useEffect(() => {
    const swallow = (ev: ErrorEvent | PromiseRejectionEvent) => {
      const msg = String(
        (ev as ErrorEvent).message ??
          (ev as PromiseRejectionEvent).reason ??
          "",
      );
      if (/cesium|webgl|CesiumWidget|constructing|viewer|unknown runtime/i.test(msg)) {
        ev.stopImmediatePropagation?.();
        ev.preventDefault?.();
      }
    };
    window.addEventListener("error", swallow, true);
    window.addEventListener("unhandledrejection", swallow as any, true);

    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/Widgets/widgets.css";
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
      setGlobeReady(false);
      return;
    }

    window.CESIUM_BASE_URL = "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/";

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/Cesium.js";
    script.onload = () => {
      if (cesiumContainer.current && window.Cesium) {
        try {
          initCesium();
        } catch (e) {
          console.warn("Cesium init failed:", e);
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(style);
      if (document.head.contains(styleLink)) document.head.removeChild(styleLink);
      window.removeEventListener("error", swallow, true);
      window.removeEventListener("unhandledrejection", swallow as any, true);
    };
  }, []);

  const initCesium = () => {
    const Cesium = window.Cesium;
    if (cesiumContainer.current?.querySelector('.cesium-viewer')) return;

    const viewer = new Cesium.Viewer(cesiumContainer.current!, {
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
    });

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0f1c');
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0a0f1c');
    
    const baseLayer = viewer.imageryLayers.get(0);
    if (baseLayer) {
        baseLayer.brightness = 0.3;
        baseLayer.contrast = 1.2;
        baseLayer.saturation = 0.1;
    }

    viewer.scene.globe.enableLighting = true;
    
    let isRotating = true;
    viewer.scene.preRender.addEventListener(() => {
      if (isRotating) {
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0003);
      }
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(() => { isRotating = false; }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => { isRotating = false; }, Cesium.ScreenSpaceEventType.WHEEL);

    // Setup click handler for pins
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.countryCode) {
        const code = pickedObject.id.countryCode;
        setSelectedCountryCode(code);
        isRotating = false;
        
        const country = countries?.find(c => c.code === code);
        if (country) {
          flyToCountry(viewer, country.longitude, country.latitude);
        }
      } else {
        setSelectedCountryCode(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    setViewerInstance(viewer);
    setGlobeReady(true);
  };

  // Sync pins when countries load
  useEffect(() => {
    if (!globeReady || !viewerInstance || !countries) return;
    
    const Cesium = window.Cesium;
    viewerInstance.entities.removeAll();

    countries.forEach(country => {
      // Color based on risk
      let colorStr = '#0ea5e9'; // cyan for low risk
      if (country.riskScore > 75) colorStr = '#ef4444'; // red for high
      else if (country.riskScore > 50) colorStr = '#f59e0b'; // orange

      viewerInstance.entities.add({
        id: `pin-${country.code}`,
        countryCode: country.code,
        position: Cesium.Cartesian3.fromDegrees(country.longitude, country.latitude),
        point: {
          pixelSize: 8 + (country.riskScore / 20),
          color: Cesium.Color.fromCssColorString(colorStr).withAlpha(0.8),
          outlineColor: Cesium.Color.fromCssColorString(colorStr),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, // Show through earth
        }
      });
    });

  }, [globeReady, viewerInstance, countries]);

  const flyToCountry = (viewer: any, lng: number, lat: number) => {
    const Cesium = window.Cesium;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 8000000.0),
      duration: 1.5
    });
  };

  const handleIssueClick = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const country = countries?.find(c => c.code === countryCode);
    if (country && viewerInstance) {
      flyToCountry(viewerInstance, country.longitude, country.latitude);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0a0f1c] relative overflow-hidden">
      
      {/* System HUD overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur border border-border/50 p-3 rounded-lg pointer-events-auto">
          <div className="text-[10px] font-mono text-primary mb-1 tracking-widest">SYSTEM STATUS: NOMINAL</div>
          <div className="text-xs font-medium text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t("실시간 데이터 스트림", "Live Data Stream Active")}
          </div>
        </div>
      </div>

      {/* Stats ribbon (bottom-left) */}
      {stats && (
        <div className="absolute bottom-4 left-4 z-10 flex gap-2 pointer-events-none">
          <div className="bg-background/60 backdrop-blur-md border border-border/50 px-3 py-1.5 rounded-md pointer-events-auto">
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">{t("국가", "Countries")}</div>
            <div className="text-base font-bold font-mono text-primary leading-tight">{stats.countriesTracked}</div>
          </div>
          <div className="bg-background/60 backdrop-blur-md border border-border/50 px-3 py-1.5 rounded-md pointer-events-auto">
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">{t("오늘 이슈", "Today")}</div>
            <div className="text-base font-bold font-mono text-accent leading-tight">{stats.issuesToday}</div>
          </div>
          <div className="bg-background/60 backdrop-blur-md border border-border/50 px-3 py-1.5 rounded-md pointer-events-auto hidden sm:block">
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">{t("리포트", "Reports")}</div>
            <div className="text-base font-bold font-mono text-foreground leading-tight">{stats.jobReportsGenerated}</div>
          </div>
        </div>
      )}

      {/* Main Globe Area */}
      <div className="flex-1 relative min-h-[50vh] md:min-h-full">
        {!globeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1c] z-0">
            <div className="text-primary animate-pulse font-mono tracking-widest text-sm">INITIALIZING GEOSPATIAL ENGINE...</div>
          </div>
        )}
        <div ref={cesiumContainer} className="absolute inset-0 z-0" />

        {/* Country Overlay Panel */}
        <div className={`absolute top-20 left-4 bottom-4 w-80 bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl transition-all duration-500 transform ${
          selectedCountryCode && countryDetail ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        } z-20 flex flex-col overflow-hidden`}>
          {countryDetail && (
            <>
              <div className="p-4 border-b border-border/50 flex justify-between items-start bg-secondary/30">
                <div>
                  <div className="text-3xl mb-1">{countryDetail.country.flag}</div>
                  <h2 className="text-xl font-bold">
                    {language === 'ko' ? countryDetail.country.nameKo : countryDetail.country.name}
                  </h2>
                </div>
                <button onClick={() => setSelectedCountryCode(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-mono text-muted-foreground tracking-wider">{t("국가 위험도", "Risk Score")}</span>
                    <span className="text-xl font-mono font-bold text-destructive">{countryDetail.country.riskScore}/100</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{countryDetail.summary}</p>
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
                          <span className="text-foreground/90">{job.title}</span>
                          <span className="text-destructive font-mono">{job.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-destructive rounded-full" style={{ width: `${Math.min(job.score, 100)}%` }} />
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
                          <span className="text-foreground/90">{job.title}</span>
                          <span className="text-primary font-mono">+{job.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(job.score, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Signal Stream Sidebar */}
      <div className="w-full md:w-[350px] lg:w-[400px] h-[50vh] md:h-full bg-background/90 backdrop-blur-md border-l border-border/50 flex flex-col z-20">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2 mb-4 text-foreground">
            <Activity className="w-4 h-4 text-primary" />
            {t("글로벌 시그널 스트림", "Global Signal Stream")}
          </h2>
          
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={() => setSelectedCategory(undefined)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase border rounded transition-colors ${!selectedCategory ? 'bg-primary/20 text-primary border-primary/50' : 'bg-secondary text-muted-foreground border-transparent hover:border-border'}`}
            >
              ALL
            </button>
            {issueSummary?.map(summary => (
              <button 
                key={summary.category}
                onClick={() => setSelectedCategory(summary.category)}
                className={`px-2.5 py-1 text-[10px] font-mono border rounded transition-colors ${selectedCategory === summary.category ? 'bg-primary/20 text-primary border-primary/50' : 'bg-secondary text-muted-foreground border-transparent hover:border-border'}`}
              >
                {catLabel(summary.category)}: {summary.count}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {issues?.map(issue => (
            <div 
              key={issue.id} 
              onClick={() => handleIssueClick(issue.countryCode)}
              className="p-3 bg-secondary/40 border border-border/50 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/60 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{issue.countryFlag}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${catStyle(issue.category)}`}>
                    {catLabel(issue.category)}
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
          {issues?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t("조건에 맞는 시그널이 없습니다.", "No signals match your criteria.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
