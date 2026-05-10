import {
  db,
  countriesTable,
  issuesTable,
  forumPostsTable,
  jobReportsTable,
} from "@workspace/db";
import { analyzeJob } from "./lib/jobAnalysis";

const COUNTRIES = [
  { code: "KR", name: "South Korea", nameKo: "대한민국", flag: "🇰🇷", latitude: 37.5665, longitude: 126.978, riskScore: 72, region: "Asia" },
  { code: "US", name: "United States", nameKo: "미국", flag: "🇺🇸", latitude: 38.9072, longitude: -77.0369, riskScore: 68, region: "Americas" },
  { code: "JP", name: "Japan", nameKo: "일본", flag: "🇯🇵", latitude: 35.6895, longitude: 139.6917, riskScore: 65, region: "Asia" },
  { code: "CN", name: "China", nameKo: "중국", flag: "🇨🇳", latitude: 39.9042, longitude: 116.4074, riskScore: 78, region: "Asia" },
  { code: "DE", name: "Germany", nameKo: "독일", flag: "🇩🇪", latitude: 52.52, longitude: 13.405, riskScore: 58, region: "Europe" },
  { code: "GB", name: "United Kingdom", nameKo: "영국", flag: "🇬🇧", latitude: 51.5074, longitude: -0.1278, riskScore: 62, region: "Europe" },
  { code: "FR", name: "France", nameKo: "프랑스", flag: "🇫🇷", latitude: 48.8566, longitude: 2.3522, riskScore: 60, region: "Europe" },
  { code: "IN", name: "India", nameKo: "인도", flag: "🇮🇳", latitude: 28.6139, longitude: 77.209, riskScore: 70, region: "Asia" },
  { code: "BR", name: "Brazil", nameKo: "브라질", flag: "🇧🇷", latitude: -15.8267, longitude: -47.9218, riskScore: 64, region: "Americas" },
  { code: "RU", name: "Russia", nameKo: "러시아", flag: "🇷🇺", latitude: 55.7558, longitude: 37.6173, riskScore: 81, region: "Europe" },
  { code: "UA", name: "Ukraine", nameKo: "우크라이나", flag: "🇺🇦", latitude: 50.4501, longitude: 30.5234, riskScore: 92, region: "Europe" },
  { code: "IL", name: "Israel", nameKo: "이스라엘", flag: "🇮🇱", latitude: 31.7683, longitude: 35.2137, riskScore: 88, region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", nameKo: "사우디아라비아", flag: "🇸🇦", latitude: 24.7136, longitude: 46.6753, riskScore: 67, region: "Middle East" },
  { code: "AE", name: "United Arab Emirates", nameKo: "아랍에미리트", flag: "🇦🇪", latitude: 24.4539, longitude: 54.3773, riskScore: 55, region: "Middle East" },
  { code: "ZA", name: "South Africa", nameKo: "남아프리카 공화국", flag: "🇿🇦", latitude: -25.7479, longitude: 28.2293, riskScore: 71, region: "Africa" },
  { code: "EG", name: "Egypt", nameKo: "이집트", flag: "🇪🇬", latitude: 30.0444, longitude: 31.2357, riskScore: 74, region: "Africa" },
  { code: "AU", name: "Australia", nameKo: "호주", flag: "🇦🇺", latitude: -35.2809, longitude: 149.13, riskScore: 52, region: "Oceania" },
  { code: "CA", name: "Canada", nameKo: "캐나다", flag: "🇨🇦", latitude: 45.4215, longitude: -75.6972, riskScore: 56, region: "Americas" },
  { code: "MX", name: "Mexico", nameKo: "멕시코", flag: "🇲🇽", latitude: 19.4326, longitude: -99.1332, riskScore: 73, region: "Americas" },
  { code: "SG", name: "Singapore", nameKo: "싱가포르", flag: "🇸🇬", latitude: 1.3521, longitude: 103.8198, riskScore: 50, region: "Asia" },
];

const ISSUES: Array<{ countryCode: string; category: string; headline: string; body: string }> = [
  { countryCode: "KR", category: "ai_jobs", headline: "삼성·SK, AI 엔지니어 1만 명 채용 발표", body: "국내 대기업이 향후 3년간 AI 인력 확보에 총력을 기울입니다." },
  { countryCode: "KR", category: "economy", headline: "서울 부동산, 디지털 전환 인력 유입에 반등", body: "강남·판교권 인구 유입으로 매매가가 다시 움직이고 있습니다." },
  { countryCode: "KR", category: "politics", headline: "정부, AI 기본법 국회 통과", body: "한국형 AI 거버넌스 윤곽이 드러났습니다." },
  { countryCode: "US", category: "ai_jobs", headline: "OpenAI, GPT-6 학습 인프라 100억 달러 투자", body: "데이터센터 확장과 함께 1만 개 이상의 신규 일자리가 창출됩니다." },
  { countryCode: "US", category: "tech", headline: "엔비디아, 차세대 AI 칩 ‘블랙웰 X’ 공개", body: "추론 성능이 전 세대 대비 5배 향상됐습니다." },
  { countryCode: "US", category: "politics", headline: "백악관, 연방 AI 안전위원회 출범", body: "연방 차원의 AI 규제 프레임워크가 본격화됩니다." },
  { countryCode: "JP", category: "economy", headline: "일본은행, 디지털 엔 시범 도입 확대", body: "고령화 대응과 결제 효율화를 위한 정책 실험입니다." },
  { countryCode: "JP", category: "ai_jobs", headline: "도요타, 휴머노이드 로봇 양산 라인 가동", body: "제조 현장의 노동력 부족을 로봇으로 보완합니다." },
  { countryCode: "CN", category: "tech", headline: "중국, 자체 LLM ‘딥시크-3’ 오픈소스 공개", body: "GPT-4 수준 성능을 무료로 공개하며 시장에 충격을 줬습니다." },
  { countryCode: "CN", category: "politics", headline: "베이징, AI 콘텐츠 워터마크 의무화", body: "생성형 AI 결과물의 출처 표시가 법제화됩니다." },
  { countryCode: "DE", category: "economy", headline: "독일 자동차 업계, AI 전환에 GDP 0.7%p 성장", body: "BMW·메르세데스가 공정 자동화로 수익성을 회복 중입니다." },
  { countryCode: "DE", category: "ai_jobs", headline: "EU AI Act 컨설턴트 수요 폭증", body: "베를린·뮌헨에서 관련 직무 채용이 전년 대비 220% 증가했습니다." },
  { countryCode: "GB", category: "tech", headline: "런던, ‘AI 안전 정상회의 II’ 개최 확정", body: "30개국 정상이 AI 위험 대응을 논의합니다." },
  { countryCode: "GB", category: "ai_jobs", headline: "DeepMind, 케임브리지 연구소 확장", body: "신약 개발 AI 인력 2,000명 추가 채용 계획." },
  { countryCode: "FR", category: "culture", headline: "파리, AI 영화제 첫 개최", body: "전 작품이 AI와 협업한 작품으로 구성됩니다." },
  { countryCode: "IN", category: "ai_jobs", headline: "인도, 글로벌 AI 인재 50만 명 양성 발표", body: "벵갈루루 중심의 IT 허브가 더욱 강화됩니다." },
  { countryCode: "BR", category: "economy", headline: "브라질, 농업 AI 도입으로 수출 사상 최대", body: "기후 예측과 토양 분석에 AI를 적용한 결과입니다." },
  { countryCode: "RU", category: "conflict", headline: "러시아·우크라이나 휴전 협상 4차 결렬", body: "양측이 영토 문제로 합의에 이르지 못했습니다." },
  { countryCode: "UA", category: "conflict", headline: "키이우 인근 드론 공격 24시간 지속", body: "민간 시설 피해가 보고되고 있습니다." },
  { countryCode: "UA", category: "news", headline: "EU, 우크라이나 재건 기금 500억 유로 승인", body: "전후 인프라 복구가 본격화됩니다." },
  { countryCode: "IL", category: "conflict", headline: "가자 휴전 협상 카타르 중재로 재개", body: "인질 협상이 핵심 의제입니다." },
  { countryCode: "SA", category: "economy", headline: "사우디 PIF, AI 스타트업에 200억 달러 투자", body: "비전 2030의 핵심 축으로 AI를 지정했습니다." },
  { countryCode: "AE", category: "tech", headline: "두바이, 도심항공교통(UAM) 상용 운항 개시", body: "전 세계 최초로 자율 비행 택시가 상용화됐습니다." },
  { countryCode: "ZA", category: "disease", headline: "남아공, 신종 호흡기 바이러스 환자 급증", body: "보건당국이 모니터링을 강화했습니다." },
  { countryCode: "EG", category: "politics", headline: "이집트 총선, 청년 후보 약진", body: "디지털 경제 공약이 핵심 이슈로 부상했습니다." },
  { countryCode: "AU", category: "ai_jobs", headline: "호주, 사이버보안 AI 전문가 비자 패스트트랙", body: "5,000명 규모의 인재 영입 프로그램입니다." },
  { countryCode: "CA", category: "tech", headline: "토론토 AI 클러스터, 글로벌 톱5 진입", body: "벡터 인스티튜트가 핵심 허브 역할을 하고 있습니다." },
  { countryCode: "MX", category: "economy", headline: "멕시코, 니어쇼어링 효과로 제조업 호황", body: "미국 시장 인접성이 다시 주목받고 있습니다." },
  { countryCode: "SG", category: "tech", headline: "싱가포르, 동남아 AI 인프라 허브로 도약", body: "구글·MS가 동시에 데이터센터 확장을 발표했습니다." },
  { countryCode: "IN", category: "disease", headline: "인도 일부 지역 뎅기열 확산 경계", body: "몬순 후 모기 매개 질병 우려가 커지고 있습니다." },

  // natural_disaster
  { countryCode: "JP", category: "natural_disaster", headline: "도쿄 인근 규모 6.4 지진… 지진 조기경보 작동", body: "수도권 일대 흔들림 감지, 인명 피해는 미보고." },
  { countryCode: "JP", category: "natural_disaster", headline: "Japan tsunami advisory lifted after Pacific quake swarm", body: "Coastal residents return after 6-hour alert." },
  { countryCode: "MX", category: "natural_disaster", headline: "멕시코 남부 활화산 분화, 인근 마을 5천 명 대피", body: "포포카테페틀 화산 활동 급증." },
  { countryCode: "IN", category: "natural_disaster", headline: "인도 동부 사이클론 ‘레미’ 상륙, 정전·홍수 피해", body: "오디샤·서벵골 200만 명 영향." },
  { countryCode: "BR", category: "natural_disaster", headline: "Brazil Amazon basin floods displace 80k families", body: "Record river-level rises across three states." },
  { countryCode: "AU", category: "natural_disaster", headline: "호주 NSW 산불 확산, 비상사태 선포", body: "강풍과 고온으로 진화 난항." },
  { countryCode: "US", category: "natural_disaster", headline: "캘리포니아 강풍성 산불, 1만 가구 대피령", body: "북부 카운티 다수에 적색 경보." },

  // cyber
  { countryCode: "US", category: "cyber", headline: "미 연방기관 노린 랜섬웨어 공격, 비상 대응 가동", body: "CISA가 다부처 공동 대응에 착수." },
  { countryCode: "KR", category: "cyber", headline: "국내 통신사 해킹 시도 급증, KISA 공격 패턴 공개", body: "보안 업데이트 권고 발령." },
  { countryCode: "RU", category: "cyber", headline: "Russia-linked APT group breaches European logistics firm", body: "Supply-chain disruption suspected." },
  { countryCode: "IL", category: "cyber", headline: "이스라엘 보안기업, 신종 제로데이 취약점 발견", body: "주요 브라우저 벤더에 비공개 보고." },
  { countryCode: "DE", category: "cyber", headline: "독일 자동차 OEM, 공급망 사이버공격으로 생산 일시 중단", body: "협력사 시스템 마비 영향." },
  { countryCode: "GB", category: "cyber", headline: "UK NHS systems hit by data exfiltration attempt", body: "Patient records reportedly intact." },
  { countryCode: "SG", category: "cyber", headline: "싱가포르 핀테크, 대규모 자격증명 유출 사고 발표", body: "MAS 조사 진행 중." },

  // terror
  { countryCode: "EG", category: "terror", headline: "이집트 시나이반도 차량 폭탄 테러, 사상자 발생", body: "치안군이 추가 위협 차단 작전 진행." },
  { countryCode: "IL", category: "terror", headline: "예루살렘 도심 차량 돌진 테러 시도, 용의자 검거", body: "현장에서 무력 진압." },
  { countryCode: "IN", category: "terror", headline: "뭄바이 다중밀집시설 대상 폭발물 모의 적발", body: "NIA 조사 확대." },
  { countryCode: "FR", category: "terror", headline: "France raises terror alert after thwarted Paris plot", body: "Vigipirate at 'attack imminent'." },
  { countryCode: "RU", category: "terror", headline: "러시아 모스크바 인근 시설 노린 테러 시도 좌절", body: "FSB 작전으로 용의자 검거." },
  { countryCode: "SA", category: "terror", headline: "사우디, 메카 인근 무장조직 검거 작전 성공", body: "성지순례 안전 강화 조치." },

  // climate
  { countryCode: "BR", category: "climate", headline: "아마존 우림 손실 면적, 전년 대비 18% 증가", body: "감시 위성 데이터 기반 분석." },
  { countryCode: "AU", category: "climate", headline: "Great Barrier Reef hits 5th mass bleaching event", body: "Scientists warn ecosystem near tipping point." },
  { countryCode: "IN", category: "climate", headline: "인도 북부 폭염, 체감온도 49도 기록 — 사망자 보고", body: "북부 7개 주 적색 경보." },
  { countryCode: "DE", category: "climate", headline: "EU, 2040년 탄소배출 90% 감축 목표 합의", body: "회원국 정상회의서 만장일치." },
  { countryCode: "FR", category: "climate", headline: "프랑스, 가뭄으로 농업 수확량 30% 감소 전망", body: "곡창 지대 강수량 평년의 절반." },
  { countryCode: "CN", category: "climate", headline: "중국 황허 유역 가뭄 장기화, 농업 비상", body: "수자원부 비상 배분 조치." },
  { countryCode: "GB", category: "climate", headline: "London proposes congestion-zone expansion to hit net-zero", body: "Public consultation opens." },
  { countryCode: "KR", category: "climate", headline: "한반도 평균기온, 평년 대비 +2.1도 — 기상청 분석", body: "여름철 폭염일수 역대 최다 전망." },
];

const FORUM_POSTS = [
  { countryCode: "KR", author: "anonymous_dev", title: "세무사 합격했는데 AI 보면서 진로 고민됩니다", body: "30대 후반에 합격했는데 솔직히 두렵습니다." },
  { countryCode: "KR", author: "design_kim", title: "디자이너로 살아남기 - 솔직한 후기", body: "AI 도구 안 쓰면 안 되는 시대입니다." },
  { countryCode: "US", author: "sf_engineer", title: "Big Tech layoffs round 4 — anyone else?", body: "Anyone here transitioning into AI infra roles?" },
  { countryCode: "JP", author: "tokyo_writer", title: "AIライターとの共存", body: "翻訳の仕事が半分になった。" },
  { countryCode: "DE", author: "berlin_pm", title: "EU AI Act compliance — your team ready?", body: "We have 6 months left." },
  { countryCode: "IN", author: "blr_dev", title: "Bengaluru AI hiring is wild right now", body: "Salaries doubled in 18 months." },
  { countryCode: "CN", author: "shanghai_ai", title: "深度求索3 オープンソース化の影響", body: "国内スタートアップに追い風。" },
  { countryCode: "GB", author: "london_phd", title: "DeepMind drug discovery role — interview prep", body: "Sharing my experience for those applying." },
];

const SEED_REPORTS = [
  { jobName: "세무사", countryCode: "KR" },
  { jobName: "Software Engineer", countryCode: "US" },
  { jobName: "마케팅 매니저", countryCode: "KR" },
  { jobName: "Nurse", countryCode: "JP" },
  { jobName: "UX Designer", countryCode: "DE" },
  { jobName: "데이터 분석가", countryCode: "IN" },
];

async function main(): Promise<void> {
  const existing = await db.select().from(countriesTable).limit(1);
  if (existing.length > 0) {
    console.log("Seed: countries already exist, skipping.");
    return;
  }

  console.log("Seed: inserting countries…");
  await db.insert(countriesTable).values(COUNTRIES);

  console.log("Seed: inserting issues…");
  const now = Date.now();
  await db.insert(issuesTable).values(
    ISSUES.map((iss, idx) => ({
      ...iss,
      publishedAt: new Date(now - idx * 1000 * 60 * 17),
    })),
  );

  console.log("Seed: inserting forum posts…");
  await db.insert(forumPostsTable).values(
    FORUM_POSTS.map((p, idx) => ({
      ...p,
      replyCount: Math.floor(Math.random() * 24) + 1,
      createdAt: new Date(now - idx * 1000 * 60 * 60 * 6),
    })),
  );

  console.log("Seed: generating sample job reports…");
  for (const r of SEED_REPORTS) {
    const country = COUNTRIES.find((c) => c.code === r.countryCode)!;
    const result = analyzeJob(r.jobName, country.code, country.nameKo);
    await db.insert(jobReportsTable).values({
      jobName: r.jobName,
      countryCode: country.code,
      countryName: country.nameKo,
      ...result,
    });
  }

  console.log("Seed: done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
