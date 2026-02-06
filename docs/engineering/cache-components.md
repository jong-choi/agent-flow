# Cache Components 팀 컨벤션

## 1. Cache Components

Next.js 16에 정식 추가된 `cacheComponents` 설정 활성화로 바뀌는 캐싱 방식에 대한 설명

기존 페이지 단위의 캐싱과 달리, partial 렌더링 단위로 프리렌더되는 점, 캐시되지 않은 데이터에 suspense를 감싸야 하는 점 등 불편함이 있지만,

콜드 스타트 이후 성능상 이점이 있다.

## 2. 적용 전제

1. Next.js App Router를 사용한다.
2. `next.config.ts`에 `cacheComponents: true`를 활성화한다.
3. 캐시 API(`use cache`, `cacheTag`, `cacheLife`, `updateTag`, `revalidateTag`, `refresh`)는 공식 문서 기준으로 사용한다.

## 3. 용어 정의

1. Cached Scope: `'use cache'`가 선언된 함수/컴포넌트 범위
2. Runtime Scope: `cookies()`, `headers()`, `auth()` 등 요청 시점 데이터 접근 범위
3. Read-Your-Own-Writes: 사용자가 방금 변경한 데이터를 즉시 다시 조회할 때 최신성이 보장되어야 하는 요구사항
4. Broad Tag: 목록/요약 단위의 넓은 무효화 태그
5. Detail Tag: 단건/세부 엔티티 단위 태그

## 4. 아키텍처 원칙

1. 읽기와 쓰기를 파일 단위로 분리한다.
2. 런타임 식별(auth/header/cookie)과 캐시 가능한 DB 읽기를 분리한다.
3. 태그 네이밍은 feature prefix 기반으로 통일한다.
4. Server Action과 Route Handler는 무효화 API를 다르게 사용한다.
5. 캐시할 수 없는 읽기는 명시적으로 Suspense 경계 아래에 둔다.

## 5. 서버 파일 구조 컨벤션

권장 구조:

```text
src/features/<feature>/server/
  queries.ts
  actions.ts
  mutations.ts
  cache/
    tags.ts
    life.ts
```

규칙:

1. `queries.ts`는 `import "server-only";`로 시작하고 읽기 함수만 둔다.
2. `actions.ts`는 파일 최상단 `"use server";` 1회만 선언한다.
3. `mutations.ts`는 DB 쓰기 핵심 로직을 담고, Server Action과 Route Handler가 공유할 수 있게 유지한다.
4. 모든 서버 함수는 화살표 함수(`const fn = async () => {}`)로 작성한다.
5. Client Component에서 `features/*/server/*` 직접 import를 금지한다.

## 6. 데이터 유형별 의사결정 표

| 유형                          | 기본 전략                                        | 비고                     |
| ----------------------------- | ------------------------------------------------ | ------------------------ |
| 공유 읽기(카탈로그/설정/목록) | `'use cache'` + `cacheTag`                       | 필요 시 `cacheLife` 적용 |
| 사용자 범위 읽기              | 바깥 래퍼에서 user 식별 후 내부 cached 함수 호출 | 아래 7.2 패턴 사용       |
| 실시간/스트리밍 데이터        | 기본 uncached + Suspense                         | 채팅 메시지류            |
| 조회 중 부작용 발생 읽기      | 쿼리에서 제거, mutation/API 인증 단계로 이동     | read 함수 순수성 보장    |

## 7. 표준 코드 패턴

## 7.1 공유 읽기 캐시 패턴

```ts
import "server-only";
import { cacheTag, cacheLife } from "next/cache";

export const getCatalog = async () => {
  "use cache";
  cacheTag("catalog:all");
  cacheLife("hours");

  return fetchCatalogFromDB();
};
```

## 7.2 사용자 범위 읽기 패턴 (권장)

이 패턴은 팀의 기본 표준이다.

```ts
import "server-only";
import { cacheTag } from "next/cache";

export const getUserData = async () => {
  const userId = await getUserId(); // runtime scope
  return getUserDataCached(userId); // cached scope
};

const getUserDataCached = async (userId: string) => {
  "use cache";
  cacheTag(`user-data:${userId}`);
  return fetchUserDataFromDB(userId);
};
```

적용 규칙:

1. 바깥 함수에서만 `getUserId()`/`headers()`/`cookies()`를 읽는다.
2. 내부 cached 함수는 외부로 export하지 않는다.
3. 내부 cached 함수는 읽기 전용 로직만 포함한다.
4. 내부 cached 함수 인자에는 `userId`와 필터/페이지 등 캐시 분기를 만드는 입력을 명시한다.
5. 세션 토큰/JWT 원문은 캐시 키/태그로 사용하지 않는다.

## 7.3 Server Action 쓰기 + 즉시 반영 패턴

```ts
"use server";

import { updateTag } from "next/cache";

export const updateProfileAction = async (input: { displayName: string }) => {
  const userId = await getUserId();
  await updateProfileInDB(userId, input.displayName);

  // read-your-own-writes 보장
  updateTag(`profile:user:${userId}`);
};
```

## 7.4 Route Handler 쓰기 + 점진 반영 패턴

```ts
import { revalidateTag } from "next/cache";

export const POST = async () => {
  const { userId } = await parseRequest();
  await writeSomething(userId);

  // SWR 방식 권장
  revalidateTag(`documents:user:${userId}`, "max");
  return Response.json({ ok: true });
};
```

## 7.5 `refresh()` 사용 패턴

```ts
"use server";

import { refresh, updateTag } from "next/cache";

export const submitAction = async () => {
  const userId = await getUserId();
  await writeSomething(userId);
  updateTag(`something:user:${userId}`);
  refresh(); // 동일 페이지 서버 렌더 결과를 즉시 다시 받아야 할 때만
};
```

## 8. 태그 설계 컨벤션

기본 형태:

```text
<feature>:user:<userId>:<resource>[:<sub-resource>]
<feature>:<entityId>:<resource>
```

예시:

1. `documents:user:123:list`
2. `documents:user:123:doc:abc`
3. `workflows:user:123:list`
4. `workflows:xyz:graph`

규칙:

1. feature prefix를 반드시 포함한다.
2. broad 태그와 detail 태그를 함께 설계한다.
3. 태그 문자열 길이 제한(256)과 개수 제한(128)을 고려한다.
4. 태그 생성 함수는 `server/cache/tags.ts`에 모아 관리한다.

## 16. 공식 문서 참조

1. Cache Components 시작 가이드  
   https://nextjs.org/docs/app/getting-started/cache-components
2. `cacheComponents` 설정  
   https://nextjs.org/docs/app/api-reference/config/next-config-js/useCache
3. `use cache` 지시어  
   https://nextjs.org/docs/app/api-reference/directives/use-cache
4. `cacheTag`  
   https://nextjs.org/docs/app/api-reference/functions/cacheTag
5. `cacheLife`  
   https://nextjs.org/docs/app/api-reference/functions/cacheLife
6. `updateTag`  
   https://nextjs.org/docs/app/api-reference/functions/updateTag
7. `revalidateTag`  
   https://nextjs.org/docs/app/api-reference/functions/revalidateTag
8. `refresh`  
   https://nextjs.org/docs/app/api-reference/functions/refresh
9. `Uncached data was accessed outside of <Suspense>` 에러 가이드  
   https://nextjs.org/docs/messages/blocking-route
