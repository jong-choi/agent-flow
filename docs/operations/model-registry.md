# 모델 레지스트리 운영 — 2단계

이 단계의 쓰기 명령은 `.env`의 DATABASE_URL이 127.0.0.1일 때만 허용한다. 운영 적용/자동 동기화/신규 provider 활성화는 아직 하지 않는다.

## 데이터 소유권

- `id`: 영구 UUID. 새 노드 선택값.
- `modelId` (`model_id`): 기존 ID 호환 alias. 변경/재사용 금지. 신규 수집 레코드는 registry:<UUID> alias를 발급한다.
- `(provider, upstreamModelId)`: 제공사 API 모델의 유일 키. 실제 요청에는 upstreamModelId를 전송한다.
- 수집 전용: contextWindow, catalogMetadata, catalogCheckedAt. 부분 metadata 갱신은 기존 알려진 값을 보존한다.
- 운영 전용: name, description, price, order, isActive, appMaxInputTokens, appMaxOutputTokens. seed/catalog는 이 필드를 덮어쓰지 않는다.
- lifecycle/entitlement/health는 서로 별개다. 자동 상태 관리 및 승격은 4단계에서 추가한다. isActive는 운영자의 공개 스위치이며 retired/candidate/비정상 health를 무시하고 강제 사용하게 하지 않는다.
- 기존 active 모델은 entitlement=unknown으로 보존한다. 이것은 무료 검증 완료라는 뜻이 아니다. 신규 발견 모델은 candidate/isActive=false이며 무료 및 adapter 검증 전에 선택기에 노출되지 않는다.

## 초기 설치와 기존 DB 마이그레이션

새 빈 로컬 DB는 현재 schema로 `npm run db:push` 후 `npm run db:seed`한다.
기존 DB는 `npm run models -- migrate up`으로 모델 관련 변경만 적용한다. 이 명령은 한 transaction 및 advisory lock을 사용한다.

`drizzle/0000_*`는 현재 전체 앱 schema와 차이가 있는 초기 이력이다. 이번 변경을 그 이력에서 무작정 generate/migrate하지 않는다. 전용 SQL은 `migrations/model-registry/001-up.sql`이다.

마이그레이션은 기존 modelId를 upstreamModelId로 복사하고, workflow_nodes의 chatNode 값 중 알려진 모델만 UUID로 변환한다. 미존재 모델 값과 다른 노드의 텍스트는 그대로 둔다. 프리셋/채팅은 기존 workflow를 계속 참조하며 edge/위치/기록은 변경하지 않는다.

새 코드에서는 UUID와 기존 alias를 모두 해석한다. 이전 버전 코드는 UUID 선택값을 해석하지 못하므로 향후 운영 적용 시 앱을 중지/유지보수 상태로 두고 DB 변경과 새 코드 배포를 함께 수행해야 한다. 실제 순서는 5단계 리허설에서 확정한다.

## 카드와 가격 수정

```sh
npm run models -- list
npm run models -- update '<모델 UUID>' .local/model-settings.json
```

설정 파일 예:

```json
{
  "name": "GPT OSS 20B",
  "description": "일반 채팅용 모델",
  "price": 15,
  "order": 70001,
  "isActive": true,
  "appMaxInputTokens": 8000,
  "appMaxOutputTokens": 4096
}
```

부분 수정 가능. price=null은 가격 미확인이고 price=0만 명시적인 무료 크레딧이다. appMaxOutputTokens=null은 기존 metadata.maxOutputTokens, 없으면 8192로 돌아간다. 공식 outputTokenLimit이 더 작으면 그 값으로 제한한다.

CLI 변경 후 페이지 새로고침/다음 실행에서 최신 값을 읽는다. 모델 registry/options/가격 계산은 외부 CLI 수정이 Next cache에 갇히지 않도록 최신 DB를 읽으며, 정적인 사이드바 번역/정의 캐시는 유지한다.

운영용 공개 쓰기 API나 권한 없는 관리자 UI는 추가하지 않았다. 현재 카드 편집은 운영 CLI로 수행한다. 캔버스와 노드 패널은 같은 선택/상태/가격/제한 컴포넌트를 사용한다.

## 카탈로그 반영

```sh
npm run models -- catalog .local/model-catalog.json
```

```json
[
  {
    "provider": "ollama",
    "upstreamModelId": "gpt-oss:20b",
    "displayName": "GPT OSS 20B",
    "metadata": {"sourceUrl":"https://ollama.com/api/tags"}
  }
]
```

기존 제공사+모델은 사양만 갱신하고 UUID/alias/운영 설정을 유지한다. 처음 발견된 모델은 초기 가격 정책을 적용한 비공개 후보가 된다. 이 명령은 원격 API를 호출하거나 모델을 활성화하지 않는다.

초기 가격: Groq GPT OSS20B=15/120B=20, Ollama GPT OSS20B=2/120B=4/Gemma4 31B=3, Google Gemma4 26B=2/31B=3/Gemini3.5 Flash Lite=5. 기타 Ollama 후보 기본 3, 다른 제공사는 미확인(null). 기존 운영 가격에는 소급 적용하지 않는다.

## 실행 가격 기록

chatNode는 실제 실행 전에 최신 모델/가격/서비스 제한을 읽고 ai_model_executions에 고정한다. 레코드에는 내부 UUID, 제공사 모델 ID, 사용자/스레드/노드 식별자, 가격, 입력/출력 제한, 실행 상태를 기록한다. 프롬프트와 응답 원문, 키는 저장하지 않는다.

실행 중 모델의 운영 가격이 바뀌어도 이미 시작한 노드의 차감액은 바뀌지 않는다. 전체 workflow의 사전 가용성 검사와 credit 예약/중복 차감 방지 확장은 각각 4/5단계다.

## 되돌리기

```sh
npm run models -- migrate down
```

down은 새 모델이나 실행 이력이 없는 도입 전 리허설에만 허용된다. UUID를 원래 alias로 되돌리고 모델 registry 확장 schema를 제거한다. 새 모델/실행 이력이 생긴 경우는 정보 손실을 피하기 위해 거부한다. 그 상태에서는 backup 복구 또는 forward-fix를 사용한다. 운영에서 테스트 없이 down을 실행하지 않는다.

## 검증

```sh
npm run test:models:registry
npm test -- --run
npx tsc --noEmit
npm run lint
npx playwright test e2e/workflows/model-registry.spec.ts e2e/chat/stream-contract.spec.ts --project=chromium --workers=1 --reporter=line
```

DB 검증은 로컬 PostgreSQL 안에 독립된 임시 데이터베이스를 생성하고 완료 후 정리한다. CREATE DATABASE 권한이 필요하다. 외부 AI는 호출하지 않는다. 실제 모델 호출은 1단계의 runAiCall/aiFetch 순차 실행 경계를 통해서만 수행한다.
