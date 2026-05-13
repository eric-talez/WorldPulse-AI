export type Planet = "earth" | "moon" | "mars";

export interface PlanetLocation {
  code: string;
  planet: Planet;
  name: string;
  nameKo: string;
  flag: string;
  latitude: number;
  longitude: number;
  description: string;
  descriptionKo: string;
}

export interface PlanetInfo {
  planet: Planet;
  label: string;
  labelKo: string;
  emoji: string;
  ellipsoidRadius: number;
  imageryUrl: string | null;
  baseColor: string;
  tagline: string;
  taglineKo: string;
  locations: PlanetLocation[];
  signalCategories: string[];
}

const MOON_LOCATIONS: PlanetLocation[] = [
  {
    code: "MOON-APOLLO11",
    planet: "moon",
    name: "Apollo 11 (Tranquility Base)",
    nameKo: "아폴로 11 · 고요의 기지",
    flag: "🌕",
    latitude: 0.674,
    longitude: 23.473,
    description:
      "First crewed lunar landing site, July 1969. Symbolic anchor for next-gen lunar tourism and heritage missions.",
    descriptionKo:
      "1969년 인류 최초의 유인 달 착륙지. 차세대 달 관광과 문화유산 미션의 상징적 거점입니다.",
  },
  {
    code: "MOON-ARTEMIS",
    planet: "moon",
    name: "Artemis Base Camp",
    nameKo: "아르테미스 베이스캠프",
    flag: "🌕",
    latitude: -89.9,
    longitude: 0,
    description:
      "Planned NASA Artemis surface camp near the lunar south pole — long-term crewed lunar habitation.",
    descriptionKo:
      "NASA 아르테미스 프로그램의 달 남극 인근 상주 기지 후보지. 장기 유인 거주의 핵심 거점입니다.",
  },
  {
    code: "MOON-SHACKLETON",
    planet: "moon",
    name: "Shackleton Crater",
    nameKo: "섀클턴 크레이터",
    flag: "🌕",
    latitude: -89.66,
    longitude: 129.2,
    description:
      "South-pole crater with permanent shadow regions — prime candidate for water-ice mining operations.",
    descriptionKo:
      "달 남극의 영구 음영 지역. 물·얼음 채굴과 우주 자원 산업의 1순위 후보지입니다.",
  },
  {
    code: "MOON-MAREIMBRIUM",
    planet: "moon",
    name: "Mare Imbrium",
    nameKo: "비의 바다 (마레 임브리움)",
    flag: "🌕",
    latitude: 32.8,
    longitude: -15.6,
    description:
      "Vast basaltic plain on the lunar near side — proposed lunar construction and 3D-printing test bed.",
    descriptionKo:
      "달의 앞면에 펼쳐진 거대한 현무암 평원. 달 건설 자재와 3D 프린팅 실험 후보지입니다.",
  },
];

const MARS_LOCATIONS: PlanetLocation[] = [
  {
    code: "MARS-JEZERO",
    planet: "mars",
    name: "Jezero Crater",
    nameKo: "예제로 크레이터",
    flag: "🔴",
    latitude: 18.4,
    longitude: 77.7,
    description:
      "Perseverance rover landing site. Ancient lake bed — top science target for astrobiology.",
    descriptionKo:
      "퍼서비어런스 로버 착륙지. 고대 호수 바닥 — 우주생물학 연구의 최전선입니다.",
  },
  {
    code: "MARS-GALE",
    planet: "mars",
    name: "Gale Crater",
    nameKo: "게일 크레이터",
    flag: "🔴",
    latitude: -5.4,
    longitude: 137.8,
    description:
      "Curiosity rover's home since 2012. Mount Sharp's stratigraphy guides Mars climate research.",
    descriptionKo:
      "2012년부터 큐리오시티 로버가 탐사 중인 지역. 샤프산의 지층이 화성 기후 연구의 단서입니다.",
  },
  {
    code: "MARS-OLYMPUS",
    planet: "mars",
    name: "Olympus Mons base",
    nameKo: "올림푸스 몬스 기슭",
    flag: "🔴",
    latitude: 18.65,
    longitude: -133.8,
    description:
      "Foothills of the largest volcano in the solar system — long-term mining and geothermal interest.",
    descriptionKo:
      "태양계 최대 화산의 기슭. 광물 채굴과 지열 활용의 장기 후보지입니다.",
  },
  {
    code: "MARS-COLONY-A",
    planet: "mars",
    name: "Mars Colony Alpha",
    nameKo: "화성 콜로니 알파",
    flag: "🔴",
    latitude: 4.5,
    longitude: 137.4,
    description:
      "SpaceX-style proposed crewed settlement zone in equatorial Mars — Starship landing corridor.",
    descriptionKo:
      "스타십 착륙 회랑에 위치한 적도권 유인 정착 후보지. 화성 콜로니 1호 시나리오입니다.",
  },
];

