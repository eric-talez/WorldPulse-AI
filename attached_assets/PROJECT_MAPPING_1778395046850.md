# Report → Code Mapping

이 문서는 업로드한 리포트/제안서의 기능이 프로젝트 코드에서 어디에 구현되어 있는지 보여줍니다.

## 1. 글로벌 3D 지구 메인

구현 위치:

```text
frontend/src/components/WorldMap.tsx
frontend/src/components/LayerControls.tsx
frontend/src/components/CountryPanel.tsx
frontend/vite.config.ts
frontend/package.json
```

리포트의 “구글어스/윈디처럼 지도를 중심에 둔다”는 요구사항을 CesiumJS 기반 3D globe로 구현했습니다.

현재 UX:

- 3D 지구 렌더링
- 마우스 드래그로 지구 회전
- 휠로 zoom in/out
- 국가 마커 클릭
- 국가 선택 시 카메라 fly-to 이동
- 선택 국가의 이슈 마커와 이슈 카드 표시

## 2. 지도 레이어

구현 위치:

```text
frontend/src/data/categories.ts
frontend/src/components/LayerControls.tsx
backend/src/main/java/com/futuremapai/model/IssueCategory.java
backend/src/main/java/com/futuremapai/controller/IssueController.java
```

레이어:

- 뉴스
- 전쟁/분쟁
- 질병
- 정치
- 경제
- 문화
- AI 직업 변화

## 3. 국가별 현재 이슈 요약

구현 위치:

```text
backend/src/main/java/com/futuremapai/service/IssueService.java
frontend/src/components/CountryPanel.tsx
frontend/src/components/WorldMap.tsx
```

MVP에서는 mock issue data를 사용합니다. 실제 API 연결 시 GDELT/WHO/ACLED 데이터를 가져와 `CountryIssue` 모델로 변환하면 됩니다.

## 4. 직업 미래 리포트

구현 위치:

```text
backend/src/main/java/com/futuremapai/service/JobAnalysisService.java
backend/src/main/java/com/futuremapai/controller/JobReportController.java
frontend/src/components/JobReportForm.tsx
```

현재는 직업명 키워드 기반 heuristic 분석입니다. 실제 서비스에서는 OpenAI API를 붙여 국가 이슈 + 직업명 + 산업 데이터를 프롬프트로 넣으면 됩니다.

## 5. 국가/직업별 포럼

구현 위치:

```text
backend/src/main/java/com/futuremapai/service/ForumService.java
backend/src/main/java/com/futuremapai/controller/ForumController.java
frontend/src/components/ForumBoard.tsx
```

현재는 서버 메모리에 저장됩니다. 실제 서비스에서는 PostgreSQL의 `forum_posts` 테이블로 교체하면 됩니다.

## 6. 로그인

구현 위치:

```text
backend/src/main/java/com/futuremapai/controller/AuthController.java
frontend/src/components/LoginCard.tsx
```

현재는 mock login입니다. 실제 서비스에서는 user table, password hashing, JWT, Google OAuth를 추가하면 됩니다.

## 7. 데이터 수집 Worker / Scheduler

구현 위치:

```text
backend/src/main/java/com/futuremapai/service/DataIngestionScheduler.java
```

아직 실제 외부 API는 연결하지 않았고, 구조만 만들어두었습니다.

## 8. DB Schema 초안

구현 위치:

```text
backend/src/main/resources/schema.sql
```

제안서에 나온 `country_issues`, `job_future_reports` 구조를 기반으로 만들었습니다.
