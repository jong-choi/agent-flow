# 모델 목록·상태·카드 운영 계획

작성: 2026-09-13 KST. 제안이며 아직 운영 동기화/스케줄을 적용하지 않음.

## 원칙
- provider + upstreamModelId로 제공사별 모델을 구분하고 안정적인 내부 UUID로 참조한다. 기존 modelId 문자열은 마이그레이션 시 해석 가능하도록 유지한다.
- catalog lifecycle(active/deprecated/retired), account entitlement(free_confirmed/paid/unknown/blocked), runtime health(healthy/cooldown/probing/suspended)를 분리한다. 관리자 숨김도 별도 플래그다.
- 은퇴 레코드는 보존한다. 새 모델 발견/상태 회복이 관리자 숨김이나 고정 가격을 덮어쓰지 않는다.
- HTTP 200, 목록 등재, 무료 접근 가능, 앱과의 호환성은 서로 다른 근거다.

## 일정 제안
- 매주 월요일 04:17 KST: Ollama 무료 접근 후보 갱신; Google/Groq 신규 모델 발견 및 사양 갱신. 공식 목록을 모두 페이지 순회한다.
- 매일 04:37 KST: 기존 등록 모델의 공식 목록 등재 여부 재확인. 신규 모델은 weekly validation 전까지 후보만 저장.
- 실사용마다: 정상 완료/오류/스트림 중단 관측. 마지막 정상 완료로 건강 확인을 대체하여 불필요한 probe 절감.
- 15분마다 worker: nextProbeAt이 지난 모델만 처리. 실제 모델별 점검 간격과 구분한다.
- 최근 24시간 성공 없는 정상 모델: 하루 1회 짧은 probe. 사용자 트래픽 우선.
- 일시 중지 모델: 중지 만료 시 단일 probe. 장기 비활성 모델: 하루 1회. 공식 은퇴 모델: 정기 추론 probe 없음.
- 공식 종료 공지: 주간 변경 확인, 등록된 종료일은 worker가 적용. HTML 파싱 실패/날짜 모호함은 검토 대기이며 은퇴 확정 근거가 아니다.
- 기존 VPS에 전용 maintenance worker 서비스를 제안한다. Postgres에 실행 상태/nextRunAt/리스 저장, 다중 인스턴스 중복 방지, 재시작 시 누락 작업 처리. API 요청이나 Next.js 프로세스 내부 setInterval에 의존하지 않는다.
- 운영 작업은 수동 dry-run/apply 명령도 제공. 최초에는 dry-run으로 변경 내역 확인. 이 문서만으로 scheduler를 생성하지 않는다.

## 목록 수집 및 무료 정책
- Ollama: GET https://ollama.com/api/tags.
- Google Gemini/Gemma: GET https://generativelanguage.googleapis.com/v1beta/models. generateContent 지원 모델 선별; nextPageToken 끝까지 조회.
- Groq: GET https://api.groq.com/openai/v1/models. 텍스트 채팅/앱 adapter 지원 여부 추가 필터; audio/guard 모델 자동 노출 금지.
- 공식 목록 응답 성공/스키마 유효/전체 pagination 완료 뒤에만 snapshot 반영. 비정상 빈 목록, 대량 누락, 동시 다수 실패는 provider 또는 collector 이상으로 격리하고 기존 목록 보존.
- Ollama Free는 starter 사용 크레딧과 모델 접근 범위가 있는 플랜이다. 구매 크레딧/유료 계정으로 성공한 요청은 free_confirmed 근거가 아니다.
- 무료 후보 출처: 공식 starter 접근 정보 우선, 커뮤니티 목록은 후보 발견만 보조. sourceUrl/observedAt/verificationMethod 저장.
- 검증된 무료 플랜 자격과 크레딧 구매 여부를 확인할 수 있는 기존 계정에서만 무료 접근 검증. 확인 불가하면 access=unknown 유지하고 비용 없는 호출을 보장하지 않는다. 새 계정 생성이나 한도 우회는 하지 않는다.
- 새 후보만 단일 응답/스트리밍/멀티턴/상위 노드 입력 검증. 기능 테스트 통과 후 기존 raw/SSE contract와 비교, 가격 정책이 있는 모델만 노출.
- 매주 모든 후보에 무제한 추론하지 않는다. 최초 예산: 제공사당 하루 probe 10회, 모델당 주간 온보딩 최대 4회. 긴급 복구 probe도 일 예산 안에서 우선 처리; 소진 시 대기하며 미점검을 실패로 기록하지 않는다.
- probe는 짧은 합성 입력, 모델에 유효한 낮은 추론 설정, 모델별 충분한 제한 토큰/timeout 사용. 생각 토큰 소진/length 종료/안전 차단/도구 응답을 은퇴로 판정하지 않는다.

