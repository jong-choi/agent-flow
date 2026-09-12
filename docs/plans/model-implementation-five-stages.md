# AI 모델 관리 개편 — 5단계 실행 계획

작성: 2026-09-13 KST. 이 문서는 실행 계획이다. 종료 범위는 코드/테스트/마이그레이션/운영 절차가 준비되고 작업 브랜치에 푸시된 배포 직전 상태다.

## 공통 규칙

- 전용 작업 브랜치에서 진행한다. 각 단계 검증 후 논리 단위 커밋 및 원격 푸시. main 병합, 운영 배포 workflow 실행, 운영 migration/seed/sync apply, 정기 worker 활성화는 이번 범위 밖이다.
- 현재 main push + version bump 자동 배포 설정이 있으므로 작업 브랜치의 CI는 검증만 실행한다. 배포를 유발할 main push/version bump는 하지 않는다.
- 기존 .env, 로컬 DB, env 예시, Ollama secret 전달, Git/Docker 제외 등 준비 변경은 먼저 검토해 1단계의 별도 준비 커밋으로 묶는다.
- 모든 실제 AI 요청은 제공사에 관계없이 순차 실행한다. 진단/테스트/제목 생성/워크플로우/상태 probe가 동시에 실행되어도 공유된 실행 조정 장치로 총 1개만 진행한다. 테스트 workers=1만으로 해결됐다고 보지 않는다.
- 실호출에는 재시도·시간·출력 예산을 정하고 자동 다중 재시도를 통제한다. raw 응답/키/쿠키/사용자 데이터는 Git/Docker에서 제외한다. CI용 fixture는 별도 합성 또는 최소한의 비밀정보 없는 자료를 사용한다.
- 각 단계는 변경 영역 단위·통합 테스트, 관련 E2E, 필요한 순차 실호출로 검증한다. 실패 수정 뒤 통과를 확인하고 다음 단계로 간다. 핵심 구조 변경/의존성 변경 시 전체 회귀 검증을 수행한다.
- 기본 CI는 mock/replay만 사용한다. live 검증은 명시적으로 실행하는 단일 job/수동 명령으로 분리하고 여러 브라우저/worker가 AI를 재호출하지 않게 한다.
- 기존 화면의 동작/실행 계약을 먼저 보존하며, provider 로직과 모델 목록/운영 정책을 분리한다. 각 단계에 관련 기존 코드 리팩토링을 포함한다.
- 외부 API/라이브러리의 실제 버전별 필드가 불명확하면 공식 문서·소스를 확인하고 전송 raw로 재검증한다.

## 1단계 — 공통 호출·응답·오류 경계 정리

### 작업
- 현재 모델 factory, chat-node, SSE mapper, persistent chat 저장, 제목 생성에서 provider 독립 경계를 정의한다.
- answerText 추출을 공통 함수로 통일한다. string 및 text block 지원, thought=true/type=reasoning을 최종 답변에서 제외한다.
- 원본 AIMessage/AIMessageChunk를 서버에서 유지해 Google 서명·tool call 데이터를 잃지 않게 한다. UI용 텍스트/다음 노드 입력을 별도로 추출한다.
- provider 오류를 status/statusCode/status_code/response.status 등에서 정규화하고 upstream code, retry/reset 정보, 취소, 출력 중단을 보존한다.
- usage/finishReason은 제공사별 의미를 유지하고 누락된 값은 미확인으로 남긴다. 현재 SSE 문자열 계약은 보존한다.
- 실호출 공통 순차 실행기와 테스트용 capture/replay 진입점을 마련한다. 프로세스 간 공유 잠금/리스 및 해제/취소 동작을 검증한다.
- 실제 raw와 합성 fixture를 구분하고 .local을 테스트 수집/빌드 입력에서도 제외한다.

### 검증
- Groq 기준 fixture로 일반 응답·한글 분할 chunk·빈 chunk·추론 block·오류·중도 종료 테스트.
- 기존 temporary/persistent 채팅과 제목 생성 관련 E2E.
- Groq GPT OSS20B/120B를 순차 호출해 UI text, outputMap, 최종 저장 text 일치 확인.
- 호출 두 건을 동시에 요청하는 테스트에서 upstream 실제 동시 실행 수가 1인지 확인; 사용자 취소 후 잠금이 해제되는지 확인.

### 완료/커밋
- 기존 Groq 동작을 보존하고 모든 후속 adapter가 같은 경계로 연결 가능.
- 준비 변경과 공통 경계 리팩토링을 구분해 커밋하고 작업 브랜치에 푸시.

## 2단계 — 모델 레지스트리·카드·가격 관리

