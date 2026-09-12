# 1단계 — 공통 AI 경계 및 스트리밍 리팩토링

2026-09-13. 작업 브랜치: codex/model-management-stage-1. 운영 반영 없음.

## 변경
- `src/lib/ai/message.ts`: string/block 답변 추출, thought 제외, 원본 메시지 변경 없이 reasoning/usage/finishReason 조회.
- `src/lib/ai/error.ts`: provider별 status/statusCode/status_code/response.status, retry/reset/RetryInfo 정규화. raw 요청/키를 클라이언트로 노출하지 않는다.
- `src/lib/ai/execution.ts`: PostgreSQL 전용 세션 advisory lock으로 프로세스 간 순차 호출. 모든 앱 모델 호출과 제목 생성에서 사용. fetch에 취소/timeout 전달, 응답 스트림 정리 후 잠금 해제. 내장 무제한 retry를 피하도록 현 provider maxRetries=0.
- chat-node/제목/SSE/영속 저장에서 동일 텍스트 추출 사용. 원본 AIMessage는 graph state에서 유지.
- temporary/persistent SSE 생성 중복을 공통 helper로 통합. 영속 저장/graph 완료 후 endNode 완료 이벤트 전송, 정상 스트림 close, 사용자 취소 전파.
- 실제 브라우저 테스트로 발견한 마지막 chunk 손실 수정: animation frame을 기다리는 버퍼를 완료 전에 동기적으로 flush.
- `.local`을 Git/Docker/TypeScript/ESLint에서 제외. live 진단은 명시적으로 실행하고 raw는 `.local/ai-captures`에만 기록.
- 검증용 GitHub Actions 추가: codex 작업 브랜치/PR에서 tests/typecheck/lint/로컬 PostgreSQL queue 테스트만 실행. API 키/실호출/배포 없음.

## 검증
- 기존 기준 98 tests → 변경 후 116 tests 통과(22 files).
- TypeScript `tsc --noEmit`, 프로젝트 전체 ESLint 통과.
- 실제 local PostgreSQL에서 여러 Node 프로세스의 동시 진입 시도가 순차 실행됨. 대기 중 취소, 실행 중 취소, 예외 후 다음 작업 진입 확인. 외부 AI를 병렬 호출하는 테스트가 아님.
- Chromium 기존 로그인/랜딩 E2E 3개 및 새 영속 채팅 스트림/재열기 E2E 1개 통과.
- 새 브라우저 계약 테스트는 합성 SSE + 로컬 DB를 사용하며 실제 provider를 호출하지 않는다.
- 실제 Groq GPT OSS20B/120B 영속 채팅 각 2턴: HTTP SSE 답변과 즉시 조회한 DB 저장값 일치, 재열기 HTTP 200, 정상 스트림 EOF 확인.
- 실제 Groq 2종 진단 invoke를 공통 queue/fetch로 실행하고 원본 body/응답·사용량 저장.
- 실제 temporary chat 2종 각 2턴도 순차 검증.
- 테스트 데이터는 로컬 Docker agentflow_dev DB만 사용. 영속 실호출 확인용 workflow/chat은 로컬에서 재열어 볼 수 있게 남겼으며, 합성 E2E fixture는 정리한다.

## 재실행

```sh
npm test -- --run
npx tsc --noEmit
npm run lint
npm run test:ai:queue
npx playwright test e2e/auth/login.spec.ts e2e/landing/home.spec.ts e2e/chat/stream-contract.spec.ts --project=chromium --workers=1 --reporter=line
RUN_AI_LIVE=1 npm run test:ai:live
```

`test:ai:queue`는 로컬 PostgreSQL이 필요하다. `test:ai:live`는 실제 Groq 사용량을 소비하며 local DB와 RUN_AI_LIVE=1을 요구한다. 모든 향후 모델/진단/worker 호출은 runAiCall과 aiFetch를 사용해야 한다. 과거의 독립 실험 스크립트는 공통 실행기를 적용하지 않았으므로 앱 실행과 함께 병행하지 않는다.

## 범위 및 다음 단계
- 현재 Google/Groq 라이브러리와 모델 목록 유지. 신규 provider/core 업그레이드는 3단계.
- 기존 제목 모델 gemma-3n-e2b-it은 조사한 최신 Google catalog에 없음. 1단계는 제목 응답의 block 처리 및 오류 보호를 테스트했고, 제목용 모델 정책 교체는 계획대로 3단계에서 진행한다. 실제 제목 생성 성공을 이번 검증 결과로 주장하지 않는다.
- PostgreSQL lock은 동일한 DB의 직접 연결/세션 유지 연결이 전제다. transaction pooling endpoint를 사용하면 안 된다. 프로세스 중단 시 DB 세션 종료로 잠금이 해제되며, 연결 상실 감지 시 provider 요청을 취소한다.
- 기본 120초 제한은 대기+실행 시간 합계다. 지원하지 않는 transport가 취소를 무시하는 경우에는 기존 작업이 끝날 때까지 잠금을 유지한다.
- 이번 단계는 스키마 migration/모델 은퇴/가격 정책/운영 worker를 적용하지 않는다. 현재 영속 대화의 role/content-only 이력은 도구 서명 영속화까지 지원하지 않으며 3단계 연결 시 보완한다.
