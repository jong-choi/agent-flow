# 배포 가이드 (인수인계용)

> 대상: 이 프로젝트를 새로 인수받는 개발자/운영자  
> 기준 소스: `compose.prod.yaml`, `prod.Dockerfile`, `.github/workflows/*`

## 1. 문서 목적

이 문서는 현재 저장소 기준으로 실제 배포가 어떻게 동작하는지, 어떤 환경변수가 필요한지, 초기 배포/재배포/로컬 검증을 어떻게 해야 하는지 한 번에 정리한 운영 문서다.

핵심 목표:

1. 배포 실패를 줄인다.
2. 운영자 교체 시 지식 손실을 줄인다.
3. ENV 누락/오입력으로 인한 장애를 줄인다.

---

## 2. 현재 배포 구조 요약

현재 배포는 다음 구조로 동작한다.

1. Next.js는 `output: "standalone"`로 빌드한다.
2. Docker 멀티스테이지 빌드로 런타임 이미지를 만든다.
3. `docker compose`로 `postgres` + `agent-flow` 두 서비스를 올린다.
4. GitHub Actions가 VPS에 SSH 접속해 `docker compose`를 실행한다.
5. 자동 배포와 수동 배포 워크플로우를 모두 제공한다.

관련 파일:

- `next.config.ts`
- `prod.Dockerfile`
- `compose.prod.yaml`
- `.github/workflows/deploy-on-version-bump.yml`
- `.github/workflows/manual-deploy.yml`

---

## 3. 사전 준비

## 3.1 로컬 준비

1. Docker Desktop 설치 및 실행
2. Node.js 20 계열 권장
3. npm 사용(`package-lock.json` 기준)

## 3.2 VPS 준비

1. Docker Engine + Docker Compose Plugin 설치
2. SSH 접속 가능 계정 준비
3. GitHub 저장소를 clone 가능한 네트워크/권한

## 3.3 GitHub 준비

1. `Production` Environment 생성
2. 아래 ENV 매트릭스 기준으로 `Secrets`/`Variables` 등록

---

## 4. 환경변수 매트릭스

## 4.1 필수 Secrets (GitHub Environment Secrets)

| 키                      | 설명                 | 사용 위치          |
| ----------------------- | -------------------- | ------------------ |
| `VPS_HOST`              | 배포 대상 서버 주소  | GitHub Actions SSH |
| `VPS_USER`              | SSH 사용자명         | GitHub Actions SSH |
| `VPS_SSH_KEY`           | SSH 개인키           | GitHub Actions SSH |
| `POSTGRES_PASSWORD`     | Postgres 비밀번호    | compose `postgres` |
| `AUTH_GOOGLE_SECRET`    | Google OAuth secret  | 앱 런타임          |
| `AUTH_SECRET`           | Auth.js secret       | 앱 런타임          |
| `DATABASE_URL`          | 앱 DB 연결 URL       | 앱 런타임/빌드     |
| `TEST_PASSWORD`         | dev login 비밀번호   | 앱 런타임          |
| `GOOGLE_AI_API_KEY`     | Google AI 키         | chat node          |
| `GOOGLE_SEARCH_API_KEY` | Google Search API 키 | search node        |
| `NAVER_CLIENT_SECRET`   | Naver 검색 secret    | search node        |
| `BRAVE_API_KEY`         | Brave 검색 키        | search node        |
| `SEARXNG_API_KEY`       | SearXNG API 키       | search node        |
| `GROQ_API_KEY`          | Groq API 키          | chat model         |

참고:

- `DATABASE_URL`이 비어 있으면 워크플로우에서 자동 생성한다.
- 자동 생성 규칙: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@agent-flow-postgres:5432/${POSTGRES_DB}`

## 4.2 필수 Variables (GitHub Environment Variables)

| 키                             | 설명                          | 사용 위치          |
| ------------------------------ | ----------------------------- | ------------------ |
| `POSTGRES_DB`                  | DB 이름 (기본 `agent_flow`)   | compose `postgres` |
| `POSTGRES_USER`                | DB 사용자 (기본 `agent_flow`) | compose `postgres` |
| `AUTH_GOOGLE_ID`               | Google OAuth client id        | 앱 런타임          |
| `AUTH_URL`                     | Auth URL                      | 앱 런타임          |
| `BASE_URL`                     | 앱 기본 URL                   | 앱 런타임          |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | dev login 토글                | 앱 런타임          |
| `GOOGLE_SEARCH_CX`             | Google CSE id                 | search node        |
| `NAVER_CLIENT_ID`              | Naver 검색 id                 | search node        |
| `SEARXNG_BASE_URL`             | SearXNG 엔드포인트            | search node        |

## 4.3 선택 변수

| 키         | 설명              | 기본값 |
| ---------- | ----------------- | ------ |
| `APP_PORT` | 앱 외부/내부 포트 | `3063` |

## 4.4 로컬 `.env` 작성 규칙

1. `KEY=value` 형태만 사용 (`KEY = value` 금지)
2. 공백/따옴표 처리 일관성 유지
3. 민감값은 절대 커밋 금지

---

## 5. 최초 배포 절차 (VPS 수동)

아래는 VPS에서 직접 배포하는 기준 절차다.

```bash
cd ~/agent-flow
git fetch --prune origin main
git reset --hard origin/main

