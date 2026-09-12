# 5단계 — 배포 전 검증 및 복구 리허설

작업 브랜치: `codex/model-management-stage-5`. 이 단계는 main 병합/운영 배포/운영 DB 적용/정기 worker 활성화 전까지다.

## 최종 보완

- 모델 호출 전에 크레딧을 예약하고 성공 결과·거래·실행 완료를 한 트랜잭션으로 확정한다. 실패/취소/빈 답변/출력 중단은 예약을 해제한다. 동일 실행 확정/재조회는 거래를 추가하지 않는다.
- 영속 대화의 완료 답변은 저장된 SSE로 재사용한다. 같은 턴/노드/모델의 이미 성공한 결과를 재사용해 부분 실패 후 재시도에서 중복 청구를 막는다. 대화별 GET/POST 중복 실행을 잠금으로 차단했다.
- 런타임 모델 관측을 공통 함수로 정리해 과금 작업·캐시 재사용을 실제 제공사 성공/실패로 세지 않는다. Groq 1.0.4에서 message에 빠지는 finish_reason을 보존해 length 종료를 정상 성공으로 처리하지 않는다.
- 새 빈 DB bootstrap, 기존 DB 추가 migration, read-only 배포 gate, LangGraph checkpoint setup, 과금 예약 복구 명령을 추가했다. 과거 Drizzle 복합 PK 선언을 고쳐 새 설치에서 출석/프리셋 구매의 중복 방지가 누락되지 않게 했다.
- seed는 새 모델을 비공개 candidate로 등록한다. 기존 행의 운영자 가격/숨김은 유지한다.
- Docker build의 실제 API/인증 키 ARG/ENV 전달을 제거했다. 필요한 DB 연결만 BuildKit secret mount로 전달한다. 모델 카드/가용성은 요청 시점에 조회해 빌드 때 키가 없는 상태를 고정하지 않는다.
- 빌드·앱·Postgres·maintenance에 메모리/CPU 상한을 적용했다. webpack worker 1개와 memory optimization을 사용하고 타입 검사 프로세스를 먼저 종료한 뒤 번들 빌드를 수행한다.

## 검증 기록

- 타입 검사, ESLint, unit/integration, 기존 registry/history/queue/maintenance 검증 통과.
- 새 DB와 기존 구조 DB 모두 migration 반복→seed 반복→catalog dry-run/apply→빈 billing rollback→forward migration 통과. 기존 workflow 참조·모델 가격 보존 확인.
- DB 과금 검증: 잔액 부족 거절, 실패 환불 1회, 동일 execution 재예약, 동시 확정 시 receipt 1건, 성공 결과 재사용, 데이터 존재 시 destructive rollback 거부, 만료 예약 회수 통과.
- PostgreSQL custom-format pg_dump→새 DB pg_restore 후 schema/모델 ID/가격 보존 확인. 실제 운영 데이터를 복원하거나 덮어쓰지 않았다.
- 실제 서버 경로를 사용하는 browser replay: 성공/503/빈 응답/length/취소, 동시 GET/POST, 임시/영속 재열기, 제목 과금 제외, 잔액 부족 선차단 통과.
- 전체 E2E에서 기존의 로딩 전 count 분기, 숨은 검색창 선택, 오래된 X-CANVAS-ID 명칭, 키보드/링크 선택 대기 문제를 수정했다. 최종 browser/build/live 결과는 아래 완료 기록으로 확정한다.

## 메모리 관련 기록

초기 Turbopack 빌드가 2GiB 상한에서 반복 reclaim을 일으켜 해당 builder만 중단했다. webpack 컴파일 자체는 통과했으나 이어지는 타입 검사와 메모리가 겹쳐 빌드 프로세스가 제한에 의해 종료됐다. 상한을 올리지 않고 타입 검사와 번들 빌드를 별도 순차 프로세스로 분리했다. Docker daemon 및 다른 프로젝트 컨테이너는 종료하지 않았다.

