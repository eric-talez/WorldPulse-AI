export interface SeedCity {
  id: string;
  countryCode: string;
  name: string;
  nameKo: string;
  latitude: number;
  longitude: number;
  population: number;
  importance: number;
}

export interface SeedCityIssue {
  cityId: string;
  category: string;
  headline: string;
  body: string;
}

export const SEED_CITIES: SeedCity[] = [
  // KR
  { id: "KR-seoul", countryCode: "KR", name: "Seoul", nameKo: "서울", latitude: 37.5665, longitude: 126.978, population: 9700000, importance: 95 },
  { id: "KR-busan", countryCode: "KR", name: "Busan", nameKo: "부산", latitude: 35.1796, longitude: 129.0756, population: 3400000, importance: 78 },
  { id: "KR-incheon", countryCode: "KR", name: "Incheon", nameKo: "인천", latitude: 37.4563, longitude: 126.7052, population: 2950000, importance: 72 },
  { id: "KR-daegu", countryCode: "KR", name: "Daegu", nameKo: "대구", latitude: 35.8714, longitude: 128.6014, population: 2400000, importance: 65 },
  { id: "KR-daejeon", countryCode: "KR", name: "Daejeon", nameKo: "대전", latitude: 36.3504, longitude: 127.3845, population: 1500000, importance: 64 },
  // US
  { id: "US-newyork", countryCode: "US", name: "New York", nameKo: "뉴욕", latitude: 40.7128, longitude: -74.006, population: 8400000, importance: 98 },
  { id: "US-losangeles", countryCode: "US", name: "Los Angeles", nameKo: "로스앤젤레스", latitude: 34.0522, longitude: -118.2437, population: 3900000, importance: 92 },
  { id: "US-sanfrancisco", countryCode: "US", name: "San Francisco", nameKo: "샌프란시스코", latitude: 37.7749, longitude: -122.4194, population: 870000, importance: 90 },
  { id: "US-chicago", countryCode: "US", name: "Chicago", nameKo: "시카고", latitude: 41.8781, longitude: -87.6298, population: 2700000, importance: 80 },
  { id: "US-washington", countryCode: "US", name: "Washington, D.C.", nameKo: "워싱턴 D.C.", latitude: 38.9072, longitude: -77.0369, population: 700000, importance: 88 },
  // JP
  { id: "JP-tokyo", countryCode: "JP", name: "Tokyo", nameKo: "도쿄", latitude: 35.6762, longitude: 139.6503, population: 13900000, importance: 97 },
  { id: "JP-osaka", countryCode: "JP", name: "Osaka", nameKo: "오사카", latitude: 34.6937, longitude: 135.5023, population: 2700000, importance: 82 },
  { id: "JP-kyoto", countryCode: "JP", name: "Kyoto", nameKo: "교토", latitude: 35.0116, longitude: 135.7681, population: 1450000, importance: 70 },
  { id: "JP-yokohama", countryCode: "JP", name: "Yokohama", nameKo: "요코하마", latitude: 35.4437, longitude: 139.638, population: 3700000, importance: 74 },
  { id: "JP-fukuoka", countryCode: "JP", name: "Fukuoka", nameKo: "후쿠오카", latitude: 33.5904, longitude: 130.4017, population: 1600000, importance: 66 },
  // CN
  { id: "CN-beijing", countryCode: "CN", name: "Beijing", nameKo: "베이징", latitude: 39.9042, longitude: 116.4074, population: 21500000, importance: 96 },
  { id: "CN-shanghai", countryCode: "CN", name: "Shanghai", nameKo: "상하이", latitude: 31.2304, longitude: 121.4737, population: 24800000, importance: 95 },
  { id: "CN-shenzhen", countryCode: "CN", name: "Shenzhen", nameKo: "선전", latitude: 22.5431, longitude: 114.0579, population: 17500000, importance: 90 },
  { id: "CN-guangzhou", countryCode: "CN", name: "Guangzhou", nameKo: "광저우", latitude: 23.1291, longitude: 113.2644, population: 15300000, importance: 85 },
  { id: "CN-chengdu", countryCode: "CN", name: "Chengdu", nameKo: "청두", latitude: 30.5728, longitude: 104.0668, population: 16300000, importance: 76 },
  // DE
  { id: "DE-berlin", countryCode: "DE", name: "Berlin", nameKo: "베를린", latitude: 52.52, longitude: 13.405, population: 3700000, importance: 92 },
  { id: "DE-munich", countryCode: "DE", name: "Munich", nameKo: "뮌헨", latitude: 48.1351, longitude: 11.582, population: 1500000, importance: 84 },
  { id: "DE-hamburg", countryCode: "DE", name: "Hamburg", nameKo: "함부르크", latitude: 53.5511, longitude: 9.9937, population: 1900000, importance: 76 },
  { id: "DE-frankfurt", countryCode: "DE", name: "Frankfurt", nameKo: "프랑크푸르트", latitude: 50.1109, longitude: 8.6821, population: 760000, importance: 80 },
  { id: "DE-cologne", countryCode: "DE", name: "Cologne", nameKo: "쾰른", latitude: 50.9375, longitude: 6.9603, population: 1080000, importance: 68 },
  // GB
  { id: "GB-london", countryCode: "GB", name: "London", nameKo: "런던", latitude: 51.5074, longitude: -0.1278, population: 9000000, importance: 96 },
  { id: "GB-manchester", countryCode: "GB", name: "Manchester", nameKo: "맨체스터", latitude: 53.4808, longitude: -2.2426, population: 550000, importance: 70 },
  { id: "GB-edinburgh", countryCode: "GB", name: "Edinburgh", nameKo: "에든버러", latitude: 55.9533, longitude: -3.1883, population: 530000, importance: 68 },
  { id: "GB-birmingham", countryCode: "GB", name: "Birmingham", nameKo: "버밍엄", latitude: 52.4862, longitude: -1.8904, population: 1140000, importance: 66 },
  { id: "GB-cambridge", countryCode: "GB", name: "Cambridge", nameKo: "케임브리지", latitude: 52.2053, longitude: 0.1218, population: 145000, importance: 72 },
  // FR
  { id: "FR-paris", countryCode: "FR", name: "Paris", nameKo: "파리", latitude: 48.8566, longitude: 2.3522, population: 2150000, importance: 95 },
  { id: "FR-lyon", countryCode: "FR", name: "Lyon", nameKo: "리옹", latitude: 45.764, longitude: 4.8357, population: 520000, importance: 72 },
  { id: "FR-marseille", countryCode: "FR", name: "Marseille", nameKo: "마르세유", latitude: 43.2965, longitude: 5.3698, population: 870000, importance: 70 },
  { id: "FR-toulouse", countryCode: "FR", name: "Toulouse", nameKo: "툴루즈", latitude: 43.6047, longitude: 1.4442, population: 480000, importance: 65 },
  // IN
  { id: "IN-delhi", countryCode: "IN", name: "Delhi", nameKo: "델리", latitude: 28.6139, longitude: 77.209, population: 32000000, importance: 95 },
  { id: "IN-mumbai", countryCode: "IN", name: "Mumbai", nameKo: "뭄바이", latitude: 19.076, longitude: 72.8777, population: 20400000, importance: 92 },
  { id: "IN-bengaluru", countryCode: "IN", name: "Bengaluru", nameKo: "벵갈루루", latitude: 12.9716, longitude: 77.5946, population: 13200000, importance: 90 },
  { id: "IN-chennai", countryCode: "IN", name: "Chennai", nameKo: "첸나이", latitude: 13.0827, longitude: 80.2707, population: 11500000, importance: 75 },
  { id: "IN-hyderabad", countryCode: "IN", name: "Hyderabad", nameKo: "하이데라바드", latitude: 17.385, longitude: 78.4867, population: 10300000, importance: 78 },
  // BR
  { id: "BR-saopaulo", countryCode: "BR", name: "São Paulo", nameKo: "상파울루", latitude: -23.5505, longitude: -46.6333, population: 12300000, importance: 92 },
  { id: "BR-rio", countryCode: "BR", name: "Rio de Janeiro", nameKo: "리우데자네이루", latitude: -22.9068, longitude: -43.1729, population: 6700000, importance: 86 },
  { id: "BR-brasilia", countryCode: "BR", name: "Brasília", nameKo: "브라질리아", latitude: -15.7939, longitude: -47.8828, population: 3100000, importance: 80 },
  { id: "BR-salvador", countryCode: "BR", name: "Salvador", nameKo: "살바도르", latitude: -12.9714, longitude: -38.5014, population: 2900000, importance: 65 },
  // RU
  { id: "RU-moscow", countryCode: "RU", name: "Moscow", nameKo: "모스크바", latitude: 55.7558, longitude: 37.6173, population: 12600000, importance: 95 },
  { id: "RU-spb", countryCode: "RU", name: "Saint Petersburg", nameKo: "상트페테르부르크", latitude: 59.9311, longitude: 30.3609, population: 5400000, importance: 82 },
  { id: "RU-novosibirsk", countryCode: "RU", name: "Novosibirsk", nameKo: "노보시비르스크", latitude: 55.0084, longitude: 82.9357, population: 1620000, importance: 60 },
  // UA
  { id: "UA-kyiv", countryCode: "UA", name: "Kyiv", nameKo: "키이우", latitude: 50.4501, longitude: 30.5234, population: 2900000, importance: 95 },
  { id: "UA-kharkiv", countryCode: "UA", name: "Kharkiv", nameKo: "하르키우", latitude: 49.9935, longitude: 36.2304, population: 1430000, importance: 80 },
  { id: "UA-odesa", countryCode: "UA", name: "Odesa", nameKo: "오데사", latitude: 46.4825, longitude: 30.7233, population: 1010000, importance: 75 },
  // IL
  { id: "IL-telaviv", countryCode: "IL", name: "Tel Aviv", nameKo: "텔아비브", latitude: 32.0853, longitude: 34.7818, population: 460000, importance: 92 },
  { id: "IL-jerusalem", countryCode: "IL", name: "Jerusalem", nameKo: "예루살렘", latitude: 31.7683, longitude: 35.2137, population: 950000, importance: 96 },
  { id: "IL-haifa", countryCode: "IL", name: "Haifa", nameKo: "하이파", latitude: 32.7940, longitude: 34.9896, population: 285000, importance: 70 },
  // SG
  { id: "SG-singapore", countryCode: "SG", name: "Singapore", nameKo: "싱가포르", latitude: 1.3521, longitude: 103.8198, population: 5700000, importance: 92 },
  // AE
  { id: "AE-dubai", countryCode: "AE", name: "Dubai", nameKo: "두바이", latitude: 25.2048, longitude: 55.2708, population: 3500000, importance: 88 },
  { id: "AE-abudhabi", countryCode: "AE", name: "Abu Dhabi", nameKo: "아부다비", latitude: 24.4539, longitude: 54.3773, population: 1500000, importance: 85 },
];

