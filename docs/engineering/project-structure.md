# 프로젝트 폴더 구조 가이드

> Last updated: 2026-02-06  
> 범위: `drizzle-setup` 전체 소스 구조, 레이어 경계, 리팩토링 규칙, 운영 체크리스트

## 1. 문서 목적

이 문서는 현재 코드베이스의 실제 폴더 구조를 기준으로 작성한 엔지니어링 기준 문서다.
목표는 파일 위치를 빠르게 찾는 것보다, 어떤 책임을 어디에 둘지 일관된 기준을 제공하는 것이다.
특히 최근 진행한 feature 중심 리팩토링의 의사결정 규칙을 보존하는 데 초점을 둔다.

이 문서는 다음 질문에 답한다.

1. `app`, `features`, `components`, `db`의 책임 경계는 무엇인가.
2. 서버 액션과 서버 쿼리는 어디에 두고 어떻게 작성해야 하는가.
3. 기존 `src/db/query` 코드는 어떤 원칙으로 이관하고 삭제하는가.
4. 페이지별 구현을 feature 단위로 어떻게 매핑하는가.
5. 아직 남아 있는 이관 작업은 무엇인가.

## 2. 핵심 설계 원칙

1. 라우팅과 레이아웃은 `src/app`에 둔다.
2. 도메인 비즈니스 로직은 `src/features/*`에 둔다.
3. 공용 UI primitive는 `src/components/ui`에 둔다.
4. 도메인 간 공통 표현 컴포넌트는 `src/components/*`에 둔다.
5. 페이지는 feature를 조합하는 얇은 진입점으로 유지한다.
6. 서버 쿼리와 서버 액션은 feature의 `server` 폴더에 둔다.
7. `actions.ts`는 파일 최상단 `"use server";` 1회만 허용한다.
8. `queries.ts`는 파일 최상단 `import "server-only";`를 사용한다.
9. 서버 액션/쿼리 함수는 화살표 함수로 작성한다.
10. 클라이언트 컴포넌트에서 `features/*/server/*` 직접 import를 금지한다.
11. 기존 `src/db/query` 구현은 feature 서버 레이어로 이동 후 제거한다.
12. `src/app/api/**`는 현재 단계에서 구조 변경을 보류한다.

## 3. 소스 루트 개요

현재 핵심 구조는 다음과 같다.

```text
src/
  app/
  components/
  db/
  features/
  hooks/
  lib/
  testing/
```

각 루트의 역할은 아래와 같다.

| 경로             | 역할                                                |
| ---------------- | --------------------------------------------------- |
| `src/app`        | Next.js 라우팅/레이아웃/페이지 엔트리/Route Handler |
| `src/components` | 공용 UI 및 도메인 중립 표현 컴포넌트                |
| `src/db`         | DB client/schema/seed/type 및 레거시 query          |
| `src/features`   | 도메인별 화면/상태/서버 로직                        |
| `src/hooks`      | 전역 재사용 훅                                      |
| `src/lib`        | 프레임워크 설정, 유틸, i18n, auth                   |
| `src/testing`    | 테스트 셋업과 런타임 모킹                           |

## 4. `src/app` 상세

`src/app`은 app router의 파일 시스템 라우팅을 담당한다.
도메인 로직은 최대한 얇게 유지하고 feature를 import해서 조립한다.

### 4.1 글로벌 레벨 파일

- `src/app/layout.tsx`
- `src/app/not-found.tsx`
- `src/app/globals.css`
- `src/app/favicon.ico`

### 4.2 로케일 레벨 파일

- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/providers.tsx`
- `src/app/[locale]/not-found.tsx`
- `src/app/[locale]/login/page.tsx`
- `src/app/[locale]/login/page.md`

### 4.3 앱 셸 컴포넌트

- `src/app/_components/site-header.tsx`
- `src/app/_components/sidebar.tsx`

앱 셸 컴포넌트는 cross-feature 조합만 수행한다.
세부 도메인 UI는 각 feature 폴더로 이관한다.

### 4.4 `(app)` 라우트 그룹

현재 주요 페이지 진입 파일은 다음과 같다.

- `src/app/[locale]/(app)/page.tsx`
- `src/app/[locale]/(app)/chat/page.tsx`
- `src/app/[locale]/(app)/chat/[chatId]/page.tsx`
- `src/app/[locale]/(app)/credits/page.tsx`
- `src/app/[locale]/(app)/credits/attendance/page.tsx`
- `src/app/[locale]/(app)/credits/history/page.tsx`
- `src/app/[locale]/(app)/developers/page.tsx`
- `src/app/[locale]/(app)/developers/apis/page.tsx`
- `src/app/[locale]/(app)/docs/page.tsx`
- `src/app/[locale]/(app)/docs/[docId]/page.tsx`
- `src/app/[locale]/(app)/presets/page.tsx`
- `src/app/[locale]/(app)/presets/purchased/page.tsx`
- `src/app/[locale]/(app)/presets/new/page.tsx`
- `src/app/[locale]/(app)/presets/new/[workflowId]/page.tsx`
- `src/app/[locale]/(app)/presets/[id]/page.tsx`
- `src/app/[locale]/(app)/presets/[id]/edit/page.tsx`
- `src/app/[locale]/(app)/profile/page.tsx`
- `src/app/[locale]/(app)/workflows/page.tsx`
- `src/app/[locale]/(app)/workflows/[id]/page.tsx`
- `src/app/[locale]/(app)/workflows/canvas/page.tsx`
- `src/app/[locale]/(app)/workflows/canvas/[id]/page.tsx`

### 4.5 `app/api` 경계

`src/app/api/**`는 백엔드 라우트 핸들러 레이어다.
현재 디렉터리:

- `src/app/api/auth`
- `src/app/api/chat`
- `src/app/api/credits`
- `src/app/api/presets`
- `src/app/api/v1`
- `src/app/api/workflows`

원칙:

1. API 라우트 구조 재편은 별도 작업으로 분리한다.
2. 본 리팩토링에서는 import 경로 정합성만 맞춘다.
3. API에서 도메인 로직이 필요하면 feature server 레이어를 참조한다.

## 5. `src/features` 상세

`features`는 도메인 소유권 단위다.
현재 feature 목록:

- `src/features/auth`
- `src/features/profile`
- `src/features/chats`
- `src/features/credits`
- `src/features/developers`
- `src/features/documents`
- `src/features/workflows`
- `src/features/canvas`
- `src/features/presets`

공통 템플릿:

```text
src/features/<feature>/
  components/
  server/
    actions.ts
    queries.ts
  (optional) hooks/
  (optional) store/
  (optional) utils/
  (optional) constants/
  (optional) api/
```

### 5.1 `auth`

역할:

1. 로그인/로그아웃 UI
2. 헤더 계정 메뉴 UI
3. 인증 관련 server action helper

주요 파일:

- `src/features/auth/components/google-login-form.tsx`
- `src/features/auth/components/sign-out-form.tsx`
- `src/features/auth/components/dropdown-logout-form.tsx`
- `src/features/auth/components/dev-login/dev-login-form.tsx`
- `src/features/auth/components/header-account-menu/header-account-menu.tsx`
- `src/features/auth/utils/auth-actions.tsx`

### 5.2 `profile`

역할:

1. 프로필 조회 쿼리
2. 프로필 수정 서버 액션
3. 이름 중복 검증 등 입력 UI

주요 파일:

- `src/features/profile/server/queries.ts`
- `src/features/profile/server/actions.ts`
- `src/features/profile/components/profile-form.tsx`
- `src/features/profile/components/profile-name-input.tsx`

### 5.3 `chats`

역할:

1. 채팅 페이지 셸과 사이드바
2. 채팅 패널 스트리밍 렌더링
3. 채팅 도메인 쿼리/액션/스토어

주요 하위 영역:

- `src/features/chats/components/chat-page/*`
- `src/features/chats/components/chat-panel/*`
- `src/features/chats/server/*`
- `src/features/chats/store/*`
- `src/features/chats/hooks/*`
- `src/features/chats/api/fetch-chats.ts`

### 5.4 `credits`

역할:

1. 크레딧 요약/내역 UI
2. 출석 보상 UI
3. 크레딧 관련 읽기/쓰기 서버 함수

주요 파일:

- `src/features/credits/server/queries.ts`
- `src/features/credits/server/actions.ts`
- `src/features/credits/components/attendance/attendance-client.tsx`
- `src/features/credits/components/history/history-filter.tsx`
- `src/features/credits/components/transaction-item.tsx`
- `src/features/credits/components/header-credits-button.tsx`

### 5.5 `developers`

역할:

1. 개발자 페이지 문서/가이드 렌더링
2. 서비스 키 관리 UI
3. 워크플로우 API 정보 표시

주요 파일:

- `src/features/developers/server/queries.ts`
- `src/features/developers/server/actions.ts`
- `src/features/developers/components/secret-keys-manager.tsx`
- `src/features/developers/components/apis/workflow-api-list.tsx`
- `src/features/developers/components/api-guide-markdown.tsx`

### 5.6 `documents`

역할:

1. 문서 목록/검색/정렬 UI
2. 문서 상세 편집/저장/삭제 UI
3. 문서 도메인 store와 서버 쿼리/액션

주요 파일:

- `src/features/documents/server/queries.ts`
- `src/features/documents/server/actions.ts`
- `src/features/documents/components/list/documents-search.tsx`
- `src/features/documents/components/list/documents-grid.tsx`
- `src/features/documents/components/detail/document-editor.tsx`
- `src/features/documents/store/document-store.tsx`

### 5.7 `workflows`

역할:

1. 워크플로우 목록/카드/데이터 뷰
2. 워크플로우 도메인 서버 쿼리/액션
3. 다른 feature에서 공유하는 워크플로우 데이터 소유

주요 파일:

- `src/features/workflows/server/queries.ts`
- `src/features/workflows/server/actions.ts`
- `src/features/workflows/components/workflow-list-view.tsx`
- `src/features/workflows/components/workflow-list-card.tsx`
- `src/features/workflows/components/workflow-data-view.tsx`

### 5.8 `canvas`

역할:

1. 워크플로우 캔버스 편집 UI
2. 노드 패널/사이드바/드래그앤드롭
3. 캔버스 상태 관리 및 유틸 계산

주요 하위 영역:

- `src/features/canvas/components/flow/*`
- `src/features/canvas/components/sidebar/*`
- `src/features/canvas/hooks/*`
- `src/features/canvas/store/*`
- `src/features/canvas/utils/*`
- `src/features/canvas/server/queries.ts`

주의:
`cavas-preview` 디렉터리처럼 오타 기반 경로가 남아 있으므로 후속 정리 후보로 관리한다.

### 5.9 `presets`

역할:

1. 프리셋 마켓/구매/생성/수정 흐름
2. 프리셋 상세 표시 및 예시 대화 미리보기
3. 프리셋 서버 쿼리/액션

주요 파일:

- `src/features/presets/server/queries.ts`
- `src/features/presets/server/actions.ts`
- `src/features/presets/components/preset-purchase-dialog.tsx`
- `src/features/presets/components/preset-create-form.tsx`
- `src/features/presets/components/preset-edit-form.tsx`
- `src/features/presets/components/form/*`
- `src/features/presets/constants/category-options.ts`

## 6. `src/components` 상세

`components`는 도메인 중립 영역이다.
비즈니스 로직 없이 표현 중심으로 유지한다.

현재 구조:

- `src/components/ui/*`
- `src/components/markdown/*`
- `src/components/landing/*`
- `src/components/errors/*`
- `src/components/workflow/workflow-summary-parts.tsx`
- `src/components/logo.tsx`
- `src/components/list-card.tsx`
- `src/components/page-template.tsx`

원칙:

1. feature 전용 상태/서버 호출이 생기면 `components`가 아니라 `features`로 이동한다.
2. chats/workflows처럼 두 feature 이상에서 재사용되는 표현 파츠는 `components`로 승격한다.
3. shadcn primitive는 `src/components/ui`를 source of truth로 사용한다.

## 7. `src/db` 상세

`db`는 데이터 모델과 연결 정보를 담는다.

핵심 파일:

- `src/db/client.ts`
- `src/db/schema/*.ts`
- `src/db/seed/*.ts`
- `src/db/types/*.ts`

현재 남은 레거시 query:

- `src/db/query/auth.ts`
- `src/db/query/ai-models.ts`
- `src/db/query/workflow-credits.ts`

목표:

1. 위 3개 파일의 구현을 feature server로 이관한다.
2. 참조가 0이 되면 파일을 삭제한다.
3. 최종적으로 `src/db/query` 디렉터리를 제거한다.

## 8. `src/lib`, `src/hooks`, `src/testing` 상세

### 8.1 `src/lib`

프레임워크 성격의 공통 모듈을 둔다.

- `src/lib/auth/*`
- `src/lib/i18n/*`
- `src/lib/react-query/index.ts`
- `src/lib/utils.ts`
- `src/lib/unique-name/index.ts`
- `src/lib/zustand/*`

### 8.2 `src/hooks`

전역 재사용 훅을 둔다.

- `src/hooks/use-debounce.ts`

### 8.3 `src/testing`

테스트 환경 초기화와 모킹 코드를 둔다.

- `src/testing/setup-tests.ts`
- `src/testing/mocks/server-only.ts`

## 9. 페이지 기준 feature 귀속 맵

| 라우트                            | 주 feature   | 보조 feature           |
| --------------------------------- | ------------ | ---------------------- |
| `/login`                          | `auth`       | `components`           |
| `/profile`                        | `profile`    | `auth`                 |
| `/docs`, `/docs/[docId]`          | `documents`  | `components/markdown`  |
| `/developers`, `/developers/apis` | `developers` | `workflows`            |
| `/credits/*`                      | `credits`    | `auth`                 |
| `/chat`, `/chat/[chatId]`         | `chats`      | `workflows`            |
| `/workflows`, `/workflows/[id]`   | `workflows`  | `presets`              |
| `/workflows/canvas/*`             | `canvas`     | `workflows`, `presets` |
| `/presets/*`                      | `presets`    | `workflows`, `canvas`  |

## 10. 서버 코드 작성 계약

### 10.1 파일 지시어

1. `actions.ts` 최상단에 `"use server";`를 선언한다.
2. `actions.ts` 안에 중복 `"use server"`를 두지 않는다.
3. `queries.ts` 최상단에 `import "server-only";`를 선언한다.
4. `queries.ts`에는 `"use server"`를 쓰지 않는다.

### 10.2 함수 스타일

1. 서버 액션과 서버 쿼리는 화살표 함수로 작성한다.
2. `function` 선언은 route handler, React component, custom hook에서만 허용한다.

### 10.3 import 경계

1. client component가 `features/*/server/*`를 직접 import하면 안 된다.
2. 서버 함수는 server component에서 import 후 prop으로 전달한다.
3. `server-only` 위반이 발생하면 모듈 경계를 먼저 점검한다.

## 11. 캐시 키/태그 운영 기준

권장 구조:

```text
src/features/<feature>/server/cache/
  key-factory.ts
  tags.ts
```

운영 규칙:

1. cache key는 tuple + `as const`로 관리한다.
2. key prefix는 feature명으로 고정한다.
3. tag 문자열은 팩토리 함수로 관리한다.
4. query/action이 동일 tag 팩토리를 공유한다.
5. action은 최소 범위로 `revalidateTag`한다.

## 12. 네이밍 규칙

1. feature명은 복수형 또는 도메인 단위로 일관되게 사용한다.
2. 페이지 전용 컴포넌트는 사용 맥락이 드러나는 이름을 쓴다.
3. chat 페이지의 workflow UI는 `ChatWorkflow*`처럼 접두를 명시한다.
4. 공용 UI는 `components/workflow/*` 같은 중립 네임스페이스를 사용한다.

## 13. 리팩토링 이관 규칙

1. 이동은 가능하면 히스토리를 남기는 방식으로 수행한다.
2. 함수 이관은 wrapper/re-export가 아니라 실제 구현 이동을 원칙으로 한다.
3. 이관 완료된 구현은 원본 위치에서 즉시 삭제한다.
4. 페이지 레이어에는 조립 코드만 남기고 도메인 로직을 남기지 않는다.

## 14. 현재 남은 작업

2026-02-06 기준으로 아래 작업이 남아 있다.

1. presets app 내부 잔여 보조 폴더 이관
2. `src/db/query` 잔여 파일 3개 이관 및 삭제
3. `/` 및 `/login`의 최종 경계 상태 점검
4. `page.md` 문서 내 구경로 표기 동기화

상세 잔여 경로:

- `src/app/[locale]/(app)/presets/_components/*`
- `src/app/[locale]/(app)/presets/[id]/_components/*`
- `src/app/[locale]/(app)/presets/new/[workflowId]/page.tsx` 인접 구현 점검
- `src/app/[locale]/(app)/presets/_utils/form-utils.ts`

## 15. 코드 리뷰 체크리스트

1. `app` 레이어가 feature 조립 역할만 수행하는가.
2. feature server 파일 지시어 규칙이 지켜지는가.
3. client에서 server 모듈 직접 import가 없는가.
4. 도메인 중복 UI가 공용 컴포넌트로 추출되었는가.
5. `db/query` 의존이 신규로 추가되지 않았는가.
6. import 경로가 도메인 중심으로 단순화되었는가.

## 16. 테스트 전략 요약

1. 단위 테스트는 feature 유틸/훅 중심으로 작성한다.
2. 통합 테스트는 API 노드/엔진 단위에서 수행한다.
3. E2E는 사용자 플로우를 기준으로 페이지 경계를 검증한다.
4. 리팩토링 시에는 구조 변경과 기능 회귀를 분리해 검증한다.

대표 경로:

- `e2e/chat/*`
- `e2e/credits/*`
- `e2e/developers/*`
- `e2e/docs/*`
- `e2e/presets/*`
- `e2e/workflows/*`

## 17. 신규 기능 추가 절차

1. 먼저 라우트 소유 feature를 결정한다.
2. `features/<domain>` 내부에 `components`와 `server`를 만든다.
3. 읽기 로직은 `queries.ts`, 쓰기 로직은 `actions.ts`로 분리한다.
4. 페이지에는 feature 컴포넌트 조립만 남긴다.
5. 공용화가 필요한 UI는 `src/components`로 승격한다.
6. 관련 테스트를 추가하고 경계 위반 여부를 점검한다.

## 18. 금지 패턴

1. client component에서 `server-only` 모듈 직접 import -> 경우에 따라 서버액션으로 우회. (인증이 필요한 경우 routes 핸들러로 작성)
2. `actions.ts` 내부 다중 `"use server"` 선언
3. 신규 기능에서 `src/db/query` 직접 의존
4. feature 소유 로직을 `app/*/page.tsx` 내부에 누적
5. 도메인 컴포넌트를 근거 없이 `src/components`에 추가