export const PLANETS: Record<Planet, PlanetInfo> = {
  earth: {
    planet: "earth",
    label: "Earth",
    labelKo: "지구",
    emoji: "🌍",
    ellipsoidRadius: 6378137,
    imageryUrl: null,
    baseColor: "#0a0f1c",
    tagline: "Live geopolitical and AI-jobs intelligence.",
    taglineKo: "지구촌 실시간 시그널",
    locations: [],
    signalCategories: [
      "news",
      "conflict",
      "disease",
      "politics",
      "economy",
      "culture",
      "ai_jobs",
      "tech",
      "natural_disaster",
      "cyber",
      "terror",
      "climate",
    ],
  },
  moon: {
    planet: "moon",
    label: "Moon",
    labelKo: "달",
    emoji: "🌕",
    ellipsoidRadius: 1737400,
    imageryUrl:
      "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
    baseColor: "#3a3a3a",
    tagline: "Lunar bases, water-ice mining, Artemis era.",
    taglineKo: "달 기지와 우주 자원의 시대",
    locations: MOON_LOCATIONS,
    signalCategories: ["lunar_base", "space", "tech", "ai_jobs", "news"],
  },
  mars: {
    planet: "mars",
    label: "Mars",
    labelKo: "화성",
    emoji: "🔴",
    ellipsoidRadius: 3396000,
    imageryUrl:
      "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
    baseColor: "#5a2a1a",
    tagline: "Rovers, Starship corridors, the colony question.",
    taglineKo: "로버, 스타십, 그리고 콜로니",
    locations: MARS_LOCATIONS,
    signalCategories: ["mars_habitat", "space", "tech", "ai_jobs", "news"],
  },
};

export const PLANET_LIST: PlanetInfo[] = [
  PLANETS.earth,
  PLANETS.moon,
  PLANETS.mars,
];

export function isPlanet(value: unknown): value is Planet {
  return value === "earth" || value === "moon" || value === "mars";
}

export function findLocation(
  planet: Planet,
  code: string,
): PlanetLocation | undefined {
  return PLANETS[planet].locations.find(
    (l) => l.code.toUpperCase() === code.toUpperCase(),
  );
}

/** Curated sub-locations (sites) under each Moon/Mars location. Stored in the
 *  `cities` table with `countryCode` set to the parent location code so the
 *  same `/countries/:code/cities` + `/cities/:id/issues` flow works for space. */
export interface SpaceSite {
  id: string;
  parentLocationCode: string;
  planet: Planet;
  name: string;
  nameKo: string;
  latitude: number;
  longitude: number;
  importance: number;
}

