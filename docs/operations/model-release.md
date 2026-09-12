# 모델 관리 배포·복구 절차

5단계는 배포 직전까지의 준비다. 이 문서의 운영 명령은 아직 실행하지 않았다. main 병합, 운영 DB 변경, 운영 배포, maintenance 활성화는 별도 승인된 배포 작업이다.

## 적용 순서와 호환성

1. 실행할 commit SHA와 이전 이미지 digest를 기록한다. Production secrets/vars를 확인한다. 작업 브랜치의 Verify CI는 실제 모델 키를 사용하지 않는다.
2. maintenance와 앱의 쓰기를 중지하고 진행 중인 채팅을 종료한다. DB 및 기존 환경 설정을 백업한다.
3. 새 코드의 maintenance 도구 이미지를 빌드한다. DB migration을 실행한다. 각 SQL은 명명된 migration 폴더에 보관한다.
4. schema check가 통과하면 앱 이미지를 빌드·기동한다. 로그인, 모델 카드, 기존 워크플로우, 짧은 순차 채팅, 크레딧 정산을 smoke-test한다.
5. 운영자 모델 공개/가격과 무료 계정 allowlist를 검토한 후 필요한 모델만 활성화한다. 마지막에 maintenance profile을 명시적으로 켠다.

레지스트리 migration은 기존 workflow/preset의 legacy model_id 참조를 UUID로 바꾼다. 새 코드는 두 형식을 모두 읽지만 이전 코드는 이 변환을 이해하지 못할 수 있으므로 구 앱과 migration을 동시에 운영하지 않는다. 기존 행의 가격/공개 설정은 seed/sync가 덮어쓰지 않는다. 새 DB seed는 모델을 비공개 candidate로 넣고, 검증 없이 예전 모델을 활성화하지 않는다.

실행 결과/과금/모델 이력이 생긴 뒤에는 destructive down migration을 거절한다. 원본 main 코드로 무조건 되돌리는 대신 호환되는 이전 이미지 또는 forward-fix를 사용한다. 전체 DB backup 복원은 백업 이후 메시지·거래가 사라지므로 운영 중단 및 별도 데이터 복구 판단이 필요하다.

## 명령 예시

아래 명령의 DB 연결은 승인된 배포 환경에서 주입한다. URL/키를 명령행 인자나 로그에 출력하지 않는다. 데이터베이스 이름·백업 위치는 운영 환경에 맞춰 결정한다.

```sh
# 현재 서비스 쓰기 중단
# maintenance profile은 이미 실행 중일 때만 중지 대상이다.
docker compose -f compose.prod.yaml --profile maintenance stop agentflow-maintenance agentflow-app

# 데이터베이스 호스트에서 실행. PGPASSFILE 또는 비밀 저장소의 환경 주입 사용.
pg_dump --format=custom --file=agentflow-before-model-release.dump

# 도구 이미지부터 준비 (기본 worker는 비활성)
docker compose -f compose.prod.yaml --profile maintenance build agentflow-maintenance

# 백업과 쓰기 중단을 확인한 운영 적용 단계에서만 실행
# 아래 opt-in은 원격 migration을 허용하지만 worker를 켜지는 않는다.
docker compose -f compose.prod.yaml --profile maintenance run --rm --no-deps \
  -e MODEL_SCHEMA_MIGRATION_APPROVED=true -e AI_MAINTENANCE_ENABLED=false \
  agentflow-maintenance npm run models:release -- migrate --apply

docker compose -f compose.prod.yaml --profile maintenance run --rm --no-deps \
  -e AI_MAINTENANCE_ENABLED=false agentflow-maintenance npm run models:release -- check

docker compose -f compose.prod.yaml build agentflow-app
docker compose -f compose.prod.yaml up -d agentflow-app
```

migrate는 `model-registry → provider-history → model-maintenance → execution-billing → schema-integrity` 순서로 한 트랜잭션에서 적용한다. public schema가 완전히 비어 있으면 먼저 검토된 bootstrap DDL을 적용한다. 알 수 없는 기존 스키마에는 bootstrap을 적용하지 않는다. 이후 LangGraph SDK의 `PostgresSaver.setup()`으로 checkpoint 스키마를 맞춘다. checkpoint 단계 실패 시 다시 실행할 수 있으며 앱 시작 전 check를 수행한다.

schema-integrity는 과거 Drizzle 선언 방식에서 누락될 수 있던 출석·프리셋 연결/구매/태그의 복합 기본키를 보장한다. 기존 중복 행이 있으면 migration이 실패하며 데이터를 임의로 지우지 않는다. 중복의 의미와 거래 이력을 확인한 뒤 수동 데이터 정리 또는 forward-fix가 필요하다.

배포 workflow는 도구 이미지의 read-only schema check가 실패하면 앱 교체를 멈춘다. migration/worker 활성화는 자동으로 실행하지 않는다. 자동/수동 배포는 같은 concurrency group을 사용하고 진행 중인 배포를 취소하지 않는다.

## 과금 및 재실행

