# Google/Gemma/Ollama 호환성 실험 결과

2026-09-13 KST. 모든 AI 요청은 전역 순차 실행. 운영 서버/DB/모델 설정 변경 없음.

## 결론

- Google Gemini/Gemma: 새 `@langchain/google`의 `ChatGoogle`로 native Gemini API 사용 + 앱 경계 정규화 권장.
- Ollama Cloud: `@langchain/ollama`의 `ChatOllama`로 native `/api/chat` 사용 권장. OpenAI-compatible + ChatOpenAI도 일반 텍스트는 동작하지만 추론 메타데이터 보존에서 불리하다.
- Groq: 현재 ChatGroq 및 raw 기준 유지. 제공사마다 동일 HTTP 프로토콜을 강제할 필요가 없다. LangChain 메시지/앱 SSE 계약을 맞추면 된다.
- Google `gemma-4-31b-it`는 이번 실험에서 5회의 HTTP 500. native/openai, 구/신 라이브러리 및 직접 REST minimal에서도 실패. 목록에는 있으나 호출 가능은 미확인. 원인을 확정하거나 은퇴로 처리하지 않는다.
- 본 앱의 provider factory는 아직 교체하지 않았다. 실험 후보/정규화 코드는 Git 제외된 `.local/provider-lab`에 있다.

## 버전과 실행 범위

실험 패키지: core 1.2.11, google 0.2.6, ollama 1.3.0, openai 1.5.13, google-gauth 2.1.7, google-common 2.1.7, langgraph 1.0.15.
구 google-common은 하위 core 1.1.12를 사용한다. 실험 lockfile에 전체 resolved 버전을 기록한다.
실제 앱 확인: 기존 core 1.1.12/google-gauth 2.1.7/google-common 2.1.7 및 원래 Next.js temporary chat route.

최신 ChatOllama 1.3.0은 기존 앱 core 1.1.12에서 import 실패(`language_models/compat` 미제공). 실험 core 1.2.11에서는 정상이다. 앞서 성급히 본 앱에 추가했던 미호환 Ollama 의존성은 제거했고 기존 package.json/lockfile을 유지했다. 채택 시 core 및 adapter 버전을 함께 고정하고 전체 앱 회귀 검증이 필요하다.

## 실제 실행

- Google 모델 3개 × google-old/google-new/google-openai, Ollama 모델 3개 × native/openai.
- 비교 모델: gemini-3.5-flash-lite, gemma-4-26b-a4b-it, gemma-4-31b-it; gpt-oss:20b, gpt-oss:120b, gemma4:31b.
- raw HTTP 82건: 200=73, 500=5, 400=1, 의도적인 invalid model 404=3.
- 별도로 기존 앱 HTTP SSE 4회: Gemini/Gemma26 각각 2턴. 모두 오류 없이 답변/종료 이벤트 수신. 로컬 실험 모델 레코드는 검증 후 제거했다.
- 정상 응답 46건에서 upstream raw 최종 답변과 정규화한 모델 결과가 정확히 일치.
- 실제 캡처한 LangGraph 스트림 34건을 현재 앱 mapper/schema로 재생. UTF-8를 1/2/3/7/13/64바이트로 분할해 전달해도 답변 일치.
- 기본 호출/멀티턴/연속 HumanMessage 형태의 상위 노드 출력/추론 설정/시스템 지시/실제 AIMessage 재사용/도구 왕복/구조화 출력/invalid model 오류를 확인.
- 합성 입력만 사용. 기본 maxOutputTokens 또는 maxTokens/numPredict=1024. 추론 high에서도 짧은 과제를 사용. 생산성·품질·성능 벤치마크가 아니다.

## 호환성 결과

| 경로 | 텍스트 invoke/stream/멀티턴 | 추론/사용량 | 도구 왕복 | 권고 |
| --- | --- | --- | --- | --- |
| 기존 Google ChatGoogle | Gemini/Gemma26 통과 | Gemma 스트리밍 usage에서 reasoning 누락 관찰 | 이번 앱 경로는 일반 채팅만 | 기존 호출 자체가 폐기된 것은 아님 |
| 새 Google ChatGoogle | Gemini/Gemma26 통과 | native thoughts, signatures, reasoning token count 보존; 출력 정규화 필요 | Gemini/Gemma26 통과 | Google 우선 |
| Google ChatOpenAI | Gemini/Gemma26 일반 채팅 통과 | 비표준 추론 필드 누락; Gemma 도구 후 답변에 thought 태그 혼입 | Gemini는 signature 손실로 400 | 주 경로로 비추천 |
| Ollama ChatOllama | 3개 모델 통과 | reasoning_content, done_reason, eval_count 보존 | GPT OSS20B 통과 | Ollama 우선 |
| Ollama ChatOpenAI | 3개 모델 통과 | 답변·usage는 전달, 추론 텍스트는 adapter 결과에서 누락 | GPT OSS20B 통과 | 일반 텍스트 대안 |