export const SPACE_SITES: SpaceSite[] = [
  // Moon — Apollo 11
  { id: "MOON-APOLLO11-LM", parentLocationCode: "MOON-APOLLO11", planet: "moon", name: "Eagle Lander Pad", nameKo: "이글호 착륙 패드", latitude: 0.674, longitude: 23.473, importance: 90 },
  { id: "MOON-APOLLO11-EVA", parentLocationCode: "MOON-APOLLO11", planet: "moon", name: "EVA Heritage Trail", nameKo: "유산 보호 산책로", latitude: 0.687, longitude: 23.487, importance: 70 },
  // Moon — Artemis Base Camp
  { id: "MOON-ARTEMIS-HAB1", parentLocationCode: "MOON-ARTEMIS", planet: "moon", name: "Habitat Module Alpha", nameKo: "거주 모듈 알파", latitude: -89.9, longitude: 0.0, importance: 95 },
  { id: "MOON-ARTEMIS-COMM", parentLocationCode: "MOON-ARTEMIS", planet: "moon", name: "Polar Comm Relay", nameKo: "극지 통신 중계", latitude: -89.85, longitude: 5.0, importance: 80 },
  { id: "MOON-ARTEMIS-PAD", parentLocationCode: "MOON-ARTEMIS", planet: "moon", name: "Crew Landing Pad", nameKo: "유인 착륙 패드", latitude: -89.92, longitude: -3.5, importance: 88 },
  // Moon — Shackleton Crater
  { id: "MOON-SHACKLETON-MINE", parentLocationCode: "MOON-SHACKLETON", planet: "moon", name: "Ice Mine Shaft 1", nameKo: "얼음 채굴 1호 갱", latitude: -89.66, longitude: 129.2, importance: 92 },
  { id: "MOON-SHACKLETON-PROC", parentLocationCode: "MOON-SHACKLETON", planet: "moon", name: "Water Processing Plant", nameKo: "물 정제 플랜트", latitude: -89.62, longitude: 129.5, importance: 84 },
  // Moon — Mare Imbrium
  { id: "MOON-MAREIMBRIUM-PRINT", parentLocationCode: "MOON-MAREIMBRIUM", planet: "moon", name: "Regolith 3D-Print Lab", nameKo: "레골리스 3D 프린팅 랩", latitude: 32.8, longitude: -15.6, importance: 78 },
  { id: "MOON-MAREIMBRIUM-QUARRY", parentLocationCode: "MOON-MAREIMBRIUM", planet: "moon", name: "Basalt Quarry North", nameKo: "북부 현무암 채석장", latitude: 32.95, longitude: -15.4, importance: 70 },
  // Mars — Jezero Crater
  { id: "MARS-JEZERO-CACHE", parentLocationCode: "MARS-JEZERO", planet: "mars", name: "Sample Cache Depot", nameKo: "시료 보관소", latitude: 18.4, longitude: 77.7, importance: 92 },
  { id: "MARS-JEZERO-DELTA", parentLocationCode: "MARS-JEZERO", planet: "mars", name: "Ancient Delta Lab", nameKo: "고대 삼각주 연구소", latitude: 18.45, longitude: 77.6, importance: 85 },
  // Mars — Gale Crater
  { id: "MARS-GALE-YK", parentLocationCode: "MARS-GALE", planet: "mars", name: "Yellowknife Bay Camp", nameKo: "옐로나이프 베이 캠프", latitude: -5.4, longitude: 137.8, importance: 80 },
  { id: "MARS-GALE-SHARP", parentLocationCode: "MARS-GALE", planet: "mars", name: "Mount Sharp Outpost", nameKo: "샤프산 전초기지", latitude: -5.5, longitude: 137.9, importance: 75 },
  // Mars — Olympus Mons
  { id: "MARS-OLYMPUS-GEO", parentLocationCode: "MARS-OLYMPUS", planet: "mars", name: "Geothermal Survey Site", nameKo: "지열 조사 지점", latitude: 18.65, longitude: -133.8, importance: 78 },
  { id: "MARS-OLYMPUS-MINE", parentLocationCode: "MARS-OLYMPUS", planet: "mars", name: "Foothill Mineral Camp", nameKo: "산기슭 광물 캠프", latitude: 18.55, longitude: -133.9, importance: 72 },
  // Mars — Colony Alpha
  { id: "MARS-COLONY-A-DOME", parentLocationCode: "MARS-COLONY-A", planet: "mars", name: "Habitat Dome 1", nameKo: "거주 돔 1호", latitude: 4.5, longitude: 137.4, importance: 95 },
  { id: "MARS-COLONY-A-PORT", parentLocationCode: "MARS-COLONY-A", planet: "mars", name: "Starship Port", nameKo: "스타십 우주항", latitude: 4.55, longitude: 137.5, importance: 90 },
  { id: "MARS-COLONY-A-FARM", parentLocationCode: "MARS-COLONY-A", planet: "mars", name: "Greenhouse Farm Block", nameKo: "온실 농업 블록", latitude: 4.45, longitude: 137.35, importance: 82 },
];