export const SEED_CITY_ISSUES: SeedCityIssue[] = [
  // Seoul
  { cityId: "KR-seoul", category: "ai_jobs", headline: "강남·판교, AI 엔지니어 평균 연봉 1.4억 돌파", body: "수요 폭증에 신입 초봉도 가파른 상승세." },
  { cityId: "KR-seoul", category: "economy", headline: "서울시, 디지털 노마드 비자 확대안 발표", body: "원격 근무자 1만 명 유치 목표." },
  { cityId: "KR-seoul", category: "tech", headline: "네이버 1784 사옥, 자율주행 로봇 200대 운영", body: "도심형 로봇 인프라 실증." },
  { cityId: "KR-seoul", category: "culture", headline: "성수동, 글로벌 K-컬처 브랜드 거점으로", body: "팝업·플래그십이 골목 단위로 확장." },
  // Busan
  { cityId: "KR-busan", category: "economy", headline: "부산항, 자동화 터미널 확장 — 북항 재개발 본격화", body: "스마트 항만 인력 재배치 논의." },
  { cityId: "KR-busan", category: "ai_jobs", headline: "부산 블록체인 특구, AI·웹3 인재 채용 박람회", body: "지역 청년 일자리 1,200건 매칭." },
  { cityId: "KR-busan", category: "culture", headline: "부산국제영화제, AI 영화 부문 신설", body: "생성형 영상 작품 상영." },
  // Incheon
  { cityId: "KR-incheon", category: "tech", headline: "인천공항, 도심항공교통(UAM) 정류장 시범 운영", body: "여의도·강남 노선 검증 단계." },
  { cityId: "KR-incheon", category: "economy", headline: "송도 바이오 클러스터, 글로벌 빅파마 R&D 센터 유치", body: "고임금 일자리 3,000개 창출 전망." },
  { cityId: "KR-incheon", category: "ai_jobs", headline: "인천 물류센터, 풀필먼트 자동화로 단순직 30% 감소", body: "재교육 프로그램 가동." },
  // Daegu
  { cityId: "KR-daegu", category: "tech", headline: "대구 로봇클러스터, 의료 로봇 양산 라인 가동", body: "수술 보조 로봇 국산화 1호." },
  { cityId: "KR-daegu", category: "ai_jobs", headline: "대구·경북 제조 AI 전환 사업, 2년차 결산", body: "중소기업 800곳 디지털화 완료." },
  // Daejeon
  { cityId: "KR-daejeon", category: "tech", headline: "대전 KAIST, 양자컴퓨터 1호기 실험 가동", body: "국가 양자 인프라 핵심 거점." },
  { cityId: "KR-daejeon", category: "ai_jobs", headline: "대덕연구단지, AI 연구원 채용 1,500명 확정", body: "정부 출연연 합동 모집." },
  // NYC
  { cityId: "US-newyork", category: "ai_jobs", headline: "Wall Street rolls out AI trader copilots firm-wide", body: "Mid-tier analyst headcount drops 12%." },
  { cityId: "US-newyork", category: "economy", headline: "뉴욕시, AI 스타트업 본사 유치 인센티브 확대", body: "맨해튼 사무 공실률 낮추기 카드." },
  { cityId: "US-newyork", category: "cyber", headline: "NYC subway payment system probed after data scrape", body: "MTA confirms anomaly investigation." },
  { cityId: "US-newyork", category: "culture", headline: "Broadway debuts first AI-co-written musical", body: "Critics divided on opening night." },
  // SF
  { cityId: "US-sanfrancisco", category: "ai_jobs", headline: "SF Bay Area AI hiring at all-time high — even amid layoffs", body: "Specialist roles up 280%." },
  { cityId: "US-sanfrancisco", category: "tech", headline: "Anthropic, OpenAI 신규 본사 SoMa로 확장", body: "샌프란시스코 다운타운 회복 신호." },
  { cityId: "US-sanfrancisco", category: "economy", headline: "San Francisco rolls back remote-work tax breaks", body: "Office return mandates take hold." },
  // LA
  { cityId: "US-losangeles", category: "culture", headline: "Hollywood unions ratify expanded AI-use protections", body: "Voice and likeness rules tightened." },
  { cityId: "US-losangeles", category: "natural_disaster", headline: "LA County wildfires force 5,000 evacuations", body: "Santa Ana winds intensify spread." },
  { cityId: "US-losangeles", category: "tech", headline: "LA, 자율 트럭 항만-내륙 회랑 시범", body: "롱비치-인랜드 엠파이어 구간." },
  // Chicago
  { cityId: "US-chicago", category: "economy", headline: "Chicago Fed warns AI productivity gap widening", body: "Mid-market firms slow to adopt." },
  { cityId: "US-chicago", category: "ai_jobs", headline: "시카고 보험·금융, 언더라이팅 AI 도입 가속", body: "주니어 직무 자동화 본격화." },
  // DC
  { cityId: "US-washington", category: "politics", headline: "백악관, 연방 AI 공급망 점검 행정명령 서명", body: "주요 기관 90일 내 보고 의무." },
  { cityId: "US-washington", category: "cyber", headline: "Federal agencies hit by coordinated phishing wave", body: "CISA issues emergency directive." },
  // Tokyo
  { cityId: "JP-tokyo", category: "ai_jobs", headline: "도쿄, 휴머노이드 콜센터 상용화 — 야간 업무 100% 무인", body: "1차 도입 기업 50곳." },
  { cityId: "JP-tokyo", category: "tech", headline: "도쿄대, 차세대 반도체 공동연구센터 개소", body: "민관 8조 원 투입." },
  { cityId: "JP-tokyo", category: "natural_disaster", headline: "수도권 규모 6.4 지진 — 신칸센 일시 중단", body: "조기경보 정상 작동." },
  { cityId: "JP-tokyo", category: "economy", headline: "Tokyo Stock Exchange hits 35-year high on AI play", body: "Foreign capital inflows accelerate." },
  // Osaka
  { cityId: "JP-osaka", category: "culture", headline: "오사카 엑스포 후속, AI 미래도시 전시관 상설화", body: "관광 콘텐츠로 재구성." },
  { cityId: "JP-osaka", category: "ai_jobs", headline: "오사카 제조벨트, 로봇 정비사 수요 3년 만에 2배", body: "신직군 교육 과정 확대." },
  // Kyoto
  { cityId: "JP-kyoto", category: "culture", headline: "교토, 사찰·전통공예 디지털 아카이브 완성", body: "AI 복원 기술이 핵심." },
  { cityId: "JP-kyoto", category: "tech", headline: "교토대, 양자센서 시제품 산업화 협약", body: "정밀 의료·자율주행 응용." },
  // Yokohama
  { cityId: "JP-yokohama", category: "economy", headline: "요코하마, 수소 항만 인프라 시범 운영", body: "탈탄소 물류 거점화." },
  { cityId: "JP-yokohama", category: "tech", headline: "요코하마 미나토미라이, 자율주행 셔틀 정규 노선", body: "주말 한정 운행 시작." },
  // Fukuoka
  { cityId: "JP-fukuoka", category: "ai_jobs", headline: "후쿠오카 스타트업 도시 선언, AI 비자 패스트트랙", body: "외국 창업가 500명 유치 목표." },
  // Beijing
  { cityId: "CN-beijing", category: "politics", headline: "베이징, 생성형 AI 콘텐츠 워터마크 단속 본격화", body: "위반 시 영업 정지." },
  { cityId: "CN-beijing", category: "tech", headline: "중관춘, 휴머노이드 로봇 산업 단지 조성", body: "5년 내 생산 100만 대 목표." },
  { cityId: "CN-beijing", category: "ai_jobs", headline: "베이징 빅테크, 모델 학습 인력 추가 채용", body: "전문 GPU 엔지니어 우대." },
  // Shanghai
  { cityId: "CN-shanghai", category: "economy", headline: "상하이 자유무역시험구, 외국인 디지털 자산 거래 시범", body: "푸둥 핀테크 허브 강화." },
  { cityId: "CN-shanghai", category: "tech", headline: "상하이, 자율주행 택시 24시간 무인 운영 확대", body: "주요 노선 전구간 적용." },
  { cityId: "CN-shanghai", category: "culture", headline: "상하이 비엔날레, AI 큐레이션 전시 화제", body: "관람객 수 역대 최다." },
  // Shenzhen
  { cityId: "CN-shenzhen", category: "tech", headline: "선전, 드론 택배 도심 일상화 — 일평균 8만 건", body: "DJI·메이투안 합작." },
  { cityId: "CN-shenzhen", category: "ai_jobs", headline: "선전 하드웨어 스타트업, 임베디드 AI 엔지니어 부족 호소", body: "연봉 인상 경쟁 가열." },
  // Guangzhou
  { cityId: "CN-guangzhou", category: "economy", headline: "광저우, 동남아 무역 결제 위안화 시범 확대", body: "광교회 기간 발표." },
  // Chengdu
  { cityId: "CN-chengdu", category: "culture", headline: "청두, 글로벌 게임 개발자 컨퍼런스 첫 개최", body: "AI 게임 디자인 트랙 신설." },
  // Berlin
  { cityId: "DE-berlin", category: "ai_jobs", headline: "베를린, EU AI Act 컨설턴트 채용 폭주", body: "전년 대비 220% 증가." },
  { cityId: "DE-berlin", category: "politics", headline: "독일 연방의회, AI 공공부문 도입 가이드라인 의결", body: "부처별 시범 사업 우선." },
  { cityId: "DE-berlin", category: "culture", headline: "베를리날레, AI 단편 영화 부문 신설", body: "글로벌 출품 1,200편." },
  // Munich
  { cityId: "DE-munich", category: "tech", headline: "BMW 뮌헨 본사, 차량 OS 자체 개발 라인 확대", body: "AI 인포테인먼트 인력 증원." },
  { cityId: "DE-munich", category: "economy", headline: "뮌헨 임대료, AI 인재 유입에 7년 연속 상승", body: "주거비 부담 사회 이슈화." },
  // Hamburg
  { cityId: "DE-hamburg", category: "economy", headline: "함부르크 항만, 자동화 크레인 200대 추가 도입", body: "물동량 확대 대응." },
  // Frankfurt
  { cityId: "DE-frankfurt", category: "economy", headline: "프랑크푸르트 ECB, 디지털 유로 시범 결제 개시", body: "소액 결제부터 단계적 확대." },
  // Cologne
  { cityId: "DE-cologne", category: "culture", headline: "쾰른, 게임스컴 AI 게임 부문 사상 최대 규모", body: "200개 스튜디오 참가." },
  // London
  { cityId: "GB-london", category: "ai_jobs", headline: "DeepMind expands London HQ, plans 2,000 hires", body: "Drug-discovery AI focus." },
  { cityId: "GB-london", category: "politics", headline: "런던, AI 안전 정상회의 II 개최 확정", body: "30개국 정상 참여." },
  { cityId: "GB-london", category: "economy", headline: "City of London, AI 리스크 관리자 신직군 채용 폭주", body: "헤지펀드 중심 수요." },
  { cityId: "GB-london", category: "cyber", headline: "NHS London trust hit by data exfil attempt", body: "Patient records reportedly intact." },
  // Manchester
  { cityId: "GB-manchester", category: "tech", headline: "Manchester graphene plant scales to industrial output", body: "Battery and chip applications." },
  // Edinburgh
  { cityId: "GB-edinburgh", category: "ai_jobs", headline: "에든버러대, 신뢰 가능한 AI 박사 과정 신설", body: "정부 장학금 100명 지원." },
  // Birmingham
  { cityId: "GB-birmingham", category: "economy", headline: "Birmingham becomes UK's largest data center cluster", body: "Net-zero cooling deals signed." },
  // Cambridge
  { cityId: "GB-cambridge", category: "tech", headline: "Cambridge spinout unveils protein-folding AI v3", body: "Free academic tier launched." },
  // Paris
  { cityId: "FR-paris", category: "culture", headline: "파리, AI 영화제 첫 개최 — 모든 작품이 AI 협업", body: "관객상은 한국 작품." },
  { cityId: "FR-paris", category: "politics", headline: "Paris hosts EU sovereign-AI summit", body: "Open model funding pledged." },
  { cityId: "FR-paris", category: "tech", headline: "파리, 2030 자율주행 셔틀 도시 선언", body: "센강 좌안부터 시범." },
  // Lyon
  { cityId: "FR-lyon", category: "economy", headline: "리옹 바이오 클러스터, mRNA 생산 라인 확장", body: "글로벌 백신 허브 도약." },
  // Marseille
  { cityId: "FR-marseille", category: "natural_disaster", headline: "Marseille faces record Mediterranean wildfires", body: "Air-quality alerts citywide." },
  // Toulouse
  { cityId: "FR-toulouse", category: "tech", headline: "툴루즈 에어버스, 자율 비행 시제기 시험 비행", body: "지역 인공지능 인력 채용 확대." },
  // Delhi
  { cityId: "IN-delhi", category: "climate", headline: "델리 대기질 사상 최악 — 학교 휴교 연장", body: "겨울철 스모그 비상." },
  { cityId: "IN-delhi", category: "ai_jobs", headline: "델리 NCR, 글로벌 캡티브 AI 센터 200곳 돌파", body: "포춘 500 다수 참여." },
  { cityId: "IN-delhi", category: "politics", headline: "인도 정부, 디지털 ID 활용 공공서비스 전면 개편", body: "AI 챗봇 기반 민원 응대." },
  // Mumbai
  { cityId: "IN-mumbai", category: "economy", headline: "뭄바이 증권거래소, 알고리즘 트레이딩 비중 70% 돌파", body: "감독 규정 강화 논의." },
  { cityId: "IN-mumbai", category: "terror", headline: "뭄바이 다중밀집시설 폭발물 모의 적발", body: "NIA 조사 확대." },
  // Bengaluru
  { cityId: "IN-bengaluru", category: "ai_jobs", headline: "벵갈루루 IT 임금, 18개월 만에 2배 — 인재 전쟁", body: "글로벌 빅테크 동시 채용." },
  { cityId: "IN-bengaluru", category: "tech", headline: "Bengaluru startup launches India-trained foundation model", body: "Open weights, Indic languages." },
  { cityId: "IN-bengaluru", category: "economy", headline: "벵갈루루, 글로벌 캡티브 R&D 센터 5년 내 2배 전망", body: "다국적 기업 본사 기능 이전." },
  // Chennai
  { cityId: "IN-chennai", category: "tech", headline: "첸나이, 인도 첫 반도체 후공정 라인 가동", body: "5년 내 1만 명 고용 목표." },
  // Hyderabad
  { cityId: "IN-hyderabad", category: "economy", headline: "하이데라바드 'Cyberabad', 글로벌 SaaS 본사 추가 유치", body: "지역 일자리 4만 개 창출." },
  // Sao Paulo
  { cityId: "BR-saopaulo", category: "economy", headline: "상파울루, 라틴 핀테크 허브 1위 재확정", body: "Nubank·Stone 본사 효과." },
  { cityId: "BR-saopaulo", category: "ai_jobs", headline: "São Paulo banks deploy AI customer agents at scale", body: "Branch headcount continues to fall." },
  // Rio
  { cityId: "BR-rio", category: "culture", headline: "리우 카니발, AI 기반 의상 디자인 콘테스트 개최", body: "전통과 기술의 융합 시도." },
  { cityId: "BR-rio", category: "natural_disaster", headline: "Rio faces record floods after summer storms", body: "Favelas hardest hit." },
  // Brasilia
  { cityId: "BR-brasilia", category: "politics", headline: "브라질 의회, 생성형 AI 규제법 1차 통과", body: "EU 모델 일부 차용." },
  // Salvador
  { cityId: "BR-salvador", category: "culture", headline: "살바도르, 아프로-브라질 음악 AI 협업 페스티벌", body: "전통 리듬 데이터화." },
  // Moscow
  { cityId: "RU-moscow", category: "cyber", headline: "Moscow-linked APT breaches European logistics firm", body: "Supply-chain disruption suspected." },
  { cityId: "RU-moscow", category: "politics", headline: "모스크바, 자체 AI 모델 국가 전략으로 격상", body: "내부 데이터 활용 강조." },
  // SPB
  { cityId: "RU-spb", category: "culture", headline: "상트페테르부르크, 디지털 박물관 메타버스 개관", body: "에르미타주 전시 일부 공개." },
  // Novosibirsk
  { cityId: "RU-novosibirsk", category: "tech", headline: "노보시비르스크 학술도시, 양자컴퓨팅 연구단 출범", body: "정부·대학 합동." },
  // Kyiv
  { cityId: "UA-kyiv", category: "conflict", headline: "키이우 인근 드론 공격 24시간 지속", body: "민간 시설 피해 보고." },
  { cityId: "UA-kyiv", category: "news", headline: "EU, 키이우 재건 기금 추가 분배안 승인", body: "주거·인프라 우선." },
  { cityId: "UA-kyiv", category: "tech", headline: "키이우, 군사 AI 스타트업 50개 동시 인큐베이션", body: "방산-민간 기술 이전 가속." },
  // Kharkiv
  { cityId: "UA-kharkiv", category: "conflict", headline: "하르키우, 야간 미사일 공습 — 전력망 일부 손상", body: "긴급 복구 진행 중." },
  // Odesa
  { cityId: "UA-odesa", category: "economy", headline: "오데사 항, 곡물 수출 회랑 재가동 합의", body: "흑해 안전 통로 강화." },
  // Tel Aviv
  { cityId: "IL-telaviv", category: "tech", headline: "텔아비브, 사이버보안 유니콘 5곳 동시 등장", body: "글로벌 투자 기록." },
  { cityId: "IL-telaviv", category: "ai_jobs", headline: "Tel Aviv startups launch joint AI talent visa drive", body: "Global engineers welcome." },
  // Jerusalem
  { cityId: "IL-jerusalem", category: "terror", headline: "예루살렘 도심 차량 돌진 테러 시도, 용의자 검거", body: "현장 무력 진압." },
  { cityId: "IL-jerusalem", category: "politics", headline: "예루살렘, 종교 유적 디지털 보존 국제 협약 추진", body: "유네스코 협력." },
  // Haifa
  { cityId: "IL-haifa", category: "tech", headline: "하이파, AI 반도체 R&D 신규 펩 착공", body: "엔비디아·인텔 협업." },
  // Singapore
  { cityId: "SG-singapore", category: "tech", headline: "싱가포르, 동남아 AI 인프라 허브 도약 — 데이터센터 동시 확장", body: "구글·MS 발표." },
  { cityId: "SG-singapore", category: "economy", headline: "Singapore rolls out sovereign AI compute fund", body: "Local startups prioritized." },
  { cityId: "SG-singapore", category: "ai_jobs", headline: "싱가포르, AI 인재 영주권 패스트트랙", body: "지역 본부 기능 강화." },
  // Dubai
  { cityId: "AE-dubai", category: "tech", headline: "두바이, 자율 비행 택시 상용 운항 개시", body: "세계 최초 정규 노선." },
  { cityId: "AE-dubai", category: "economy", headline: "Dubai tokenized real-estate market crosses $5B", body: "Foreign investors lead trades." },
  // Abu Dhabi
  { cityId: "AE-abudhabi", category: "ai_jobs", headline: "아부다비 G42, 아랍어 LLM 인력 1,500명 모집", body: "역내 최대 규모 채용." },
];
