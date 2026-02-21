# Chat API 사용 가이드

`/api/v1/chat` 엔드포인트는 **내 워크플로우를 외부 서비스에서 실행**할 수 있도록 제공되는 REST API입니다.

## 빠른 시작

1. `/developers`에서 **서비스 키(X-FLOW-SECRET)** 를 발급하고 안전하게 보관합니다. (발급 시 1회만 노출)
2. `/developers/apis`에서 워크플로우별 **X-FLOW-ID** 를 발급합니다.
3. 아래 예시처럼 `/api/v1/chat`을 호출합니다.

## 기본 정보

- **엔드포인트**: `/api/v1/chat`
- **메서드**: `POST`
- **Content-Type**: `application/json`
- **인증 헤더**
  - `X-FLOW-SECRET`: 서비스 키 (예: `af-**********************`)
  - `X-FLOW-ID`: 워크플로우 ID (예: `af-id-*******************`)

## 요청 형식

```json
{
  "message": "사용자 메시지"
}
```

### 요청 파라미터

| 파라미터 | 타입   | 필수 | 설명                                |
| -------- | ------ | ---- | ----------------------------------- |
| message  | string | 필수 | 사용자가 전송하는 메시지 (1~4000자) |

## 응답 형식

### 성공 (200 OK)

```json
{
  "data": {
    "response": "AI 응답 문자열",
    "flowId": "af-id-...",
    "workflowId": "워크플로우 UUID"
  }
}
```

## 오류 응답

모든 에러는 아래 envelope 형식을 사용합니다.

```json
{
  "error": {
    "message": "Human-readable error message",
    "type": "invalid_request_error",
    "code": "invalid_body"
  }
}
```

자주 발생하는 케이스:

- `400 invalid_body`: `Invalid body.`
- `400 graph_not_found`: `Failed to build graph from workflow.`
- `401 auth_required`: `Authentication headers are required.` 또는 `Invalid secret key.`
- `403 forbidden`: `You do not have permission to access this workflow.`
- `404 workflow_not_found`: `Invalid flow ID.` 또는 `Workflow not found.`

## 사용 예시

아래 예시에서 `baseUrl`은 환경변수 `BASE_URL`(예: `http://localhost:3000`)을 의미합니다.

### cURL

```bash
curl -X POST "https://agentflow.jongchoi.com/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "X-FLOW-SECRET: af-**********************" \
  -H "X-FLOW-ID: af-id-*******************" \
  -d '{
    "message": "강아지 키우는 법을 검색해줘"
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
    message: "강아지 키우는 법을 검색해줘",
  }),
});
```

## 참고 사항

- 서비스 키(`X-FLOW-SECRET`)는 안전하게 보관하고 공개 저장소에 커밋하지 마세요.
- 키가 유출된 경우 즉시 비활성화하고 재발급 받으세요.