/** Curated site-tagged signals for Moon/Mars. */
export const SPACE_SITE_ISSUES: Array<{
  cityId: string;
  parentLocationCode: string;
  planet: Planet;
  category: string;
  headline: string;
  body: string;
}> = [
  { cityId: "MOON-APOLLO11-LM", parentLocationCode: "MOON-APOLLO11", planet: "moon", category: "news", headline: "이글호 착륙 패드 정밀 3D 스캔 완료", body: "유산 보호용 디지털 트윈 구축 1단계 마무리." },
  { cityId: "MOON-APOLLO11-EVA", parentLocationCode: "MOON-APOLLO11", planet: "moon", category: "culture", headline: "EVA 산책로, 가상 관광 콘텐츠로 재공개", body: "유엔 협약 초안과 연계한 시범 프로젝트." },
  { cityId: "MOON-ARTEMIS-HAB1", parentLocationCode: "MOON-ARTEMIS", planet: "moon", category: "lunar_base", headline: "거주 모듈 알파, 90일 유인 체류 시뮬레이션 통과", body: "생명 유지 시스템 안정성 검증 완료." },
  { cityId: "MOON-ARTEMIS-COMM", parentLocationCode: "MOON-ARTEMIS", planet: "moon", category: "tech", headline: "극지 통신 중계, 지구 직통 대역폭 4배 확장", body: "원격 로봇 조종 지연 시간 200ms 미만." },
  { cityId: "MOON-ARTEMIS-PAD", parentLocationCode: "MOON-ARTEMIS", planet: "moon", category: "ai_jobs", headline: "착륙 패드 정비 인력 지구 원격 채용 시작", body: "야간 교대 근무 — 시급 기준 지구 평균의 6배." },
  { cityId: "MOON-SHACKLETON-MINE", parentLocationCode: "MOON-SHACKLETON", planet: "moon", category: "space", headline: "1호 갱 시추 깊이 80m 돌파 — 얼음 함량 확인", body: "민간 컨소시엄 라이선스 심사 가속." },
  { cityId: "MOON-SHACKLETON-PROC", parentLocationCode: "MOON-SHACKLETON", planet: "moon", category: "tech", headline: "물 정제 플랜트, 일일 산출량 목표치 초과 달성", body: "추진제용 산소 분리 라인 정상 가동." },
  { cityId: "MOON-MAREIMBRIUM-PRINT", parentLocationCode: "MOON-MAREIMBRIUM", planet: "moon", category: "tech", headline: "레골리스 3D 프린팅, 1.5m 두께 벽체 적층 성공", body: "방사선 차폐 거주 모듈 자가 건설 검증." },
  { cityId: "MOON-MAREIMBRIUM-QUARRY", parentLocationCode: "MOON-MAREIMBRIUM", planet: "moon", category: "ai_jobs", headline: "북부 채석장, 자율 굴삭기 야간 운용 정착", body: "지구 원격 감시 인력 12명 상시 근무." },
  { cityId: "MARS-JEZERO-CACHE", parentLocationCode: "MARS-JEZERO", planet: "mars", category: "space", headline: "시료 보관소, 38번째 캐싱 튜브 적치 완료", body: "샘플 회수 미션 발사창 5년 내 도래." },
  { cityId: "MARS-JEZERO-DELTA", parentLocationCode: "MARS-JEZERO", planet: "mars", category: "news", headline: "고대 삼각주 연구소, 유기물 신호 재현 실험 착수", body: "지하 1.5m 코어 샘플 연속 분석." },
  { cityId: "MARS-GALE-YK", parentLocationCode: "MARS-GALE", planet: "mars", category: "tech", headline: "옐로나이프 베이 캠프, 메탄 센서 어레이 증설", body: "농도 이상 변동 정밀 추적 체계 완성." },
  { cityId: "MARS-GALE-SHARP", parentLocationCode: "MARS-GALE", planet: "mars", category: "space", headline: "샤프산 전초기지, 지층별 기후 데이터 5억 년치 확보", body: "AI 기반 화성 고기후 모델 갱신." },
  { cityId: "MARS-OLYMPUS-GEO", parentLocationCode: "MARS-OLYMPUS", planet: "mars", category: "tech", headline: "지열 조사 지점, 지하 활화산 활동 흔적 포착", body: "에너지 자원화 가능성 검토 시작." },
  { cityId: "MARS-OLYMPUS-MINE", parentLocationCode: "MARS-OLYMPUS", planet: "mars", category: "ai_jobs", headline: "산기슭 광물 캠프, 원격 분광 분석가 50명 모집", body: "민간 우주 광업 1호 라이선스 절차 진입." },
  { cityId: "MARS-COLONY-A-DOME", parentLocationCode: "MARS-COLONY-A", planet: "mars", category: "mars_habitat", headline: "거주 돔 1호, 200일 무인 환경 검증 종료", body: "내년 유인 입주 일정 확정 단계." },
  { cityId: "MARS-COLONY-A-PORT", parentLocationCode: "MARS-COLONY-A", planet: "mars", category: "space", headline: "스타십 우주항, 무인 화물 5회 연속 착륙 성공", body: "콜로니 인프라 자재 누적 240톤 도착." },
  { cityId: "MARS-COLONY-A-FARM", parentLocationCode: "MARS-COLONY-A", planet: "mars", category: "ai_jobs", headline: "온실 농업 블록, 우주 농업 전문가 1기 정착 완료", body: "감자·시금치·딸기 3종 안정 생산 단계." },
];