사용자의 메모리 압박 지적 후 로컬 builder를 중단/제거했고, Docker 빌드 방식 자체를 중단했다. 최종 빌드는 GitHub hosted runner에서 일반 Node 프로세스로 수행하며, 컨테이너는 빌드된 산출물을 기동하는 데만 사용한다. 로컬 Docker 빌드는 더 실행하지 않는다.

현재 설정: local Postgres 256MiB/CPU 1, app 768MiB/CPU 1, maintenance 512MiB/CPU 0.5. maintenance는 기본 비활성이다. 이 수치는 메모리 폭주 방지 상한이며 실운영 부하 용량 보증은 아니다.

## 설정 확인

GitHub API로 Secret 이름과 공개 설정만 확인했다. 저장소 Secret에 OLLAMA_API_KEY, Production Secret에 GOOGLE_AI_API_KEY/GROQ_API_KEY/인증·DB·SSH 설정이 존재한다. Production NEXT_PUBLIC_ENABLE_DEV_LOGIN=false. Secret 값은 읽거나 출력하지 않았다. 실행 가능한 Staging 환경의 별도 배포 리허설은 수행하지 않았다.

## 활성화 검토 범위

신규 Google 4종: gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemma-4-26b-a4b-it, gemma-4-31b-it.
Ollama 3종: gpt-oss:20b, gpt-oss:120b, gemma4:31b.
기존 Groq 회귀: openai/gpt-oss-20b, openai/gpt-oss-120b.
Groq 후보: qwen/qwen3.6-27b, qwen/qwen3.8-27b. ALLaM은 공식 무료 구간 확인이 없어 무료 후보에서 제외했다.

호환성 성공과 계정 무료 자격은 다르다. 무료 계정/크레딧 구매 여부 확인을 대신하지 않는다. 검증되지 않은 자동 발견 모델은 candidate로 유지하고, 실패한 모델은 최종 smoke 결과에서 구분한다. worker 활성화 전에 무료 allowlist와 만료일을 검토한다.

## 운영에 남긴 경계

- 운영 승인 시 백업→쓰기 중단→migration→schema check→앱 기동→순차 smoke→worker opt-in 순으로 수행한다.
- 새 사용자 POST는 새 대화 턴이다. 일반적인 외부 HTTP Idempotency-Key 및 문서/검색 등 모든 비모델 부수 효과의 exactly-once는 이번 범위가 아니다.
- 임시 대화 메모리는 단일 프로세스 범위이며, 다중 앱 인스턴스 간 공유는 지원하지 않는다. 세션형 PostgreSQL advisory lock을 사용하므로 transaction pooling은 지원하지 않는다.
- 48시간 실패는 suspended이며 은퇴는 공식 종료 또는 목록/응답 증거가 필요하다. 자동 발견과 provider quota를 무료/은퇴 판정으로 혼동하지 않는다.

[배포·복구 명령](../operations/model-release.md) · [모델 유지 관리](../operations/model-maintenance.md)

공식 구현 근거: [Docker build secrets](https://docs.docker.com/build/building/secrets/), [builder 자원 제한](https://docs.docker.com/build/builders/drivers/docker-container/), [Next connection](https://nextjs.org/docs/app/api-reference/functions/connection).

## 최신 실제 모델 검증

현재 adapter로 Google 4종/Ollama 3종의 invoke·저장/복원한 이력·공통 SSE를 재검증했고 모두 통과했다. Groq GPT OSS20B/120B는 invoke·stream·후속 대화 및 finish_reason=stop 보존을 확인했다. Qwen3.6/3.8 후보도 이력/SSE까지 통과했다. 실제 호출은 모두 순차였으며 로컬 Node heap을 256MiB로 제한했다.

- Google/Ollama: `.local/ai-captures/onboarding-1789243101139`
- Groq GPT OSS: `.local/ai-captures/groq-release-1789243280397`
- Qwen 후보: `.local/ai-captures/candidates-1789243339336`

실제 네트워크 adapter 계약 검증과 DB/과금의 mock-provider 서버 검증을 분리했다. 원본 응답·키·쿠키는 Git에 넣지 않았다.
