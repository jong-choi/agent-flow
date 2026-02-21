# OpenAI 호환 API 가이드

워크플로우를 OpenAI 인터페이스로 호출할 수 있도록 아래 엔드포인트를 제공합니다.

- `POST /api/v1/openai/chat/completions`
- `POST /api/v1/openai/responses`

`GET /api/v1/openai/models`는 제공하지 않습니다.

## 빠른 시작

1. `/developers`에서 서비스 키를 발급합니다.
2. `/developers/apis`에서 워크플로우별 `X-FLOW-ID`를 발급합니다.
3. OpenAI 요청의 `model` 필드에 `X-FLOW-ID` 값을 넣어 호출합니다.

## 기본 규칙

- Base URL: `https://agentflow.jongchoi.com/api/v1/openai`
- 인증:
  - 권장: `Authorization: Bearer <SERVICE_KEY>`
  - 호환: `X-FLOW-SECRET: <SERVICE_KEY>`
- 워크플로우 식별: `model = X-FLOW-ID`
  - 예: `"model": "af-id-xxxxxxxxxxxxxxxx"`

## 지원 엔드포인트

## 1) Chat Completions

`POST /api/v1/openai/chat/completions`

### 최소 요청 본문

```json
{
  "model": "af-id-xxxxxxxxxxxxxxxx",
  "messages": [{ "role": "user", "content": "강아지 키우는 법을 알려줘" }]
}
```

### cURL 예시

```bash
curl -X POST "https://agentflow.jongchoi.com/api/v1/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer af-**********************" \
  -d '{
    "model": "af-id-*******************",
    "messages": [
      { "role": "user", "content": "강아지 키우는 법을 알려줘" }
    ]
  }'
```

### OpenAI SDK 예시 (JavaScript)

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "af-**********************",
  baseURL: `https://agentflow.jongchoi.com/api/v1/openai`,
});

const result = await client.chat.completions.create({
  model: "af-id-*******************",
  messages: [{ role: "user", content: "강아지 키우는 법을 알려줘" }],
});
```

## 2) Responses

`POST /api/v1/openai/responses`

### 최소 요청 본문

```json
{
  "model": "af-id-xxxxxxxxxxxxxxxx",
  "input": "강아지 키우는 법을 알려줘"
}
```

### cURL 예시

```bash
curl -X POST "https://agentflow.jongchoi.com/api/v1/openai/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer af-**********************" \
  -d '{
    "model": "af-id-*******************",
    "input": "강아지 키우는 법을 알려줘"
  }'
```

### OpenAI SDK 예시 (JavaScript)

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "af-**********************",
  baseURL: `https://agentflow.jongchoi.com/api/v1/openai`,
});

const result = await client.responses.create({
  model: "af-id-*******************",
  input: "강아지 키우는 법을 알려줘",
});
```

## 스트리밍 동작

- `stream: true` 지원
- 내부적으로 여러 Chat Node가 실행되더라도, 사용자 기준 스트림은 1개의 응답 흐름으로 내려갑니다.
- 스트림으로 받은 텍스트 전체를 합친 결과는 non-stream 응답 텍스트와 동일합니다.

## 미지원/무시되는 인자

현재 랭그래프 실행 제약으로 아래 인자는 받아도 적용하지 않습니다. 요청은 실패하지 않고 계속 처리됩니다.

- `max_tokens`
- `max_completion_tokens`
- `temperature`
- `top_p`
- `presence_penalty`
- `frequency_penalty`
- `n`
- `logit_bias`
- `stop`
- `tools`
- `tool_choice`
- `response_format`
- `reasoning`
- `metadata`

## 오류 응답 형식

OpenAI 스타일 에러 포맷을 사용합니다.

```json
{
  "error": {
    "message": "Invalid model (X-FLOW-ID).",
    "type": "invalid_request_error",
    "code": "invalid_model"
  }
}
```

## 운영 메모

- 서비스 키는 발급 시 1회만 노출됩니다.
- 키 유출 시 `/developers`에서 즉시 비활성화 후 재발급하세요.