/** Curated Moon/Mars seed signals. Earth signals come from real DB issues. */
export const SPACE_SEED_ISSUES: Array<{
  countryCode: string;
  planet: Planet;
  category: string;
  headline: string;
  body: string;
}> = [
  // Moon
  {
    countryCode: "MOON-ARTEMIS",
    planet: "moon",
    category: "lunar_base",
    headline: "NASA, 아르테미스 III 유인 착륙 일정 재확정",
    body: "달 남극 인근 상주 기지 후보지 7곳 최종 선정 단계.",
  },
  {
    countryCode: "MOON-SHACKLETON",
    planet: "moon",
    category: "space",
    headline: "민간 컨소시엄, 달 남극 물·얼음 채굴 라이선스 신청",
    body: "월면 자원 산업의 첫 상업 라이선스 시도.",
  },
  {
    countryCode: "MOON-MAREIMBRIUM",
    planet: "moon",
    category: "tech",
    headline: "월면 3D 프린팅 거주 모듈 시제품 시연 성공",
    body: "현지 레골리스를 활용한 자가 건설 실험 1단계 통과.",
  },
  {
    countryCode: "MOON-APOLLO11",
    planet: "moon",
    category: "news",
    headline: "유엔, 달 문화유산 보호 협약 초안 회람",
    body: "아폴로 착륙지를 포함한 역사 유적 보호 논의 본격화.",
  },
  {
    countryCode: "MOON-ARTEMIS",
    planet: "moon",
    category: "ai_jobs",
    headline: "원격 로봇 오퍼레이터 채용 공고 첫 등장",
    body: "달 표면 건설 로봇을 지구에서 조종하는 신직군 — 연봉 상위 1%.",
  },
  // Mars
  {
    countryCode: "MARS-JEZERO",
    planet: "mars",
    category: "space",
    headline: "퍼서비어런스, 고대 미생물 흔적 후보 시료 38번째 채집",
    body: "샘플 회수 임무로 이송 예정. 우주생물학계 주목.",
  },
  {
    countryCode: "MARS-COLONY-A",
    planet: "mars",
    category: "mars_habitat",
    headline: "스타십 무인 화성 화물 미션 11월 발사 확정",
    body: "콜로니 인프라 자재 60톤 운송 — 첫 화성 정착 시뮬레이션.",
  },
  {
    countryCode: "MARS-GALE",
    planet: "mars",
    category: "tech",
    headline: "큐리오시티, 메탄 농도 이상 변동 재차 관측",
    body: "지하 미생물 가설과 비생물학적 원인 사이 논쟁 가열.",
  },
  {
    countryCode: "MARS-OLYMPUS",
    planet: "mars",
    category: "ai_jobs",
    headline: "행성 지질학자 글로벌 수요, 5년 만에 4배",
    body: "민간 우주 기업의 자원 탐사 프로젝트 가속.",
  },
  {
    countryCode: "MARS-JEZERO",
    planet: "mars",
    category: "news",
    headline: "ESA·NASA 화성 샘플 회수 미션 예산 합의",
    body: "샘플의 지구 귀환 일정이 2033년으로 조정.",
  },
];
