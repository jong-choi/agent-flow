# 3단계 — Ollama/신규 Google 및 이력 호환성

2026-09-13. 브랜치 codex/model-management-stage-3. 운영 배포/운영 DB/정기 작업 변경 없음.

## 완료

- Google/Groq/Ollama factory를 provider registry로 분리하고 새 Google/Ollama native adapter 연결.
- 최신 Google 의존성의 Node >=22.12 요구에 맞춰 CI/Docker/.nvmrc/engines 갱신.
- 기존 공통 queue/취소/오류/SSE 경계를 유지. Ollama GPT OSS의 string think 수준을 실제 request에 매핑.
- model metadata의 추론 설정/title priority 관리와 UI 추론 표시 추가.
- 제목 생성의 은퇴 모델 하드코딩을 제거하고 현재 registry의 사용 가능한 title model 선택.
- 원본 AIMessage에 출처를 기록하고, 같은 모델의 서명/도구 데이터를 보존하며 다른 provider로는 답변 텍스트만 전달.
- 서버 전용 provider history column, JSON 저장/복원 및 이전 text-only history 호환.
- checkpoint 중복 이력 방지, 생성 완료 후 원본 이력/화면 답변 함께 저장. 원본 서명은 public query/HTML에서 제외.
- 비어 있거나 잘린 생성 결과를 정상 완료로 과금/저장하지 않도록 검증.

## 실호출 결과 (전부 순차)

- 신규 6개 모델: invoke + 이력 직렬화/재사용 + graph stream/SSE 텍스트 일치 검증 후 로컬 활성화.
- 실제 영속 채팅: 신규 6종 및 기존 Groq2종 각각 2턴. SSE=DB 답변, 원본 model_messages 보존, checkpoint messages는 첫 턴 2개/두 번째 턴 4개로 중복 없음.
- 실제 임시 채팅: 신규 6개 모두 응답/완료 이벤트 정상.
- 실제 제목 API 200 및 제목 문자열 확인.
- Node22에서 Google3종 minimal/high, Ollama GPT OSS2종 low/high 검증.
- Google3종 및 Ollama GPT OSS20B: tool call을 JSON 저장/복원한 후 결과를 재전송하는 왕복 검증.
- Google high-thinking 응답 → Groq 후속 호출 검증. Google 서명/추론은 다른 provider 입력에서 제외되고 원본 이력은 보존.

Google Gemma31B는 이번 앱/feature 검증에서 일시 실패가 있었지만, 후속 순차 재검증에서 앱 멀티턴·high·도구 왕복을 통과했다. 정상 동작이 확인되어 로컬 활성 상태지만 무장애를 보증하지 않는다. 장애 집계/cooldown은 4단계 범위다. 이전 조사 때 계속 실패하던 모델이라고 해서 영구 은퇴시키지 않았다.

## 자동 검증

- 단위/통합 테스트 133개, 타입 검사, ESLint 통과.
- registry DB migration/rollback 테스트 유지.
- provider history migration 반복/되돌리기/JSON 서명·tool-call 왕복 및 데이터 존재 시 rollback 거부 검증.
- 브라우저 E2E 5개: 로그인/랜딩/모델 카드/영속 stream 재열기. private signature가 HTML에 없는지 추가 확인.
- Node22 production build 통과.
- CI는 실제 모델 키나 생성 요청 없이 Node22에서 동일 단위/타입/린트/DB 검증을 수행한다.

## 로컬 근거

- .local/ai-captures/onboarding-1789231972666
- .local/ai-captures/stage3-app-* (실제 HTTP SSE/이력 확인)
- .local/ai-captures/features-* (Node22 추론/도구 요청과 raw)
- .local/ai-captures/stage3-temporary-1789233092676
- .local/ai-captures/cross-1789233225319

raw/키/쿠키는 Git과 Docker에서 제외. 신규 활성화는 로컬 DB에서만 했고 무료 자격을 확정하지 않아 entitlement는 unknown이다. 운영 적용 및 모델별 quota/cooldown/은퇴 자동화는 후속 단계에서 진행한다.