## 오류 분류와 상태 전이: 아래 숫자는 서비스 정책 제안
- 오류 정규화는 현재 mapUnknownToApiTypedError보다 앞에서 수행. 원래 HTTP status, provider code, retry-after/RetryInfo, model/credential/project scope, finish reason, stream 중단 여부를 보존한다. 사용자의 prompt/body/키는 정기 상태 로그에 저장하지 않는다.
- 400/413/422 및 문맥 초과/지원하지 않는 옵션: 해당 요청 실패, 모델 전역 실패 카운터 제외.
- 안전 차단/정상적인 빈 tool-only 응답/사용자 취소: 모델 장애 카운터 제외. 의도된 응답 타입에 따라 성공 여부 별도 판단.
- 401: credential 단위 중지. 403: provider code/정책/권한 확인 후 해당 범위 접근 중지; 은퇴 아님.
- 429: 서버 retry-after/RetryInfo/reset 시각 우선. 분/일/프로젝트/계정 공통 한도를 구분. reset 불명확하면 1m→5m→15m→1h→최대4h backoff. 은퇴 실패 기간에 합산하지 않는다.
- 5xx/네트워크/timeout: 한 번 실패로 4시간 중지하지 않는다. 10분 내 연속 3건의 최종 실행 실패 또는 10건 이상 표본에서 50% 이상 실패 시 15분 중지. 동일 실행의 SDK retry는 한 사건이다.
- probe 실패 시 중지 1h→4h; 성공 시 probing, 다음 성공(별도 요청, probe면 5분 이상 간격) 후 healthy. 첫 성공 후 실제 트래픽은 1개 제한으로 허용. 중간 실패면 다시 cooldown. 사용자에게 이미 chunk가 전달된 실행은 투명 자동 재시도하지 않는다.
- 48시간 연속 서비스 장애 + 서로 다른 시각에서 완료한 유효 probe 3회 이상 실패 시 suspended: 선택 불가/자동 대체 후보에서 제외. 성공하면 실패 기간 초기화. 미사용/점검 예산 소진/인증·quota/provider-wide 장애는 이 조건 제외.
- suspended는 retired가 아니다. 404 하나도 모델 종료 확정이 아니다. 모델 미존재를 나타내는 upstream code, 올바른 endpoint/버전, 정상 계정 상태를 확인한다.
- retired 확정: 공식 종료일 도래 OR 48h 이상 간격을 포괄하는 3개의 정상 전체 catalog snapshot에서 누락 + 모델 미존재 응답 재확인 + provider 정상. 모호하면 suspended/review 상태 유지.
- 여러 모델 동시 실패 시 provider/credential breaker를 먼저 열고 개별 은퇴 카운터를 정지. Ollama Free는 계정 동시 요청 1개 큐와 대기 제한 적용.
- 수동 숨김/은퇴는 health 성공만으로 되돌리지 않는다. 공식 은퇴 후 재등재는 재검증 후보로 처리.

