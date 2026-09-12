# 모델 목록·상태·은퇴 운영

4단계 구현. 운영에서는 기본 비활성이다. 아래 apply 예시는 로컬 DB에서 검증한 명령이며, 운영 적용은 별도 배포 단계다.

## 상태와 기존 연결

- catalog lifecycle(candidate/active/deprecated/retired), runtime health, 계정 무료 접근, 운영자 공개 여부를 분리한다. 삭제 대신 내부 UUID와 이전 model_id를 남긴다.
- 실제 채팅과 제목 생성마다 성공/실패를 기록한다. 10분 안의 모델 5xx/timeout 3회는 15분 cooldown, 유효 재점검 실패는 1시간→4시간으로 증가한다. 48시간과 간격을 둔 실패 probe 3회는 suspended이며 자동 retired가 아니다.
- 429는 Retry-After/RetryInfo/소진된 quota reset을 우선한다. 모델 범위가 명시된 quota는 그 모델에만 적용한다. 인증·키·제공사 quota와 여러 모델 공통 장애는 제공사 상태에 기록하며 모델의 48시간 실패 증거로 사용하지 않는다.
- Groq `Request too large ... expected output tokens exceed` 429는 요청 설정 오류다. 출력 상한을 줄여야 하므로 자동 대기나 은퇴 판정으로 해결하지 않는다.
- 성공 2회로 회복한다. probe 성공은 5분 간격을 요구한다. 첫 성공 이후 probing 상태에서는 실제 요청을 받아 회복을 확인할 수 있다. 수동 숨김·은퇴는 회복으로 풀리지 않는다.
- 공식 종료 공지를 사람이 확인해 종료 시각을 등록하거나, 48시간에 걸친 3회 목록 누락(각 20시간 이상 간격), 모델 미존재 응답, 동일 키의 최근 24시간 내 제공사 성공이 함께 확인되면 retired로 전환한다. 빈 목록·이전 대비 30% 초과 급감은 자동 반영을 거절한다(이전 목록 4개 이상).
- 모든 그래프의 모델을 START 직후, 다른 노드가 실행되기 전에 검사한다. 모델/크레딧/상한 snapshot을 고정하고 개별 호출 직전에도 최신 가용성을 확인한다. 실행 실패를 다른 모델로 몰래 대체하지 않는다.
- 저장된 워크플로우는 은퇴 모델 이름과 사유를 유지한다. 선택기에서 추천 모델 또는 사용 가능한 모델을 선택해 같은 UUID/legacy 참조를 일괄 교체할 수 있다. 노드 위치·기타 값·edge를 보존하고 기존 저장 버튼으로 확정한다.

## 스케줄과 실행 제어

- 주간 발견: 매주 월요일 04:17 KST. Google/Groq/Ollama 공식 catalog를 수집하고 신규 모델을 비공개 candidate로 추가한다.
- 일일 기존 모델 등재 확인: 04:37 KST. 공식 종료 안내 페이지는 주간 변경 digest를 기록하며, 페이지 문구를 바로 은퇴 명령으로 해석하지 않는다.
- 상태 probe와 예약 종료/무료 증거 만료: 15분 주기. 실제 probe는 nextProbeAt 및 제공사 대기 시간 이후에만 실행한다.
- worker와 API/CLI는 PostgreSQL 세션 advisory lock으로 모든 실제 AI 호출을 총 1개로 제한한다. worker 자체 중복 실행도 별도 세션 잠금으로 방지한다. 작업 상태·소유자·5분 lease를 DB에 보존하고 15초마다 연장한다.
- 제공사별 UTC 일일 probe 예산 10회. 신규 candidate 검증에는 invoke+stream 2회를 먼저 예약한다. 자동 SDK 재시도는 0회다. 기존 서비스 회복을 신규 후보보다 먼저 확인한다.
- 프로세스 종료 시 작업 lease가 만료되면 다음 worker가 이어간다. 실행 결과 기록은 소유자 조건을 사용한다. job 실패는 1시간 후 재시도하고 이벤트를 남긴다.
- 배포 전 연결 DB는 세션 잠금을 유지할 수 있어야 한다. transaction-pooling 연결은 지원하지 않는다.

## CLI

```sh
npm run models -- maintenance-migrate up
npm run models:maintenance -- status
npm run models:maintenance -- sync groq --discover
npm run models:maintenance -- sync groq --discover --apply
npm run models:maintenance -- probe MODEL_UUID --apply
npm run models:maintenance -- once --apply
```