'통과'는 이 문서에 명시한 모델/입력/버전 범위다. 목록 전체/모든 기능의 지원을 뜻하지 않는다.

## raw에서 발견한 구체적인 문제

### 1. 새 ChatGoogle: 화면 답변과 다음 노드 입력이 달라지는 위험

Gemma 및 추론 high Gemini 응답은 다음 형태를 포함한다.

```json
[
  {"type":"text","thought":true,"text":"...reasoning..."},
  {"type":"text","text":"...answer..."}
]
```

현재 chat-node는 배열에서 `type === "text"`만 필터한다. 따라서 thought=true 블록도 outputMap에 붙는다. SSE mapper는 문자열 chunk만 보내므로 화면은 최종 답만 보이는데 다음 노드에는 추론까지 들어갈 수 있다. 새 Google의 Gemma 기본/상위노드/멀티턴 및 high reasoning 테스트에서 기존 추출 로직의 불일치를 재현했다.

실험 정규화: 문자열이면 유지, 배열이면 type=text이면서 thought/is_thought가 true가 아닌 블록만 연결. type=reasoning/tool/image는 답변 텍스트에 포함하지 않는다. 원래 AIMessage는 변경하지 않는다.

### 2. Google OpenAI-compatible: thought_signature 손실

Gemini 도구 호출 raw에는 서명이 있다. ChatOpenAI로 변환한 tool_calls를 다음 요청에 넣으면 서명이 빠진다. 실제 Google 응답:

```text
400 INVALID_ARGUMENT: Function call is missing a thought_signature ...
```

새 native ChatGoogle은 실제 AIMessage를 다시 사용한 도구 왕복을 통과했다. Google 호환 endpoint 자체가 도구를 지원하지 않는다는 뜻이 아니라 시험한 ChatOpenAI adapter가 이 확장 정보를 보존하지 못한 것이다. OpenAI SDK 직접 호출 시 원래 extra_content/signature를 보존하는 별도 구현은 가능하지만 추가 유지보수가 필요하다.

Gemma OpenAI-compatible 도구 왕복에서는 `<thought>...</thought>`가 content 문자열에 섞이는 사례도 캡처했다. 일반 문자열을 정규식으로 일괄 삭제하지 않고 native 구조화된 thought 필드를 사용하는 편이 명확하다.

### 3. Google 추론 토큰 집계 차이

Gemma26 멀티턴 한 캡처에서 native raw는 prompt=55, answer=24, thoughts=390, total=469였다. 기존 google-gauth 스트리밍 usage_metadata는 input=55/output=24/total=469로 reasoning을 별도 보존하지 않았다.
새 ChatGoogle은 다른 동일 유형 호출에서 input=55/output=454(답25+추론429)/total=509, output_token_details.reasoning=429로 보존했다.
Google OpenAI raw 자체에서도 completion_tokens에 답변 토큰만 있고 total_tokens에는 추론이 포함되는 사례가 있었다. 단순히 input+output=total로 가정하거나 누락된 추론을 0으로 간주하면 안 된다.

### 4. Ollama 추론 보존

native raw의 message.thinking을 ChatOllama는 additional_kwargs.reasoning_content에 저장한다. 시험한 ChatOpenAI 결과/청크에서는 upstream의 reasoning 필드가 보존되지 않았다. 두 경로 모두 최종 content는 기존 SSE와 맞았다. Ollama의 별도 reasoning token count는 캡처에서 확인되지 않았으므로 null/미지원으로 다뤄야 한다.

### 5. 추론 옵션: 실제 요청 확인이 필수

처음 `thinkingConfig` 중첩 객체를 새 ChatGoogle 생성자에 넣은 실험은 그 설정이 HTTP 요청에서 빠졌다. 이 결과를 high/minimal 제어 성공으로 세지 않는다. 설치된 타입에 필드가 있어도 변환 경로가 보존하는지 확인해야 한다.
수정한 `thinkingLevel: "minimal" | "high"`는 실제 HTTP generationConfig.thinkingConfig에 전달됐다.
- Gemini minimal: reasoning tokens 0, 답변 정상.
- Gemma26 minimal: reasoning tokens 0, 답변 정상.
- Gemini high: reasoning tokens 563, 최종 답/스트림 정규화 일치.
- Gemma26 high: reasoning tokens 591, 최종 답/스트림 정규화 일치.
단일 과제 검증이며 모든 추론 수준을 동일 지원한다고 보장하지 않는다.

### 6. 구조화 출력