# DB 먼저
docker compose -f compose.prod.yaml up -d postgres

# 앱 빌드 및 기동
docker compose -f compose.prod.yaml build --pull agent-flow
docker compose -f compose.prod.yaml up -d --remove-orphans agent-flow

# 정리
docker image prune -f
```

검증:

```bash
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs --tail=200 agent-flow
docker compose -f compose.prod.yaml logs --tail=200 postgres
```

---

## 6. 자동 배포 (버전 업 기반)

파일: `.github/workflows/deploy-on-version-bump.yml`

동작:

1. `main` push 트리거
2. `package.json`의 `version`이 직전 커밋보다 상승했는지 확인
3. 상승했을 때만 배포 job 실행
4. VPS에서 `postgres` 선기동 후 `agent-flow` 빌드/기동

주의:

1. 버전을 올리지 않으면 자동 배포되지 않는다.
2. 긴급 배포는 수동 배포 워크플로우를 사용한다.

---

## 7. 수동 배포 (브랜치 선택)

파일: `.github/workflows/manual-deploy.yml`

동작:

1. `workflow_dispatch`로 실행
2. `branch` 입력값 브랜치 배포
3. `confirm_deploy=deploy` 입력해야 실행
4. 자동 배포와 동일하게 `postgres` -> `agent-flow` 순서로 배포

---

## 8. 로컬 검증 가이드

## 8.1 DB만 검증

```bash
export POSTGRES_DB=localdb
export POSTGRES_USER=local
export POSTGRES_PASSWORD=1234
export DATABASE_URL=postgresql://local:1234@agent-flow-postgres:5432/localdb

docker compose --env-file .env -f compose.prod.yaml up -d postgres
docker compose --env-file .env -f compose.prod.yaml ps postgres
docker exec -it agent-flow-postgres psql -U local -d localdb -c "select current_database(), current_user;"
```

## 8.2 앱+DB 로컬 실행

```bash
BASE_URL=http://localhost:3063 \
AUTH_URL=http://localhost:3063 \
POSTGRES_DB=localdb \
POSTGRES_USER=local \
POSTGRES_PASSWORD=1234 \
DATABASE_URL=postgresql://local:1234@agent-flow-postgres:5432/localdb \
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false \
docker compose --env-file .env -f compose.prod.yaml up -d --build --force-recreate
```

## 8.3 앱만 실행 (외부 DB 사용)

```bash
BASE_URL=http://localhost:3063 \
AUTH_URL=http://localhost:3063 \
DATABASE_URL=postgresql://<external-user>:<password>@<host>:<port>/<db> \
POSTGRES_PASSWORD=dummy \
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false \
docker compose --env-file .env -f compose.prod.yaml up -d --build --no-deps --force-recreate agent-flow
```

---

## 9. Drizzle 운영 원칙

중요: DB 컨테이너 생성과 스키마 반영은 다른 작업이다.

1. DB 컨테이너 생성: `docker compose ... up -d postgres`
2. 스키마 반영: `npm run db:push` (운영에서는 수동 실행 권장)

권장:

1. 앱 배포와 `db:push`를 분리한다.
2. 스키마 변경 PR마다 운영 반영 체크리스트를 둔다.

---

## 10. 트러블슈팅

## 10.1 `ERR_TOO_MANY_REDIRECTS`

원인 후보:

1. `BASE_URL`/`AUTH_URL` 포트 불일치 (`3000` vs `3063`)
2. 기존 쿠키(`authjs.callback-url`) 잔존

---

## 11. 정리/복구 명령어

```bash
# 컨테이너/네트워크 정리
docker compose --env-file .env -f compose.prod.yaml down --remove-orphans

# 볼륨까지 삭제 (DB 데이터 삭제)
docker compose --env-file .env -f compose.prod.yaml down -v --remove-orphans

# 로컬 빌드 이미지 제거
docker compose --env-file .env -f compose.prod.yaml down --rmi local --remove-orphans

# 미사용 이미지 정리
docker image prune -f
```