`sync` 기본값은 DB 변경 없는 dry-run이다. `once --apply`는 실제로 한 개의 만료 작업을 수행한다. `probe --candidate`는 무료 계정 확인 및 가격 설정을 충족한 candidate만 두 번 실호출한 후 승격한다. 비공개 후보에 대해 별도의 수동 호환성 실험을 하려면 아래 로컬 전용 명령을 사용한다.

```sh
RUN_AI_LIVE=1 npm run test:ai:candidates
RUN_AI_LIVE=1 AI_CANDIDATE_MODELS=gemini-3.1-flash-lite npm run test:ai:candidates -- --activate-google
```

수동 실험은 후보의 일반 응답, JSON 저장/복원한 이력, 공통 createChatStream SSE를 확인한다. 성공한 Google 모델만 명시적 `--activate-google`로 로컬 활성화할 수 있다. 이 명령은 계정 무료 자격을 추정하지 않는다. 운영자 숨김/기존 운영 가격은 보존하며 신규 Groq 후보의 출력 상한은 검증한 512로 설정한다.

무료 접근은 API 200만으로 판정하지 않는다. 공식 가격표의 모델 무료 구간, 현재 연결 계정의 무료 플랜/구매 크레딧 여부를 확인한 사람이 아래 형태의 파일을 `.local`에 작성한다. 키의 SHA256 fingerprint와 allowlist를 묶고 최대 7일 뒤 만료시킨다. 원래 키는 DB에 저장하지 않는다.

```json
{
  "freeAccount": true,
  "purchasedCredits": false,
  "modelIds": ["qwen/qwen3.8-27b"],
  "sourceUrl": "https://console.groq.com/docs/rate-limits",
  "expiresAt": "REPLACE_WITH_REVIEWED_ISO_TIMESTAMP_WITHIN_7_DAYS"
}
```

```sh
npm run models:maintenance -- confirm-free groq .local/free-policy.json --apply
npm run models:maintenance -- probe MODEL_UUID --candidate --apply
```

새 Ollama 및 초기 Groq 무료 후보는 requireFreeAccess를 적용한다. 키 교체·증거 만료·allowlist 제외 시 호출 전에 차단한다. 네트워크 검증 도중에도 운영자 설정이나 증거가 바뀔 수 있으므로 승격 직전에 다시 확인한다. 신규 목록에서 보인다는 사실만으로 무료 자격/기능/가격을 만들어내지 않는다.

예약 종료 JSON: `at`(ISO 시각), `reason`, `sourceUrl`(해당 제공사의 공식 HTTPS 안내), `replacementId`(UUID 또는 null).

```sh
npm run models:maintenance -- retirement MODEL_UUID .local/retirement.json --apply
npm run models:maintenance -- reset MODEL_UUID --apply
```

reset은 건강 상태만 초기화하며 은퇴/숨김을 해제하지 않는다. 상태 이벤트는 `status` 및 DB `ai_maintenance_events`에서 확인한다. 외부 알림 발송은 구현 범위에 포함하지 않는다.

## 배포 준비 및 제한

로컬 Postgres는 메모리/스왑 합계 256 MiB, CPU 1개, shared_buffers 32 MiB로 제한한다. maintenance는 512 MiB, CPU 0.5개, Node heap 256 MiB로 제한한다. 무거운 이미지/앱 빌드와 DB 테스트를 겹쳐 실행하지 않는다. 메모리 상한에 도달하면 해당 컨테이너가 종료될 수 있으므로 데이터 volume을 유지하고 상태/로그를 점검한다.

`maintenance.Dockerfile`과 compose의 `maintenance` profile을 준비했다. `AI_MAINTENANCE_ENABLED=false`가 기본값이고 운영 프로필은 실행하지 않았다. 기존 배포 workflow는 maintenance를 자동으로 켜지 않는다. 실제 운영 반영 시 migration→수동 dry-run/검토→한 번 실행→worker 활성화 순서를 별도로 수행한다.

raw는 `AI_DIAGNOSTIC_DIR=.local/ai-captures/...`를 지정했을 때만 저장한다. 인증 헤더 및 URL의 key/token 쿼리를 제외하고 0600 권한을 사용한다. `.local`, `.env`는 Git/Docker에서 제외한다. `.env.example`에는 빈 키/기본 플래그만 둔다.

임시 채팅의 메모리 저장소는 같은 서버 프로세스의 route bundle/HMR에서 공유한다. 여러 서버 인스턴스 사이의 임시 대화 공유는 기존과 같이 지원하지 않는다. 영속 채팅은 PostgreSQL checkpoint를 사용한다.
