type JobProfile = {
  automationRisk: number;
  growthScore: number;
  summary: string;
  automatedTasks: string[];
  humanStrengths: string[];
  futureChanges: string[];
  recommendedSkills: string[];
};

const PROFILES: Record<string, JobProfile> = {
  tax: {
    automationRisk: 78,
    growthScore: 32,
    summary:
      "AI는 표준 세무 신고와 장부 처리 대부분을 자동화하지만, 복잡한 절세 전략과 세무 조사 대응은 여전히 사람의 영역입니다.",
    automatedTasks: [
      "정형화된 부가세·소득세 신고서 작성",
      "전표 자동 분류와 거래 매칭",
      "기본 세금 계산 및 환급액 시뮬레이션",
      "회계 보고서 1차 검토",
    ],
    humanStrengths: [
      "기업 구조 변화에 따른 절세 전략 설계",
      "세무 조사·이의신청 대리",
      "고객의 사업 맥락을 이해한 컨설팅",
      "윤리적 판단과 책임 서명",
    ],
    futureChanges: [
      "단순 신고 업무는 AI 플랫폼으로 이동",
      "세무사는 어드바이저·전략가로 포지션 전환",
      "구독형 자문 모델이 시간당 청구를 대체",
      "데이터 기반 리스크 예측이 핵심 차별화",
    ],
    recommendedSkills: [
      "재무 데이터 분석",
      "AI 세무 도구 운용",
      "M&A·국제 조세 전문성",
      "고객 커뮤니케이션",
    ],
  },
  dev: {
    automationRisk: 55,
    growthScore: 78,
    summary:
      "AI 코드 생성으로 보일러플레이트는 줄지만, 시스템 설계·아키텍처·코드 리뷰의 가치는 오히려 커집니다.",
    automatedTasks: [
      "CRUD·UI 보일러플레이트 코드 작성",
      "단위 테스트 초안 생성",
      "문서화 초안 작성",
      "단순 버그 패턴 자동 수정",
    ],
    humanStrengths: [
      "시스템 아키텍처와 트레이드오프 결정",
      "비즈니스 요구의 기술 번역",
      "성능·보안 critical 영역 설계",
      "팀 리딩과 멘토링",
    ],
    futureChanges: [
      "AI 페어 프로그래밍이 표준",
      "프롬프트·에이전트 오케스트레이션이 새로운 핵심 역량",
      "주니어 진입 장벽 상승, 시니어 가치 상승",
      "도메인 전문성을 갖춘 풀스택 엔지니어 수요 폭증",
    ],
    recommendedSkills: [
      "시스템 설계",
      "AI 에이전트 오케스트레이션",
      "분산 시스템·클라우드",
      "도메인 비즈니스 이해",
    ],
  },
  nurse: {
    automationRisk: 18,
    growthScore: 88,
    summary:
      "고령화와 만성질환 증가로 간호 수요는 폭증하지만, 환자 케어의 본질은 사람 중심으로 남습니다.",
    automatedTasks: [
      "환자 차트 자동 정리",
      "약물 상호작용 1차 체크",
      "활력 징후 모니터링과 알림",
      "행정 문서 자동 작성",
    ],
    humanStrengths: [
      "환자 정서 케어와 신뢰 형성",
      "응급 상황 판단과 처치",
      "가족과의 커뮤니케이션",
      "임상적 직관과 손기술",
    ],
    futureChanges: [
      "AI 보조로 행정 부담 감소",
      "전문 간호사(NP) 영역 확대",
      "원격 모니터링·홈케어 시장 급성장",
      "다국어·문화적 역량의 가치 상승",
    ],
    recommendedSkills: [
      "전문 간호 자격",
      "디지털 헬스 도구 활용",
      "정신 건강 케어",
      "리더십·팀 관리",
    ],
  },
  marketing: {
    automationRisk: 64,
    growthScore: 60,
    summary:
      "콘텐츠 생산과 광고 운영은 자동화되지만, 브랜드 전략과 크리에이티브 디렉션은 더 중요해집니다.",
    automatedTasks: [
      "광고 카피·이미지 대량 생성",
      "A/B 테스트 자동 실행",
      "성과 리포팅과 인사이트 추출",
      "SNS 일정 관리",
    ],
    humanStrengths: [
      "브랜드 정체성과 톤 정립",
      "크리에이티브 디렉션",
      "고객 인사이트 발굴",
      "위기 커뮤니케이션",
    ],
    futureChanges: [
      "1인 마케터의 생산성이 팀 규모로 확장",
      "데이터 분석 역량이 필수",
      "AI 생성 콘텐츠의 큐레이션이 핵심 업무",
      "브랜드 스토리텔링의 가치 상승",
    ],
    recommendedSkills: [
      "데이터 분석",
      "AI 콘텐츠 도구 활용",
      "브랜드 전략",
      "크리에이티브 디렉션",
    ],
  },
  designer: {
    automationRisk: 58,
    growthScore: 70,
    summary:
      "AI는 시안과 변형을 빠르게 생성하지만, 문제 정의와 시스템 사고 기반 디자인은 사람의 영역입니다.",
    automatedTasks: [
      "아이콘·일러스트 변형 생성",
      "레이아웃 시안 자동 제안",
      "리사이즈·로컬라이징 작업",
      "단순 목업 생성",
    ],
    humanStrengths: [
      "사용자 리서치와 문제 정의",
      "디자인 시스템 설계",
      "브랜드 정체성 구축",
      "이해관계자 설득과 협업",
    ],
    futureChanges: [
      "프로덕트 디자이너가 시니어 역할로 이동",
      "AI 도구 큐레이션 능력이 평가 기준",
      "1인 디자이너의 영향력 확대",
      "리서치·전략 디자인 수요 증가",
    ],
    recommendedSkills: [
      "사용자 리서치",
      "디자인 시스템",
      "AI 디자인 도구",
      "프로토타이핑·코딩 기초",
    ],
  },
  default: {
    automationRisk: 50,
    growthScore: 55,
    summary:
      "이 직업은 AI에 의해 일부 업무가 자동화되지만, 인간 고유의 판단과 관계 형성 역량으로 새롭게 정의될 것입니다.",
    automatedTasks: [
      "반복적인 데이터 입력 및 처리",
      "정형화된 보고서 작성",
      "1차 응대와 분류",
      "기본적인 분석과 요약",
    ],
    humanStrengths: [
      "복잡한 의사결정과 책임",
      "이해관계자 협상과 설득",
      "창의적 문제 해결",
      "윤리적 판단",
    ],
    futureChanges: [
      "AI 협업이 표준 워크플로",
      "전문성과 도메인 지식의 가치 상승",
      "직무 경계가 더 유연해짐",
      "지속적 학습이 필수",
    ],
    recommendedSkills: [
      "AI 도구 활용",
      "데이터 리터러시",
      "커뮤니케이션",
      "지속적 학습 능력",
    ],
  },
};