- 성공한 chat node마다 고정 가격을 한 번 청구한다. 제공사 토큰 가격과 별도 서비스 요금이다. 제목 생성과 probe는 사용자 과금이 없다.
- 전역 AI 실행 잠금을 얻은 뒤 잔액을 예약한다. 예약액은 사용 가능한 balance에서 빠지지만 totalSpent/거래 내역은 성공 확정 때만 반영한다.
- 성공 결과의 원본 메시지, 지출 거래, execution succeeded를 같은 트랜잭션으로 기록한다. 동일 확정 요청은 거래를 추가하지 않는다.
- 실패·취소·빈 답변·출력 제한 종료는 예약을 해제한다. 완료된 모델 결과는 대화 턴/노드/모델 식별자로 재사용한다. 이미 완료한 영속 대화를 다시 GET하면 저장한 답변만 반환한다.
- 대화별 세션 잠금은 동시에 들어오는 GET/POST를 차단한다. POST는 새 사용자 메시지/새 턴을 만든다. 외부 API의 POST 자체에 대한 일반적인 Idempotency-Key 지원은 이번 범위가 아니다.
- 그래프의 일부 모델 노드가 성공한 뒤 다음 노드가 실패하면 성공한 노드의 요금은 유지한다. 같은 턴 재시도는 성공 결과를 재사용하며 다시 청구하지 않는다. 문서 쓰기·검색 같은 비모델 노드의 외부 부수 효과까지 exactly-once로 보장하는 기능은 없다.
- 프로세스 비정상 종료로 남은 예약은 10분 후 회수 대상이다. 다음 실제 호출 시작 또는 maintenance의 정리 작업이 전역 AI 잠금 아래에서 회수한다. worker가 꺼져 있고 호출도 없으면 명시적으로 정리한다.

```sh
npm run models:maintenance -- reconcile-credits --apply
```

## 설정과 메모리

- 앱 runtime에 `DATABASE_URL`, 인증 설정, `GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `OLLAMA_API_KEY`를 주입한다. Secret 값은 `.env.example`에 넣지 않는다.
- Docker build argument에는 공개 설정 `NEXT_PUBLIC_ENABLE_DEV_LOGIN`만 전달한다. build에 필요한 DB 연결은 BuildKit secret mount를 사용한다. 모델/API/인증 키를 이미지 build ARG/ENV로 넘기지 않는다.
- 모델 카드의 가용성/가격/키 존재 여부는 Next `connection()` 뒤에서 요청마다 평가한다. 빌드 시 API 키가 없다고 비활성 목록을 정적 페이지에 고정하지 않는다.
- 현재 빌드는 webpack, worker 1개, webpackMemoryOptimizations, Node heap 1GiB로 제한했다. build 스크립트는 typegen과 tsc를 먼저 완료한 뒤 별도 프로세스에서 번들을 생성한다. Next가 같은 타입 검사를 다시 시작하는 것만 내부 플래그로 막아 메모리 중첩을 줄인다. 로컬 Docker 빌드는 중단했다. 최종 회귀 빌드는 GitHub hosted runner의 일반 Node 프로세스에서 실행하고, 완성한 standalone 산출물만 기존 Node 컨테이너에 마운트해 기동한다. CI도 Docker build를 실행하지 않는다. 빌드·브라우저 회귀·실호출을 겹치지 않는다.
- local Postgres: 256MiB/CPU 1, shared_buffers 32MiB. 앱: 768MiB/CPU 1, Node heap 512MiB. maintenance: 512MiB/CPU 0.5, heap 256MiB. 연결 풀은 프로세스에서 재사용하고 5개로 제한한다.
- 위 한도는 로컬 검증 설정이다. 운영 부하에 대한 용량·성능 보증은 아니며, OOM/대기열/실패율을 관측해 조정한다.

## 복구와 확인

앱 회귀 시 먼저 maintenance를 끄고 신규 호출을 멈춘다. 예약/거래/실행 상태를 확인한다. reservation이 settled이면 환불처럼 처리하지 말고 저장된 결과로 재시도한다. schema를 유지한 채 호환되는 이전 이미지로 되돌리는 것이 우선이다.

DB 복원이 필요한 경우 새 빈 DB로 먼저 복원해 schema check, 모델 UUID/가격, workflow 참조, 거래 합계를 확인하고 연결을 전환한다. 운영 DB에 덮어쓰기 복원 명령을 기본 절차로 제공하지 않는다.

```sh
pg_restore --exit-on-error --dbname=NEW_EMPTY_RECOVERY_DATABASE agentflow-before-model-release.dump
npm run models:release -- check
```

로컬 재현:

```sh
npm run test:models:release -- fresh
npm run test:models:release -- legacy
REHEARSAL_BACKUP_CONTAINER=agent-flow-postgres-1 npm run test:models:backup
```

정책/상태 상세와 무료 allowlist 절차는 [model-maintenance.md](./model-maintenance.md), 단계별 근거는 [stage-5.md](../progress/stage-5.md)를 참고한다.
