import { useEffect, useRef, useState } from "react";
import { Search, Globe, FileText, MessageSquare, CreditCard, ChevronRight, ChevronLeft, Activity, AlertTriangle, TrendingUp, Cpu, ShieldAlert, Zap, BookOpen } from "lucide-react";

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
    Cesium: any;
  }
}

const GlobalSignalStream = [
  { id: 1, country: "🇺🇦", cat: "Conflict", color: "bg-red-500/20 text-red-400 border-red-500/30", headline: "러시아-우크라이나 전선 교착, 드론 AI 타겟팅 기술 도입", time: "2 min ago" },
  { id: 2, country: "🇺🇸", cat: "Politics", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", headline: "US Election: AI 규제안 후보자 간 의견 충돌 심화", time: "15 min ago" },
  { id: 3, country: "🇰🇷", cat: "Economy", color: "bg-green-500/20 text-green-400 border-green-500/30", headline: "한국 반도체 수출 3개월 연속 최고치 경신", time: "1 hr ago" },
  { id: 4, country: "🇯🇵", cat: "Culture", color: "bg-white/10 text-white border-white/20", headline: "Japan to implement AI-driven urban transport systems", time: "2 hrs ago" },
  { id: 5, country: "🇪🇺", cat: "AI Jobs", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", headline: "EU AI Act 시행, 법률 AI 컨설턴트 수요 400% 급증", time: "3 hrs ago" },
  { id: 6, country: "🇨🇩", cat: "Disease", color: "bg-violet-500/20 text-violet-400 border-violet-500/30", headline: "DRC reports new Mpox cluster, supply chains on alert", time: "5 hrs ago" },
  { id: 7, country: "🇮🇳", cat: "Tech", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", headline: "India unveils national AI framework aiming at 1M tech jobs", time: "6 hrs ago" },
];

const jobsRisk = [
  { title: "회계사", risk: 85, color: "bg-red-500" },
  { title: "번역가", risk: 78, color: "bg-red-500" },
  { title: "세무사", risk: 72, color: "bg-orange-500" },
  { title: "방사선사", risk: 68, color: "bg-orange-500" },
  { title: "콜센터 상담원", risk: 92, color: "bg-red-600" },
];

const jobsGrowth = [
  { title: "AI 윤리 컨설턴트", growth: 142, color: "bg-cyan-500" },
  { title: "데이터 엔지니어", growth: 115, color: "bg-cyan-400" },
  { title: "프롬프트 엔지니어", growth: 95, color: "bg-emerald-400" },
  { title: "로봇 공학자", growth: 88, color: "bg-emerald-500" },
  { title: "기후변화 분석가", growth: 76, color: "bg-teal-500" },
];

export default function FutureMap() {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  useEffect(() => {
    // Suppress runtime-error overlays from any cesium/WebGL async errors.
    // Use capture phase so we beat the vite runtime-error overlay listener.
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

    // Inject custom styles
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/Widgets/widgets.css";
    document.head.appendChild(styleLink);

    const style = document.createElement("style");
    style.innerHTML = `
      .cesium-viewer-bottom { display: none !important; }
      .cesium-widget-credits { display: none !important; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
    `;
    document.head.appendChild(style);

    // Pre-flight: WebGL feature detection. If unsupported, skip Cesium entirely.
    const probe = document.createElement("canvas");
    const gl =
      probe.getContext("webgl2") ||
      probe.getContext("webgl") ||
      probe.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL unavailable — rendering globe fallback.");
      setGlobeReady(false);
      // Suppress vite/runtime-error overlays from any late async cesium errors
      const swallow = (ev: ErrorEvent | PromiseRejectionEvent) => {
        ev.preventDefault?.();
      };
      window.addEventListener("error", swallow);
      window.addEventListener("unhandledrejection", swallow as any);
      return () => {
        window.removeEventListener("error", swallow);
        window.removeEventListener("unhandledrejection", swallow as any);
      };
    }

    window.CESIUM_BASE_URL = "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/";

    // Dynamically load Cesium script since we can't easily bundle it without issues sometimes
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/cesium@1.122.0/Build/Cesium/Cesium.js";
    script.onload = () => {
      if (cesiumContainer.current && window.Cesium) {
        try {
          initCesium();
        } catch (e) {
          console.warn("Cesium init failed:", e);
          setGlobeReady(false);
        }
      }
    };
    script.onerror = () => console.warn("Cesium script failed to load");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(style);
      if (document.head.contains(styleLink)) document.head.removeChild(styleLink);
    };
  }, []);

  const initCesium = () => {
    const Cesium = window.Cesium;
    
    // Check if viewer already exists on this element
    if (cesiumContainer.current?.querySelector('.cesium-viewer')) {
      return;
    }

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

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#020617');
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020617');
    
    // Add dark overlay to imagery
    const imageryLayers = viewer.imageryLayers;
    const baseLayer = imageryLayers.get(0);
    if (baseLayer) {
        baseLayer.brightness = 0.2;
        baseLayer.contrast = 1.1;
        baseLayer.hue = 1.0;
        baseLayer.saturation = 0.2;
        baseLayer.gamma = 0.8;
    }

    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.atmosphereHueShift = -0.5;

    // Add entities
    const entities = [
      { lat: 49.0, lng: 31.0, color: Cesium.Color.RED, size: 8 }, // Ukraine
      { lat: 31.5, lng: 34.4, color: Cesium.Color.RED, size: 7 }, // Gaza
      { lat: 38.9, lng: -77.0, color: Cesium.Color.ORANGE, size: 6 }, // US Politics
      { lat: 37.5, lng: 127.0, color: Cesium.Color.GREEN, size: 9 }, // KR Economy
      { lat: 35.6, lng: 139.6, color: Cesium.Color.WHITE, size: 5 }, // JP Culture
      { lat: 50.8, lng: 4.3, color: Cesium.Color.CYAN, size: 7 }, // EU AI Act
      { lat: -4.3, lng: 15.3, color: Cesium.Color.PURPLE, size: 6 }, // DRC Outbreak
      { lat: 28.6, lng: 77.2, color: Cesium.Color.CYAN, size: 6 }, // India Tech
      { lat: -14.2, lng: -51.9, color: Cesium.Color.BROWN, size: 5 }, // Brazil
    ];

    let pulse = 0;
    let direction = 1;
    viewer.scene.preUpdate.addEventListener(() => {
      pulse += direction * 0.05;
      if (pulse > 3) direction = -1;
      if (pulse < 0) direction = 1;
    });

    entities.forEach(pt => {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(pt.lng, pt.lat),
        point: {
          pixelSize: new Cesium.CallbackProperty(() => pt.size + pulse, false),
          color: pt.color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
        }
      });
    });

    // Auto rotate
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(127.0, 37.5, 15000000.0)
    });
    
    let isRotating = true;
    const rotateSpeed = 0.0005;
    viewer.scene.preRender.addEventListener(() => {
      if (isRotating) {
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, rotateSpeed);
      }
    });

    // Stop on interact
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(() => { isRotating = false; }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => { isRotating = false; }, Cesium.ScreenSpaceEventType.WHEEL);

    setGlobeReady(true);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-cyan-500" />
            <span className="font-bold text-lg tracking-tight text-white">FutureMap <span className="text-cyan-500">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="text-cyan-400">Map</a>
            <a href="#" className="hover:text-white transition-colors">Reports</a>
            <a href="#" className="hover:text-white transition-colors">Forum</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 rounded-full p-1 border border-slate-800">
            <button className="px-3 py-1 text-xs font-bold rounded-full bg-slate-800 text-white shadow-sm">KO</button>
            <button className="px-3 py-1 text-xs font-bold rounded-full text-slate-500 hover:text-white transition-colors">EN</button>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <span className="text-xs font-bold text-white">USER</span>
          </div>
        </div>
      </nav>

      {/* Main Map + Stream Area */}
      <div className="pt-[73px] flex flex-col lg:flex-row h-screen">
        {/* Cesium Globe */}
        <div className="w-full flex-1 h-[50vh] lg:h-full relative border-r border-slate-800/50">
          <div ref={cesiumContainer} className="w-full h-full bg-[#020617]" />
          
          {/* Overlay HUD */}
          <div className="absolute top-6 left-6 pointer-events-none">
            <div className="bg-black/40 backdrop-blur border border-slate-800/50 p-4 rounded-lg">
              <div className="text-xs font-mono text-cyan-500 mb-1">SYSTEM STATUS: NOMINAL</div>
              <div className="text-sm font-medium text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                Live Data Stream Active
              </div>
            </div>
          </div>

          {/* Left Country Detail overlay - collapsed rail (desktop only) */}
          {leftPanelOpen && leftCollapsed && (
            <button
              onClick={() => setLeftCollapsed(false)}
              aria-label="펼치기"
              title="펼치기 / Expand"
              className="hidden lg:flex absolute top-24 left-6 bottom-24 w-10 bg-[#020617]/90 backdrop-blur border border-slate-800/80 rounded-xl flex-col items-center justify-start py-3 gap-3 hover:border-cyan-500/50 transition-colors z-20"
            >
              <span className="text-2xl leading-none">🇰🇷</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Left Country Detail overlay panel */}
          {leftPanelOpen && (
            <div className={`hidden lg:flex absolute top-24 left-6 bottom-24 w-72 bg-[#020617]/90 backdrop-blur-xl border border-slate-800/80 rounded-xl transition-all duration-500 transform z-20 flex-col overflow-hidden ${leftCollapsed ? '-translate-x-[110%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
              <div className="p-4 border-b border-slate-800/80 flex justify-between items-start bg-slate-900/40">
                <div>
                  <div className="text-3xl mb-1">🇰🇷</div>
                  <h3 className="text-lg font-bold text-white">Republic of Korea</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLeftCollapsed(true)}
                    aria-label="접기"
                    title="접기 / Collapse"
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => setLeftPanelOpen(false)}
                    aria-label="닫기"
                    title="닫기 / Close"
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 text-lg leading-none px-2"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-400">
                <p>국가 종합 위험도: <span className="text-amber-400 font-mono font-bold">64/100</span></p>
                <p className="mt-3 text-xs leading-relaxed">선택한 국가의 자동화 위험도, 고성장 직업군 등 주요 지표를 한 눈에 확인합니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Global Signal Stream (animated width on desktop = smooth slide) */}
        <aside className={`relative bg-[#020617] border-l border-slate-800/50 overflow-hidden flex flex-col w-full h-[50vh] lg:h-full lg:transition-[width] lg:duration-500 lg:ease-in-out ${rightCollapsed ? 'lg:w-10' : 'lg:w-[35%] lg:min-w-[340px]'}`}>
          {/* Collapsed rail (desktop only) */}
          <button
            onClick={() => setRightCollapsed(false)}
            aria-label="펼치기"
            title="펼치기 / Expand"
            className={`hidden lg:flex absolute inset-y-0 left-0 w-10 flex-col items-center justify-start py-4 gap-3 hover:bg-slate-900 transition-opacity duration-300 z-10 ${rightCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <Activity className="w-5 h-5 text-cyan-500" />
          </button>

          {/* Inner-edge collapse toggle */}
          <button
            onClick={() => setRightCollapsed(true)}
            aria-label="접기"
            title="접기 / Collapse"
            className={`hidden lg:inline-flex absolute top-4 left-3 p-1 hover:bg-white/10 rounded-full transition-opacity duration-300 z-10 ${rightCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Full content - holds intrinsic width to avoid layout reflow during animation */}
          <div className={`flex flex-col w-full lg:w-[340px] lg:min-w-[340px] h-full lg:transition-opacity lg:duration-300 ${rightCollapsed ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>
          <div className="p-4 lg:pl-12 border-b border-slate-800/50">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500" />
              Global Signal Stream
            </h2>
            
            {/* Toggles */}
            <div className="flex flex-wrap gap-2">
              {['News: 14', 'Conflict: 3', 'Disease: 1', 'Politics: 8', 'Economy: 12', 'AI Jobs: 24'].map(t => (
                <button key={t} className="px-3 py-1.5 text-xs font-mono rounded bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {GlobalSignalStream.map(item => (
              <div key={item.id} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.country}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.color}`}>
                      {item.cat}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{item.time}</span>
                </div>
                <p className="text-sm text-slate-300 font-medium group-hover:text-cyan-400 transition-colors">
                  {item.headline}
                </p>
              </div>
            ))}
          </div>
          </div>
        </aside>
      </div>

      {/* Country Detail & AI Job Future Panel */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        
        {/* Selected Country View */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🇰🇷</span> Republic of Korea (한국)
            </h2>
            <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
              <span className="text-sm text-slate-400">국가 종합 위험도</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold text-amber-500">64</span>
                <span className="text-xs text-amber-500/70">/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Risk Chart */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                AI 자동화 고위험 직업군 (Top 5)
              </h3>
              <div className="space-y-4">
                {jobsRisk.map(job => (
                  <div key={job.title}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 font-medium">{job.title}</span>
                      <span className="text-red-400 font-mono">{job.risk}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${job.color}`} style={{ width: `${job.risk}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                성장 가능성 높은 미래 직업군 (Top 5)
              </h3>
              <div className="space-y-4">
                {jobsGrowth.map(job => (
                  <div key={job.title}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 font-medium">{job.title}</span>
                      <span className="text-cyan-400 font-mono">+{job.growth}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${job.color}`} style={{ width: `${Math.min(job.growth, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Job Future Report Example */}
        <section className="bg-gradient-to-b from-[#0a192f]/50 to-[#020617] border border-cyan-900/30 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl" />
          
          <div className="mb-8 flex flex-col md:flex-row gap-6 md:items-end justify-between relative z-10">
            <div>
              <div className="text-cyan-500 text-sm font-bold tracking-wider uppercase mb-2">Deep Analysis Report</div>
              <h3 className="text-3xl font-bold text-white">세무사 (Tax Accountant)</h3>
              <p className="text-slate-400 mt-2 max-w-2xl">
                AI의 도입으로 단순 기장 및 세금 계산 업무는 78% 이상 자동화될 전망이나, 복잡한 세무 컨설팅 및 기업 절세 전략 수립의 가치는 상승할 것입니다.
              </p>
            </div>
            
            <div className="bg-[#020617]/80 backdrop-blur px-6 py-4 rounded-lg border border-cyan-900/50 flex flex-col gap-2">
              <span className="text-xs text-slate-500">자동화 위험도</span>
              <span className="text-4xl font-mono text-orange-500 font-bold">72%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
            <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-3"><Cpu className="w-4 h-4"/> 자동화 가능 업무</div>
              <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
                <li>단순 장부 기장 및 영수증 처리</li>
                <li>표준화된 부가세/종소세 신고</li>
                <li>기본적인 세액 계산 및 검증</li>
              </ul>
            </div>
            <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3"><ShieldAlert className="w-4 h-4"/> 인간이 강한 업무</div>
              <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
                <li>비정형적이고 복잡한 세무 컨설팅</li>
                <li>세무조사 대응 및 소명 논리 개발</li>
                <li>고객과의 신뢰 관계 구축 및 자문</li>
              </ul>
            </div>
            <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-3"><Zap className="w-4 h-4"/> 미래 변화 및 방향</div>
              <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
                <li>데이터 분석 및 IT 활용 능력 필수화</li>
                <li>'기장 대행'에서 'AI 세무 데이터 컨설턴트'로 진화</li>
                <li>글로벌 조세 정책 이해도 요구 증가</li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 bg-[#020617]/50 p-4 rounded-xl border border-slate-800 max-w-2xl mx-auto">
            <div className="w-full relative">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="내 직업을 입력하세요 (예: 마케터, 교사)" 
                className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
            <button className="w-full sm:w-auto whitespace-nowrap bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.5)] flex items-center justify-center gap-2">
              AI 분석 시작 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Forum Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-slate-400" />
            글로벌 인사이트 포럼
          </h2>
          
          {/* Forum Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-px">
            {['🇰🇷 한국 (KR)', '🇺🇸 미국 (US)', '🇯🇵 일본 (JP)', '🌐 글로벌 (Global)'].map((tab, i) => (
              <button key={tab} className={`px-4 py-2 text-sm font-medium ${i===0 ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "최근 한국 반도체 시장 변화와 엔지니어 이직 트렌드", author: "TechInsider", replies: 124, time: "2 hours ago" },
              { title: "EU AI 법안 통과가 국내 스타트업에 미치는 영향 분석", author: "LawAI", replies: 89, time: "5 hours ago" },
              { title: "자동화 툴 도입 후 마케팅 부서 인력 재배치 사례 공유", author: "MarketerK", replies: 256, time: "1 day ago" },
              { title: "일본의 고령화와 로봇 산업 발전이 시사하는 점", author: "FutureWatcher", replies: 42, time: "2 days ago" },
            ].map((thread, i) => (
              <div key={i} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                  {thread.author[0]}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm mb-1">{thread.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>by {thread.author}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.replies}</span>
                    <span>{thread.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="py-12 border-t border-slate-800">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">당신의 미래를 위한 투자</h2>
            <p className="text-slate-400">데이터 기반의 확실한 커리어 방향성을 제시합니다.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-900/30 p-8 rounded-xl border border-slate-800 text-center">
              <div className="text-xl font-bold text-white mb-2">Free</div>
              <div className="text-3xl font-mono text-slate-300 mb-6">$0 <span className="text-sm text-slate-500 font-sans">/mo</span></div>
              <ul className="text-sm text-slate-400 space-y-3 mb-8 text-left">
                <li>✓ 글로벌 시그널 기본 열람</li>
                <li>✓ 직업 위험도 요약 (월 3회)</li>
                <li>✓ 포럼 읽기 전용</li>
              </ul>
              <button className="w-full py-2 rounded bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">Start Free</button>
            </div>
            
            <div className="bg-slate-800/50 p-8 rounded-xl border border-cyan-500/50 text-center relative transform md:-translate-y-4 shadow-2xl shadow-cyan-900/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
              <div className="text-xl font-bold text-cyan-400 mb-2">Pro</div>
              <div className="text-4xl font-mono text-white mb-6">$19 <span className="text-sm text-slate-400 font-sans">/mo</span></div>
              <ul className="text-sm text-slate-300 space-y-3 mb-8 text-left">
                <li>✓ 무제한 직업 상세 분석 리포트</li>
                <li>✓ 실시간 글로벌 이슈 알림</li>
                <li>✓ 직무 전환 추천 로드맵</li>
                <li>✓ 포럼 글쓰기 및 네트워킹</li>
              </ul>
              <button className="w-full py-3 rounded bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-colors">Upgrade to Pro</button>
            </div>
            
            <div className="bg-slate-900/30 p-8 rounded-xl border border-slate-800 text-center">
              <div className="text-xl font-bold text-white mb-2">Enterprise</div>
              <div className="text-3xl font-mono text-slate-300 mb-6">Custom</div>
              <ul className="text-sm text-slate-400 space-y-3 mb-8 text-left">
                <li>✓ 기업 맞춤형 산업 리스크 분석</li>
                <li>✓ 임직원 역량 전환 교육 설계</li>
                <li>✓ API 데이터 연동 (GDELT, ACLED)</li>
              </ul>
              <button className="w-full py-2 rounded bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">Contact Sales</button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-[#010410] border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Globe className="w-5 h-5 text-white" />
            <span className="font-bold text-lg text-white">FutureMap <span className="text-cyan-500">AI</span></span>
          </div>
          
          <div className="text-xs text-slate-500 flex flex-wrap gap-4 text-center md:text-left">
            <span>Data Sources: GDELT Project, ACLED, WHO Disease Outbreak News</span>
            <span>|</span>
            <span>© 2025 FutureMap AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}