function classify(jobName: string): keyof typeof PROFILES {
  const j = jobName.toLowerCase();
  if (/세무|회계|tax|account|cpa|book/.test(j)) return "tax";
  if (/개발|프로그래|engineer|developer|programmer|software|코딩|coder/.test(j))
    return "dev";
  if (/간호|nurse|의사|doctor|의료|medical|nurs/.test(j)) return "nurse";
  if (/마케팅|marketing|브랜드|brand|광고|ad |advertis/.test(j))
    return "marketing";
  if (/디자인|design|ux|ui|아트/.test(j)) return "designer";
  return "default";
}

const COUNTRY_CONTEXT: Record<string, string[]> = {
  KR: [
    "정부 디지털 뉴딜로 AI 전환 인력 수요 급증",
    "수도권 외 지역 원격 근무 기회 확대",
    "한류 기반 글로벌 진출 가능성",
  ],
  US: [
    "실리콘밸리·뉴욕 중심 고임금 포지션 풍부",
    "스타트업 생태계 활성화로 1인 창업 기회",
    "원격 근무 시장 성숙",
  ],
  JP: [
    "고령화 대응 인력 수요 지속",
    "전통 산업 디지털 전환 가속",
    "외국인 전문직 비자 완화",
  ],
  DE: [
    "EU AI Act 대응 컨설팅 수요",
    "제조 4.0 인력 부족",
    "지속가능성·ESG 직무 확대",
  ],
  GB: [
    "핀테크·AI 허브로서 런던 중심 기회",
    "프리랜서·컨트랙터 시장 성숙",
    "EU 이탈 후 자체 인재 양성 정책",
  ],
  IN: [
    "글로벌 IT 아웃소싱 허브로 수요 폭증",
    "AI 엔지니어링 인재풀 세계 1위 규모",
    "원격 협업 기반 영어권 클라이언트 접근성",
  ],
  CN: [
    "AI·로봇 산업 정부 주도 투자",
    "내수 시장 기반 빠른 제품 사이클",
    "규제 환경 변화에 대한 적응력 필요",
  ],
  default: [
    "원격 근무 기반 글로벌 클라이언트 확보 가능",
    "현지 디지털 전환 컨설팅 수요",
    "다국적 기업의 현지 진출 지원 직무",
  ],
};

export function analyzeJob(
  jobName: string,
  countryCode: string,
  countryName: string,
): {
  automationRisk: number;
  growthScore: number;
  summary: string;
  automatedTasks: string[];
  humanStrengths: string[];
  futureChanges: string[];
  recommendedSkills: string[];
  countryOpportunities: string[];
} {
  const key = classify(jobName);
  const profile = PROFILES[key]!;
  const opportunities =
    COUNTRY_CONTEXT[countryCode] ?? COUNTRY_CONTEXT["default"]!;
  return {
    ...profile,
    countryOpportunities: opportunities.map((line) => `${countryName}: ${line}`),
  };
}