새 Google Gemini/Gemma26은 JSON schema와 minutes=20 결과 검증 통과.
Ollama Cloud GPT OSS20B: native는 HTTP 200이지만 parsed=null, OpenAI 경로는 invalid structured output JSON 파싱 오류. Cloud 미지원 공식 안내와 부합한다. HTTP 200을 기능 검증 통과로 간주하지 않는다.

### 7. 오류 객체 형식도 서로 다름

- 새 Google: statusCode, data, headers.
- 구 Google: response.status 및 문자열 메시지.
- ChatOllama: status_code, error.
- ChatOpenAI: status, error, code, headers.

실제 invalid model 404를 3개 adapter에서 캡처했다. 현재 앱의 generic error mapper 앞에 제공사 오류 정규화가 필요하다. 429/401/timeout 상태 전이는 이번 실험에서 실제 한도를 소진시키거나 키를 교체하며 유발하지 않았다. 정규화에 대해서만 합성 케이스를 확인했다.

## 적용 구조

```text
provider-specific LangChain model
  -> 원본 AIMessage / AIMessageChunk (서버에서 보존)
  -> 공통 결과 정규화
     - answerText
     - reasoning (별도, UI 출력과 분리)
     - usage (출처 필드 의미 보존, 미제공은 null)
     - finishReason / provider error
  -> 현재 ClientStreamEvent + chunk.content 문자열
```

적용할 지점은 하나의 텍스트 추출 함수를 공유해야 한다.
1. chat-node 최종 outputMap.
2. mapLanggraphEventToClientEvent의 스트리밍 chunk.
3. persistent chat route의 streamingChunkMap/DB 저장.
4. 제목 생성 route의 응답 처리.

멀티턴에서 AIMessage를 새 문자열 메시지로 덮어쓰지 않는다. 서명/도구 메타데이터가 필요할 때는 원래 메시지를 server-side graph state/checkpointer에 유지한다. 현재 persistent chat의 role/content-only 재구성은 향후 도구 히스토리 지원에 충분하지 않다.

클라이언트는 기존 `{type,event,langgraph_node,chunk:{content}}` 계약을 유지할 수 있다. 추론 표시나 토큰 사용량 UI는 필요할 때 별도 필드를 설계하며, 이번 정규화에서는 추론을 답변 문자열에 섞지 않는다.

추론 high에서 토큰 상한으로 잘렸거나 stream이 중단되면 정상 완료와 구분해야 한다. 실제 생산 환경의 취소 전파/청구/장기 응답/429 복구/모든 도구 및 이미지 입력은 별도 통합 검증 범위다.

## 재현 파일 (모두 Git/Docker 제외)

- `.local/provider-lab/package.json`, `package-lock.json`: 실험 의존성.
- `run.mjs`: invoke/stream/상위 노드/추론 matrix, HTTP body/응답 캡처.
- `extra.mjs`: 실제 메시지 재사용, 도구 왕복, Gemma31 minimal REST, invalid model.
- `edge-cases.mjs`: Google OpenAI 도구 signature, JSON schema, 초기 추론 설정 실험.
- `thinking.mjs`: 올바른 thinkingLevel 전송 및 동작 재확인.
- `compat.mjs`: 정규화 프로토타입.
- `verify-raw.mjs`, `replay.mjs`: 추가 AI 호출 없이 raw 대조 및 SSE 재생.
- `.local/ai-captures/provider-comparison/`: 요청, 상태/응답 헤더, 원본 body, 메시지/이벤트/사용량, 비교 결과.
- `.local/ai-captures/google-existing-app-1789226890316/`: 현재 앱 HTTP SSE 원본 4건.
- `.local/ai-captures/capture-google-existing.mjs`: 현재 앱 재현용 진단.

실행: 저장소 루트에서 `LAB_STAGE=smoke|stream|advanced node --import tsx .local/provider-lab/run.mjs`. 이는 실제 요청을 순차 전송하며 사용량을 소비한다. `extra/edge-cases/thinking` 실행 시 `LAB_STAGE=none` 사용. replay와 verify-raw는 네트워크 호출 없음.

## 공식 근거

- LangChain Google 권장 패키지: https://docs.langchain.com/oss/javascript/integrations/chat/google
- Google OpenAI-compatible API와 native 권장 안내: https://ai.google.dev/gemini-api/docs/openai
- Google thought signatures: https://ai.google.dev/gemini-api/docs/thinking
- Gemma Gemini API 및 추론 on/off: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- Ollama Cloud API: https://docs.ollama.com/cloud
- Ollama OpenAI-compatible: https://docs.ollama.com/api/openai-compatibility
- Ollama Cloud structured output 미지원: https://docs.ollama.com/capabilities/structured-outputs
- LangChain Ollama: https://docs.langchain.com/oss/javascript/integrations/chat/ollama