### 작업
- 모델 식별을 내부 UUID + provider/upstreamModelId로 정리하고 기존 문자열 참조를 안전하게 해석/마이그레이션한다.
- catalog lifecycle, 계정 접근 권한, runtime health, 관리자 공개 여부를 분리한다.
- 자동 수집 metadata와 운영 설정(name/description/order/credits/default settings/app limits)을 분리한다. sync와 seed가 운영 설정을 덮어쓰지 않게 리팩토링한다.
- 활성 선택지 조회와 기존 모델 참조 조회를 분리한다. 삭제/은퇴 모델도 ID/이름/사유가 남는다.
- 카드에 provider, 고정 크레딧, 상태, 서비스 실제 기능/상한을 표시한다. 공식 최대 입력/출력은 상세정보로 구분한다.
- 가격 초안: Groq20B=15/120B=20 유지; Ollama20B=2/120B=4/Gemma31B=3; Google Gemma26B=2/Gemma31B=3/Gemini3.5FlashLite=5. 신규 모델 가격 정책 없는 상태에서 자동 공개하지 않는다.
- 비용 계산/실행 가격 snapshot을 통일하고 미존재 모델을 0크레딧 모델로 표시하지 않는다.
- DB migration/backfill을 작성하고 구 ID 역호환 및 rollback/forward-fix 절차를 마련한다. 모든 적용은 로컬 테스트 DB에만 수행한다.

### 검증
- 마이그레이션 전/후 fixture로 기존 워크플로우/프리셋/채팅 참조 보존.
- seed/sync 반복 실행 시 가격·정렬·관리자 숨김 유지, provider 간 동일 ID 충돌 방지.
- 모델 카드/선택기/미존재 모델 표시/크레딧 예상값 E2E.
- 기존 Groq 노드 실행으로 레지스트리 연결 검증.

### 완료/커밋
- 하드코딩된 seed 수정 없이 모델 metadata와 운영 가격을 관리 가능.
- schema/migration, 조회·UI·가격 리팩토링을 논리 단위로 커밋하고 푸시.

## 3단계 — Ollama와 신규 Google 모델 3종 연결

### 작업
- 검증한 버전 조합을 바탕으로 LangChain Core 및 필요한 adapter 의존성을 함께 갱신한다. 전체 provider를 동시에 OpenAI 프로토콜로 변경하지 않는다.
- Google: 새 @langchain/google ChatGoogle native API. 대상은 gemini-3.5-flash-lite, gemma-4-26b-a4b-it, gemma-4-31b-it.
- Ollama: ChatOllama native cloud host와 Bearer key. 초기 검증은 gpt-oss:20b, gpt-oss:120b, gemma4:31b. 주간 발견 모델도 같은 adapter로 연결 가능하게 한다.
- reasoning 설정을 provider/model capability에 맞게 매핑한다. Google thinkingLevel 전송 확인; 지원하지 않는 값을 공통 기본값으로 강요하지 않는다.
- model factory의 조건 분기를 adapter registry로 정리한다. 제목 생성 고정 모델 선택도 정책 기반으로 바꾼다.
- 답변은 1단계의 공통 함수로 처리하고 원본 메시지/서명은 보존한다. 영속 대화가 도구 정보를 다룰 경우 role/content-only 재구성 문제까지 해결한다.
- Ollama Cloud structured outputs는 지원 목록에서 제외한다. 모델별 확인되지 않은 기능은 노출하지 않는다.

### 검증
- 의존성 변경 직후 typecheck/lint/전체 기존 단위·통합 테스트.
- 각 제공사/모델 순차 실호출: invoke, stream, 멀티턴, upstream node 입력, minimal/high(지원 시), system message, 제목 생성.
- 현재 앱 temporary/persistent E2E에서 화면 text=outputMap=저장 text 확인. reload 이후 대화 지속 확인.
- signed tool call 및 usage/finish/error 보존 확인. 기존 Groq도 회귀 실호출.
- Google Gemma31B는 이전에 native/openai 모두 500이었다. 성공 응답이 확인되기 전에는 활성·검증 완료로 표시하지 않는다. 재현 raw와 원인을 기록하고, 여전히 제공사 오류면 비활성/검증 대기로 남기며 해당 모델은 운영 준비 미완료로 명시한다. 다른 모델로 몰래 치환하지 않는다.

### 완료/커밋
- 3종 Google 호출 경로 및 Ollama adapter가 구현되고 실제 성공한 모델/검증 대기 모델이 명확히 구분됨.
- 의존성/adapter/제목 및 히스토리 리팩토링을 검증 단위로 커밋·푸시. live 결과는 요약만 기록하고 raw는 제외.

## 4단계 — 목록 동기화·상태 점검·은퇴 및 기존 연결 보호

