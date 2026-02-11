# Chat API Guide

The `/api/v1/chat` endpoint is a REST API that lets you **run your workflow from an external service**.

## Quick Start

1. Go to `/developers` and create a **service key (X-CANVAS-SECRET)**. Keep it safe (shown only once).
2. Go to `/developers/apis` and issue a workflow **X-CANVAS-ID**.
3. Call `/api/v1/chat` with the headers and JSON body below.

## Basics

- **Endpoint**: `/api/v1/chat`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Auth headers**
  - `X-CANVAS-SECRET`: service key (e.g. `af-**********************`)
  - `X-CANVAS-ID`: workflow id (e.g. `af-id-*******************`)

## Request

```json
{
  "message": "Your message"
}
```

### Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| message | string | Yes | User message (1~4000 chars) |

## Response

### Success (200 OK)

```json
{
  "data": {
    "response": "AI response text",
    "canvasId": "af-id-...",
    "workflowId": "workflow UUID"
  }
}
```

## Errors

### 400 Bad Request

```json
{
  "message": "Invalid body",
  "issues": []
}
```

### 401 Unauthorized

```json
{
  "error": "유효하지 않은 시크릿 키입니다."
}
```

### 403 Forbidden

```json
{
  "error": "워크플로우에 대한 접근 권한이 없습니다."
}
```

### 404 Not Found

```json
{
  "error": "유효하지 않은 Canvas ID입니다."
}
```

## Examples

In the snippets below, `baseUrl` refers to the `BASE_URL` env (e.g. `http://localhost:3000`).

### cURL

```bash
curl -X POST "${baseUrl}/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "X-CANVAS-SECRET: af-**********************" \
  -H "X-CANVAS-ID: af-id-*******************" \
  -d '{
    "message": "Search how to raise a puppy"
  }'
```

### JavaScript (fetch)

```js
await fetch(`${baseUrl}/api/v1/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CANVAS-SECRET": "af-**********************",
    "X-CANVAS-ID": "af-id-*******************"
  },
  body: JSON.stringify({
    message: "Search how to raise a puppy"
  })
});
```

## Notes

- Keep your service key (`X-CANVAS-SECRET`) safe and never commit it to a public repository.
- If a key is leaked, revoke and re-issue it immediately.
