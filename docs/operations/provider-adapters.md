# Provider adapters — 3단계

## 런타임 및 패키지

- Node >=22.12.0. .nvmrc/CI/production Docker는 Node 22 기준.
- @langchain/core 1.2.11, @langchain/google 0.2.6, @langchain/ollama 1.3.0 고정.
- @langchain/groq 및 LangGraph는 기존 API를 유지한다. google-gauth는 제거했다.
- Google은 ChatGoogle + Gemini native API, Ollama는 ChatOllama + https://ollama.com native API다. OpenAI-compatible로 프로토콜을 통일하지 않는다.

Google custom apiClient와 Groq/Ollama fetch 모두 runAiCall/aiFetch를 경유한다. 직접 invoke/stream을 사용할 때도 runAiCall 안에서 소비해야 하며, worker/diagnostic/app의 실제 AI 호출은 같은 DB 잠금으로 순차화된다.

## 로컬 적용

2단계 registry migration이 적용된 DB에서:

```sh
npm run models -- history-migrate up
RUN_AI_LIVE=1 npm run models:onboard -- --activate
```

onboard는 공식 catalog를 확인하고 아래 6개 모델을 후보로 등록한 뒤, 순차 invoke/이력 재사용/스트리밍 검증을 수행한다. --activate가 있을 때 검증된 candidate만 공개한다. 기존 active 모델의 수동 숨김이나 retired 상태를 되돌리지 않는다. 실패는 결과 파일에서 pending으로 기록하고 신규 모델은 비공개 candidate로 남긴다. 완료 exit code만으로 모든 모델이 통과했다고 판단하지 말고 results.json의 개별 status를 확인한다.

- google/gemini-3.5-flash-lite
- google/gemma-4-26b-a4b-it
- google/gemma-4-31b-it
- ollama/gpt-oss:20b
- ollama/gpt-oss:120b
- ollama/gemma4:31b

호출 성공은 해당 키로 접근 가능하다는 뜻이며 무료 플랜 자격을 보증하지 않는다. entitlement=unknown은 그대로 유지한다. 무료 자격 판정/주기 sync는 4단계다. 쓰기/활성화 명령은 이 단계에서 로컬 DB로 제한된다.

## 생성 설정

운영 metadata는 부분 병합한다. 기존 maxOutputTokens/titlePriority를 보존하면서 바꿀 수 있다.

```json
{"metadata":{"thinkingLevel":"high"}}
```

- Gemini 3.5 Flash-Lite: default/minimal/low/medium/high.
- Google Gemma4 26B/31B: default/minimal/high. minimal=추론 끄기, high=켜기.
- Ollama GPT OSS: default/low/medium/high. boolean은 효과가 없으므로 adapter transport가 정확한 string think 값을 넣는다.
- 그 외 모델은 검증된 별도 정책이 추가되기 전 default만 허용한다.
- 잘못된 설정은 관리 단계 및 factory에서 거절하며 upstream으로 보내지 않는다.
- 새 모델의 기본 앱 출력 상한은 4096, 입력은 기존 8000(o200k 추정 제한)이다. provider 최대치를 실제 서비스 제공치로 혼동하지 않는다.
- reasoning-only/length/MAX_TOKENS/일부 차단 종료는 완전한 답변으로 취급하지 않으며 chatNode 성공 과금/영속 저장을 하지 않는다.
- Ollama Cloud structured output은 활성 기능으로 광고하지 않는다.

## 제목 선택

metadata.titlePriority가 설정된 사용 가능 모델을 우선순위/ID 순서로 선택한다. 초기 후보는 Gemini 3.5 Flash-Lite(10), Ollama GPT OSS20B(30), 기존 Groq GPT OSS20B(100)다. unavailable/retired/숨김 모델은 선택하지 않는다.

제목은 별도 512 출력 상한과 지원되는 최소 추론 수준을 사용하며, 워크플로우 모델 설정을 변경하지 않는다. 사용할 수 있는 설정된 모델이 없으면 명확한 오류를 반환하고 임의 모델로 호출하지 않는다. 기존 gemma-3n-e2b-it 하드코딩은 제거했다.

## 서명/이력

chat_messages.model_messages에는 server-only StoredMessage[]를 저장한다. public 메시지 조회/Client Component에는 기존 content만 전달한다. Google thought signatures/tool calls/usage를 JSON 왕복으로 보존한다.

같은 provider/upstream model에 다시 요청할 때는 원본 메시지를 재사용한다. 다른 모델/제공사로 보낼 때는 answer-only AIMessage로 변환하여 추론과 서명을 섞어 보내지 않는다. 표시 문자열을 regex로 잘라 원본을 파괴하지 않는다.

영속 채팅은 서버 이력으로 입력을 재구성하고 checkpoint의 messages를 reset한 뒤 실행한다. 기존 checkpoint 위에 DB의 전체 이력을 다시 append하여 대화가 중복되는 문제를 방지한다. 일반 텍스트만 있던 이전 이력도 읽을 수 있다.

history migration down은 아직 provider 이력이 없는 경우에만 허용한다. 저장된 이력이 있으면 정보 손실 방지를 위해 거부한다. 운영에서는 code/schema 순서를 검증한 후 적용해야 하며, 이 단계에서는 실제 운영 변경을 하지 않는다.

## 검증 명령

```sh
npm test -- --run
npm run test:ai:history
npm run test:models:registry
npm run test:ai:queue
RUN_AI_LIVE=1 npm run test:ai:features
```

features는 등록된 모델의 추론 설정과 JSON 직렬화 후 도구 왕복을 순차 검증한다. AI_FEATURE_MODELS에 쉼표로 구분한 upstream ID를 주면 해당 모델만 재검증한다. 실제 사용량을 소비하며 CI에서는 실행하지 않는다. 원본 body/설정/응답은 .local에만 기록한다.

## 공식 근거

- https://docs.langchain.com/oss/javascript/integrations/chat/google
- https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- https://docs.ollama.com/cloud
- https://docs.ollama.com/capabilities/thinking
- https://docs.ollama.com/capabilities/structured-outputs