### 작업
- 공식 catalog collector 3종, 정규화/변경 계획 계산, 검증, DB 반영을 분리한다. dry-run/apply 및 수동 재검증 명령을 제공한다.
- 주간 신규/무료 후보 갱신, 일일 기존 등재 확인, 실사용 관측, cooldown 만료 probe를 구현한다.
- Ollama 무료 접근 검증과 단순 호출 성공을 구분한다. entitlement 불명확하면 후보 상태 유지. 짧은 probe도 전역 순차 큐/예산에 포함한다.
- 5xx/timeout 반복 시 15분→1시간→4시간 cooldown; 429는 제공사 retry/reset 우선; 인증·권한/입력 오류/사용자 취소는 별도 처리.
- 48시간 유효 점검 실패는 suspended. 공식 종료 또는 반복 목록 누락+모델 미존재 확인만 retired. provider 공통 장애와 모델 장애를 구분한다.
- Postgres 기반 스케줄·상태·리스·중복 실행 방지를 사용하는 maintenance worker 구현. 재시작/지연 작업/실패 복구 포함. 운영에서는 기본 비활성.
- 전체 graph 실행 전 모델 가용성을 재검증한다. 중간 은퇴 모델 때문에 앞 노드가 비용/부작용을 발생시킨 뒤 실패하는 일을 줄인다.
- 은퇴 노드에 사유·대체 후보 표시, 워크플로우 내 해당 모델 일괄 변경 제공. 연결선/설정/기록 보존, 자동 대체는 명시된 정책만 따른다.
- 상태 변경 시 chat/canvas 캐시 모두 갱신; 열려 있는 화면도 실행 시 서버 최신 상태 확인.

### 검증
- fake clock으로 15분/1시간/4시간/48시간 전이, 복구, worker 재시작 및 리스 테스트. 실제 48시간을 기다리는 테스트 대신 조건을 결정적으로 검증한다.
- 429/401/provider 장애/사용 없음/예산 소진이 은퇴로 이어지지 않는지 확인.
- catalog 빈 응답/부분 페이지/대량 누락/파싱 실패에서 마지막 정상 상태 보존.
- 기존 워크플로우에서 모델 은퇴→실행 차단→대체 선택→실행 성공 E2E.
- 정상 모델에 순차 live probe 및 동기화 read-only 검증. 실제 계정 한도를 고의 소진하지 않는다.

### 완료/커밋
- 로컬 worker에서 목록/상태/복구/은퇴/기존 연결 UX가 동작하며 운영 scheduler는 비활성.
- collector/worker, lifecycle 정책, 기존 연결 UI를 논리 단위 커밋·푸시.

## 5단계 — 전체 회귀·운영 반영 리허설·배포 직전 준비

### 작업
- 중복 코드/임시 구현을 정리하고 의존성 및 adapter 버전을 확정한다.
- 새 빈 DB와 기존 구조 테스트 DB 모두에서 migration→seed→sync→rollback 또는 forward-fix 리허설.
- credit 예약/확정/실패 해제 및 실행별 중복 청구 방지를 확인한다. 고정 요금은 성공한 chat node 단위, probe/retry는 사용자 과금 제외.
- Production build와 로컬 컨테이너 기동/정상 응답 점검. env/Secrets/Compose/배포 workflow 연결 및 worker 기본 비활성 확인.
- 새 코드/구 코드와 schema의 호환 순서, backup, migration, 배포, smoke test, worker 활성화, 복구 절차 문서화.
- 전체 변경 diff와 migration 검토, 남은 제한/검증 대기 모델을 명시한 최종 배포 전 보고서 작성.

### 검증
- 전체 unit/integration, typecheck, lint, build.
- E2E: 로그인, 카드, 워크플로우 편집·저장·재열기, 임시/영속 채팅, 제목, 크레딧, 은퇴·대체·복구, 오류/취소/부분 stream.
- 기본 다중 브라우저 E2E는 mock/replay. 실제 provider E2E는 하나의 브라우저/worker로 별도 순차 실행.
- 새로 활성화할 모델 전부 짧은 실호출 smoke, raw/SSE/저장 결과 대조. 성공하지 못한 모델은 최종 검증표에 비활성/미완료로 남긴다.
- 커밋 대상에 API key/.env/raw/쿠키/개인 데이터가 없는지, Git/Docker 제외가 유효한지 확인.

### 최종 완료/커밋
- 최종 수정 커밋 및 작업 브랜치 푸시; 검증 CI 통과 확인.
- 커밋 목록, 테스트 결과, 활성화 가능한 모델, 미완료 모델, migration/배포/복구 명령이 준비된 상태로 종료.
- main 병합·운영 배포·운영 DB 반영·운영 정기 작업 활성화는 실행하지 않는다.

## 관련 실험/정책 근거

- [라이프사이클 상세 정책](./model-lifecycle.md)
- [provider 실제 호출 비교](./provider-compatibility.md)
