# AgentFlow

<!-- <p align="center">
  <img src="./public/docs/overview_placeholder.png" alt="AgentFlow Overview" width="400" />
</p> -->

LangChain과 LangGraph를 활용한 시각적 AI 에이전트 워크플로우 빌더 및 채팅 플랫폼입니다.

## 프로젝트 기간

- **프로젝트 시작일 : 2025.12.05 ~**
- **1차 배포 : 2026.02.12**
- **서비스 URL**: https://agentflow.jongchoi.com/

## 프로젝트 목표

플로우 차트를 통해 AI 에이전트 오케스트레이션을 시각적으로 설계하고, 채팅 UI로 활용합니다.
복잡한 LLM 로직을 노드 기반의 그래프로 시각화하여, 직관적인 편집과 실행, 그리고 공유가 가능합니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Shadcn/UI, Brutal Design System
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **Database**: PostgreSQL, Drizzle ORM
- **AI & Workflow**: LangChain, LangGraph
- **Visualization**: React Flow (@xyflow/react)
- **Authentication**: NextAuth.js (Auth.js) v5

## 주요 기능

### 워크플로우 관리 (Workflows)

> **URL**: `/workflows`

<!-- 스크린샷 필요: 워크플로우 목록 화면 -->
<!-- <p align="center">
  <img src="./public/docs/workflows_placeholder.png" alt="Workflow List" width="600" />
</p> -->

- **목록 조회**: 사용자가 생성하거나 보유한 워크플로우를 카드 형태로 확인합니다.
- **관리 기능**: 새로운 워크플로우를 생성하여 캔버스 에디터로 진입하거나, 기존 워크플로우를 수정합니다.

### 캔버스 에디터 (Canvas Editor)

> **URL**: `/workflows/canvas`

<!-- 스크린샷 필요: 캔버스 에디터 화면 (노드와 엣지 연결 모습) -->
<!-- <p align="center">
  <img src="./public/docs/canvas_placeholder.png" alt="Canvas Editor" width="800" />
</p> -->

- **시각적 설계**: React Flow를 활용한 **Drag & Drop** 인터페이스로 AI 에이전트의 로직을 설계합니다.
- **노드 시스템**: LLM 노드, 프롬프트 노드, 조건 분기 노드 등을 자유롭게 연결합니다.
- **실시간 테스트**: 작성 중인 워크플로우를 저장하고 즉시 임시 채팅을 통해 동작을 검증할 수 있습니다.
- **프리셋 로드**: 기존에 저장된 워크플로우나 프리셋을 캔버스로 불러와 재사용할 수 있습니다.

### 채팅 (Chat)

> **URL**: `/chat`

<!-- 스크린샷 필요: 채팅 화면 -->
<!-- <p align="center">
  <img src="./public/docs/chat_placeholder.png" alt="Chat Interface" width="600" />
</p> -->

- **에이전트 대화**: LangGraph 기반으로 실행되는 에이전트와 실시간 대화를 나눕니다.
- **세션 관리**: 최근 대화 목록을 관리하고, 새로운 워크플로우를 선택하여 채팅을 시작할 수 있습니다.
- **서버 액션**: 채팅 생성 및 메시지 전송은 Server Actions를 통해 안전하고 빠르게 처리됩니다.

### 프리셋 마켓 (Presets)

> **URL**: `/presets`

<!-- 스크린샷 필요: 프리셋 마켓 목록 -->
<!-- <p align="center">
  <img src="./public/docs/presets_placeholder.png" alt="Preset Market" width="600" />
</p> -->

- **템플릿 공유**: 다른 사용자가 공개한 고품질의 워크플로우 템플릿을 탐색합니다.
- **필터링 및 구매**: 카테고리, 가격, 정렬 필터를 사용하여 원하는 프리셋을 찾고, 크레딧을 사용하여 구매할 수 있습니다.
- **재사용**: 구매한 프리셋은 내 워크플로우로 가져와 커스터마이징이 가능합니다.

### 개발자 API (OpenAI 호환 API)

> **URL**: `/developers`, `/developers/apis`

- OpenAI 호환 엔드포인트를 제공하여 SDK나 오케스트레이션에서 외부 서비스로 호출이 가능하도록하였습니다.
  - `POST /api/v1/openai/chat/completions`
  - `POST /api/v1/openai/responses`

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AGENT_FLOW_SERVICE_KEY,
  baseURL: "https://agentflow.jongchoi.com/api/v1/openai",
});

const completion = await client.chat.completions.create({
  model: "af-id-1234567890",
  messages: [{ role: "user", content: "강아지 키우는 법에 대한 블로그 게시물 작성해줘" }],
});
```

## 시스템 아키텍처

### cacheComponents

- Next.js 16의 Cache Components 기능을 활용하여 성능을 최적화합니다.
- Cache Components를 통한 Partial Prerendering을 통해 페이지 간 최초 콘텐츠 로딩 속도를 최소화하고, updateTag를 통해 변경사항이 Partial Rendering으로 화면에 반영되도록 하였습니다.
- Drizzle ORM을 이용해 DB를 직접 조작하고, DB를 조회한 결과를 서버 응답 속도와 컴포넌트 로딩 속도를 최적화하였습니다.

### Lang Graph

- xyflow로 구현된 node와 edge 정보를 이용해 LangGraph에서 동적으로 Agent 앱을 생성합니다.
- Next.js의 Route Handlers를 이용해 OpenAI 호환 API를 구축하였습니다.
