## auth.ts

`src/lib/auth/index.ts` 폴더에 auth-js의 기본 설정이 있다.

```tsx
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  session: {
    strategy: "jwt",
  },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn: signInCallback,
    jwt: jwtCallback,
  },
});
```

### callbacks

- `signIn`, `jwt`, `authorized`, `redirect`, `session` 프로퍼티를 가진다. 각각의 프로퍼티는 비동기 함수이다.
- 콜백을 사용할 때에는 `src/lib/auth/callbacks` 폴더에 별도로 선언하여 작성하고, 유닛 테스트를 진행한다.

### providers

- Provider 타입의 객체들의 배열이다.
- 각 제공자의 `authorization` 프로퍼티는 `OAuth 2.0 Authorization Endpoint Parameters` 와 같이 검색하여 사용할 수 있다.

### Google Refresh Token

- [Refresh Token Rotation - Auth.js Docs](https://authjs.dev/guides/refresh-token-rotation) 를 참고하여 Google 제공자를 기준으로 하는 Refresh Token 전략으로 구현되어 있음.
- `src/lib/auth/index.ts` 파일에서 `authorization.params.access_type`을 "offline"으로 하여 refresh_token 발급
- `src/lib/auth/callbacks/jwt.ts` 파일에서 access_token의 만료일을 확인한 후, Google 제공자 엔드포인트에 재발급 요청

### Testing 전략

auth를 모킹하지 않고 유닛 테스트 및 e2e 테스트 단위로 진행

- `src/lib/auth/callbacks/__tests__` 에 각 콜백 함수들의 유닛 테스트를 작성하기
- e2e 테스팅 시에는 `src/lib/auth/index.ts`에서 테스팅 환경에 credential을 추가하도록 하였음. `e2e/auth/basic-auth.spec.ts`를 참고하여 로그인 후 테스트 진행

## 사용자 인증 구현

### Server Action

- Server Actions를 활용 - `"use server"`로 선언된 `src/features/auth/utils/auth-actions.tsx` 파일에서 Server Actions 선언하여 사용하기 권장

### Session

- 서버 컴포넌트에서 `const session = await auth();` 를 통해 세션 정보를 확인하는 방식 권장

### middleware (proxy)

- Next.js 16 버전부터 `middleware`라는 용어가 `proxy`로 변경됨
- `src/proxy.ts` 파일 안에 콜백 함수를 `auth`로 감싸서 export할 것

```tsx
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 1. auth을 default로 re-export 하기
// export default auth(()=>{})

// 2. auth를 proxy라는 이름으로 named export하기
export const proxy = auth((req) => {
  // 미들웨어 로직이 들어가는 콜백함수
  return NextResponse.next();
});

// config라는 이름으로 미들웨어 설정을 넣어줄 수 있음.
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy 참고
export const config = {
  matcher: [],
};
```
