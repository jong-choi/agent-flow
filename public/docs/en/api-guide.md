# Chat API Guide

The `/api/v1/chat` endpoint is a REST API that lets you **run your workflow from an external service**.

## Quick Start

1. Go to `/developers` and create a **service key (X-FLOW-SECRET)**. Keep it safe (shown only once).
2. Go to `/developers/apis` and issue a workflow **X-FLOW-ID**.
3. Call `/api/v1/chat` with the headers and JSON body below.

## Basics

- **Endpoint**: `/api/v1/chat`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Auth headers**
  - `X-FLOW-SECRET`: service key (e.g. `af-**********************`)
  - `X-FLOW-ID`: workflow id (e.g. `af-id-*******************`)

## Request

```json
{
  "message": "Your message"
}
```

### Parameters

| Field   | Type   | Required | Description                 |
| ------- | ------ | -------- | --------------------------- |
| message | string | Yes      | User message (1~4000 chars) |

## Response

### Success (200 OK)

```json
{
  "data": {
    "response": "AI response text",
    "flowId": "af-id-...",
    "workflowId": "workflow UUID"
  }
}
```

## Errors

All errors use this envelope:

```json
{
  "error": {
    "message": "Human-readable error message",
    "type": "invalid_request_error",
    "code": "invalid_body"
  }
}
```

Common cases:

- `400 invalid_body`: `Invalid body.`
- `400 graph_not_found`: `Failed to build graph from workflow.`
- `401 auth_required`: `Authentication headers are required.` or `Invalid secret key.`
- `403 forbidden`: `You do not have permission to access this workflow.`
- `404 workflow_not_found`: `Invalid flow ID.` or `Workflow not found.`

## Examples

In the snippets below, `baseUrl` refers to the `BASE_URL` env (e.g. `http://localhost:3000`).

### cURL

```bash
curl -X POST "https://agentflow.jongchoi.com/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "X-FLOW-SECRET: af-**********************" \
  -H "X-FLOW-ID: af-id-*******************" \
  -d '{
    "message": "Search how to raise a puppy"
  }'
```

### JavaScript (fetch)

```js
await fetch(`https://agentflow.jongchoi.com/api/v1/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-FLOW-SECRET": "af-**********************",
    "X-FLOW-ID": "af-id-*******************",
  },
  body: JSON.stringify({
    message: "Search how to raise a puppy",
  }),
});
```

## Notes

- Keep your service key (`X-FLOW-SECRET`) safe and never commit it to a public repository.
- If a key is leaked, revoke and re-issue it immediately.