## 모델 카드 및 가격
- 수집 소유 필드: upstream ID, vendor version, input/output/context 사양, 지원 메서드, 원본 metadata, 출처/확인 시각, 종료 공지.
- 운영 소유 필드: 표시 이름/설명/아이콘, creditsPerRun, order, 공개 여부, 앱 입력/출력 상한, 추론 기본값, 대체 후보. 자동 sync는 이를 덮어쓰지 않는다.
- 사실 미확인 필드는 null. 로컬 모델 스펙을 Cloud 또는 다른 제공사에 그대로 복사하지 않는다. raw reasoning 존재와 UI 추론 표시 지원을 구분.
- 카드에는 이름+제공사, 1회 비용, 서비스가 실제 지원하는 입력·기능, 상태, 대체 모델 표시. 세부정보에는 공식 최대 입력/출력과 서비스 적용 상한을 각각 표시.
- Google 모델 목록 직접 확인: gemini-3.5-flash-lite input=1048576/output=65536/thinking=true; gemma-4-26b-a4b-it 및 gemma-4-31b-it input=262144/output=32768/thinking=true. Gemma API thinking은 high=켜기/minimal=끄기, 공통 low/medium을 억지로 적용하지 않는다.
- Groq GPT OSS 두 모델 공식 context=131072/max completion=65536. 현재 앱은 o200k 기준 입력 8000 토큰 제한; 공식 최대치를 현재 서비스 지원치로 오표시하지 않는다.
- 고정 요금 초안(성공한 chat node 실행 1회): Ollama GPT OSS20B=2, GPT OSS120B=4, Gemma4 31B=3; Google Gemma4 26B A4B=2, Gemma4 31B=3, Gemini3.5 Flash Lite=5; Groq GPT OSS20B=15/120B=20 유지.
- 신규 Ollama 모델: 기본 3크레딧 후보, 무료·응답 호환·토큰 상한 검증 전 공개 금지. 가격 변경은 운영 정책 변경으로 명시.
- 위 숫자는 서비스 크레딧 정책이며 원가 환산이 아니다. Ollama GPT OSS가 Groq보다 훨씬 저렴한 원가라는 근거는 없다. Free 잔여량/구매 크레딧 사용 방지 정책과 서비스 요금은 별개다.
- 고정 요금은 실행 입력/출력/추론 예산 상한과 함께 적용. 초기 입력 8000 유지, 신규 adapter 출력 예산 4096 제안 후 reasoning 포함 정상 완료 여부 검증. 65536은 지원 최대치로 보존. 상한 확대는 별도 정책.
- 실행 시 모델·가격·설정 snapshot. credit reservation/settlement로 동시 실행 잔액 경쟁 방지. 성공 1회만 차감, 재시도/probe 중복 차감 금지. 중도 실패는 해제. 기존 성공 노드 요금과 실패 노드 요금은 구분.

## DB와 앱 변경 순서
1. provider error 분류 및 Groq 기준 raw 재생 검증. Ollama/Google 일반 응답·streaming·멀티턴 contract 확인.
2. ai_models lifecycle/entitlement/운영 필드 확장, model_health/provider_health/model_checks/catalog_sync_runs 및 실행 snapshot 추가. 데이터량에 맞춰 observation 보관기간 30일, 집계 90일 제안.
3. 기존 문자열 참조 마이그레이션, 은퇴 placeholder 표시, 전체 그래프 실행 전 가용성/비용 검사. 저장값 변경 없이 대체 제안. 임시·영속 채팅 모두 적용.
4. 수동 catalog dry-run/apply. 수집값과 운영값 충돌 방지, 가격 보존, upsert 멱등성 확인.
5. worker의 weekly/daily/probe 일정을 활성화. 상태 변경 후 chat/canvas 관련 캐시 모두 무효화하고 기존 열린 UI는 실행 전 재검증.
6. 운영 화면: 마지막 동기화/누락/사용 중지 사유/재점검 시각/수동 해제/대체 편집/가격 편집. collector 자체 실패 및 상태 변경만 알림.

## 필수 검증
- 429가 48시간 이어져도 retired 안 됨; 사용자 취소/안전 차단/400은 건강 카운터 제외.
- 모델 미사용 48시간은 은퇴 아님; worker 중단/예산 소진도 실패 아님.
- list 빈 응답/페이지 실패/대량 누락에서 기존 활성 목록 보존.
- provider-wide 장애/401로 여러 모델 은퇴 금지; 복구는 범위별 검증.
- 48시간 모델 장애는 suspended; 확정적인 은퇴 증거와 구분.
- 중복 worker/probe 방지; 하나의 SDK retry 묶음을 다중 실패로 세지 않음.
- 고정 가격이 sync/seed/restart로 초기화되지 않음; 비용 snapshot과 중복 청구 방지.
- 모델 변경 없이 이전 워크플로우/대화 열람 유지; 은퇴 노드 그래프는 부작용 발생 전 차단.

## 공식 출처
- https://docs.ollama.com/cloud
- https://ollama.com/pricing
- https://console.groq.com/docs/models
- https://console.groq.com/docs/errors
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/deprecations
- https://ai.google.dev/api/models
- https://ai.google.dev/gemini-api/docs/troubleshooting
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/deprecations
- https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite

공개/인증 모델 목록 raw는 Git 제외된 .local/ai-captures/{provider}-catalog.json에 저장.
