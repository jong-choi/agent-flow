### `.vscode/next-js.code-snippets`

- **`tfc`**: 현재 파일명 기반의 기본 TSX 함수형 컴포넌트 템플릿을 생성
- **`tfcw`**: Next.js 15.5의 `PageProps` 타입을 사용하는 스니펫

#### 주의 : PageProps 사용법

- `npx next typegen` 명령어를 사용해야 `.next/types/routes.d.ts`에 올바른 타입이 지정됨. 그렇지 않으면 ts(2344) 오류가 발생함.
