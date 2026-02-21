# OpenAI-Compatible API Guide

You can call your workflow through an OpenAI-compatible interface via:

- `POST /api/v1/openai/chat/completions`
- `POST /api/v1/openai/responses`

`GET /api/v1/openai/models` is intentionally not provided.

## Quick Start

1. Create a service key in `/developers`.
2. Issue an `X-FLOW-ID` for a workflow in `/developers/apis`.
3. Put that `X-FLOW-ID` into the OpenAI request `model` field.

## Core Rules

- Base URL: `https://agentflow.jongchoi.com/api/v1/openai`
- Auth:
  - Recommended: `Authorization: Bearer <SERVICE_KEY>`
  - Compatibility: `X-FLOW-SECRET: <SERVICE_KEY>`
- Workflow identifier: `model = X-FLOW-ID`
  - Example: `"model": "af-id-xxxxxxxxxxxxxxxx"`

## Supported Endpoints

## 1) Chat Completions

`POST /api/v1/openai/chat/completions`

### Minimal request body

```json
{
  "model": "af-id-xxxxxxxxxxxxxxxx",
  "messages": [{ "role": "user", "content": "How do I take care of a puppy?" }]
}
```

### cURL example

```bash
curl -X POST "https://agentflow.jongchoi.com/api/v1/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer af-**********************" \
  -d '{
    "model": "af-id-*******************",
    "messages": [
      { "role": "user", "content": "How do I take care of a puppy?" }
    ]
  }'
```

### OpenAI SDK example (JavaScript)

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "af-**********************",
  baseURL: `https://agentflow.jongchoi.com/api/v1/openai`,
});

const result = await client.chat.completions.create({
  model: "af-id-*******************",
  messages: [{ role: "user", content: "How do I take care of a puppy?" }],
});
```

## 2) Responses

`POST /api/v1/openai/responses`

### Minimal request body

```json
{
  "model": "af-id-xxxxxxxxxxxxxxxx",
  "input": "How do I take care of a puppy?"
}
```

### cURL example

```bash
curl -X POST "https://agentflow.jongchoi.com/api/v1/openai/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer af-**********************" \
  -d '{
    "model": "af-id-*******************",
    "input": "How do I take care of a puppy?"
  }'
```

### OpenAI SDK example (JavaScript)

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "af-**********************",
  baseURL: `https://agentflow.jongchoi.com/api/v1/openai`,
});

const result = await client.responses.create({
  model: "af-id-*******************",
  input: "How do I take care of a puppy?",
});
```

## Streaming Behavior

- `stream: true` is supported.
- Internally, multiple chat nodes may run, but the client sees a single response stream.
- The concatenated stream output matches the non-stream final text.

## Unsupported but Ignored Parameters

Because of current LangGraph execution constraints, these parameters are accepted but not applied:

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

## Error Envelope

Errors follow an OpenAI-style envelope:

```json
{
  "error": {
    "message": "Invalid model (X-FLOW-ID).",
    "type": "invalid_request_error",
    "code": "invalid_model"
  }
}
```

## Security Notes

- Service keys are shown only once at issuance.
- If leaked, revoke and re-issue from `/developers` immediately.
