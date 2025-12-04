# 프로젝트 폴더 구조

```
drizzle-setup/
├── e2e/
├── public/
├── src/
│   ├── app/
│   │   ├── api
│   │   │   ├── auth/
│   │   │   │   └── route.ts
│   │   ├── [slug]/
│   │   │   ├── _components/
│   │   │   └── page.tsx
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx
│   ├── db/
│   ├── features/
│   │   └── auth/
│   │       ├── components/
│   │       │   └── __tests__/
│   │       ├── hooks/
│   │       ├── stores/
│   │       └── types/
│   ├── lib/
│   │   ├── __tests__/
│   │   └── utils.ts
│   ├── server/
│   │   └── auth/
│   │       ├── auth.repository.ts
│   │       ├── auth.schema.ts
│   │       └── auth.service.ts
│   ├── testing/
│   │   ├── mocks/
│   │   └── setup-tests.ts
│   └── types/
│       └── api.ts
├── components.json
├── package.json
├── tsconfig.json
└── … (환경 설정 파일 전반)
```

### 폴더 규칙

#### 전역

각각의 폴더는 `__tests__` 폴더와 `types` 폴더를 가질 수 있다.

#### 프론트엔드

- `features` 폴더 아래에 기능별 모듈로 관리한다.
- `app` 폴더 아래에는 `file-system based routing`을 활용하되, 여러 features를 조합해야 하는 경우 `_components`로 컴포넌트를 선언하여 활용한다.

#### 백엔드

- `server`, `db` 폴더 아래에 기능별 모듈로 관리한다.
- `server` 폴더 아래에
  - repo : db에 접근하는 쿼리들을 관리한다.
  - schema : db의 모델링을 관리한다.
  - service : 비즈니스 로직을 관리한다.
- `app` 폴더 아래에 `route handlers`를 이용하여 controller를 작성한다.
