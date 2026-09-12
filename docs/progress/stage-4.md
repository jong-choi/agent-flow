# 4단계 — 모델 유지 관리·기존 연결 보호

2026-09-13. 작업 브랜치: `codex/model-management-stage-4`. 운영 DB/배포/상주 worker는 변경하지 않았다.

## 변경

공식 catalog 수집→검증/변경 계획→DB 적용을 분리하고 주간 발견/일일 등재 확인을 추가했다. 실제 모델 호출과 제목 생성에 health 관측을 연결했다. 제공사 장애, 모델 quota, 요청 크기 오류, 인증, 취소를 구분하며 cooldown/복구/48시간 suspended/증거 기반 retirement를 구현했다.

작업 스케줄·lease·probe 예산·무료 계정 증거·점검 결과를 DB에 보존한다. worker 프로세스 간 중복 및 전체 실제 AI 동시 호출을 별도 PostgreSQL 세션 잠금으로 막는다. 스케줄러는 기본 비활성이다.

그래프 시작 전에 모든 모델 가용성을 검증하고 실행 모델/가격/상한 snapshot을 고정한다. 기존 UUID/legacy 연결은 유지하고 모델 선택기에 종료 사유·다음 점검·추천 모델·워크플로우 전체 교체를 추가했다. 실제 임시 채팅 검증에서 드러난 route/HMR별 메모리 저장소 분리도 수정했다.

## 추가 요청: Groq 무료 후보와 Gemini 3.1

공식 문서와 해당 계정 실제 응답을 2026-09-13에 확인했다.

| 모델 | 공식 컨텍스트 / 출력 | 실호출 결과 | 로컬 등록 |
| --- | --- | --- | --- |
| Google gemini-3.1-flash-lite | 입력 1,048,576 / 출력 65,536 | invoke, signed history, SSE, 실제 영속 채팅 2턴, high 통과 | active, 4 credits, 앱 출력 4,096 |
| Groq qwen/qwen3.6-27b | 131,072 / 16,384 | minimal(none), default, 이력/SSE 통과 | 비공개 무료 후보, 15 credits, 앱 출력 512 |
| Groq qwen/qwen3.8-27b | 131,042 / 16,384 | minimal(none), high, 이력/SSE 통과 | 비공개 무료 후보, 20 credits, 앱 출력 512 |
| Groq allam-2-7b | 4,096 / 4,096 | 단일 호출 통과 | 무료 후보에서 제외: 현재 공식 무료 한도표에 없음 |

크레딧은 서비스의 고정 정책이며 공급자 토큰 가격과 다르다. 모든 실호출은 순차 수행했다. 공식 무료 구간이 존재하더라도 현재 키의 과금 플랜이 확인된 것으로 처리하지 않는다. entitlement는 unknown으로 남긴다. Qwen은 Preview이므로 교체 후보를 늘리는 것과 별개로 지속 점검해야 한다.

Qwen 3.6은 이 계정에서 출력 1,024 예약이 OTPM 1,000 한도를 넘어 429가 발생했다. 512로 줄여 invoke/SSE를 통과했다. 응답 body의 오류 형태와 계정별 OTPM을 근거로 oversized request를 장애/은퇴 집계에서 제외했다. 공식 공통 free table(30 RPM, 1K RPD, 8K TPM, 200K TPD)만으로 계정 세부 한도를 단정할 수 없다.

ChatGroq 1.0.4는 reasoningFormat 필드를 선언하지만 constructor에서 초기화하지 않고 reasoningEffort 옵션도 제공하지 않는다. Qwen 전송부에서 `reasoning_format=parsed`, minimal→`reasoning_effort=none`을 넣고 body 변경 시 SDK의 기존 Content-Length를 제거했다. 최종 답변/SSE에 `<think>`가 섞이지 않는지 검증했다. raw reasoning은 진단 파일에 남지만 현재 ChatGroq가 AIMessage로 변환할 때 reasoning 필드를 보존하지 않는 제한은 유지한다. Google은 현재 native generateContent 경로로 실검증했으며 이번에 Interactions API로 변경하지 않았다.

공식 근거:
- [Groq 지원 모델](https://console.groq.com/docs/models), [무료 한도/헤더](https://console.groq.com/docs/rate-limits), [추론 형식](https://console.groq.com/docs/reasoning)
- [Qwen 3.6](https://console.groq.com/docs/model/qwen/qwen3.6-27b), [Qwen 3.8](https://console.groq.com/docs/model/qwen/qwen3.8-27b), [ALLaM](https://console.groq.com/docs/model/allam-2-7b)
- [Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), [가격표](https://ai.google.dev/gemini-api/docs/pricing), [모델별 추론 옵션](https://ai.google.dev/gemini-api/docs/gemini-3)

## 자동 검증

- 단위/통합 146개, 타입 검사, ESLint 통과.
- 별도 DB registry/history/maintenance 및 프로세스 간 순차 큐 검증 통과.
- maintenance Docker 이미지 빌드 및 Node22 앱 production build 통과.
- production 서버에서 관련 브라우저 E2E 6개 통과(로그인·랜딩·영속 SSE·모델 카드·은퇴 교체).
- 로컬 Docker 중단 중 한 차례 DB 의존 build/E2E가 실패해 Docker 복구 후 재검증했다. Postgres 256 MiB/CPU 1, maintenance 512 MiB/CPU 0.5로 제한했고 이후 무거운 검증은 순차로 수행했다. Postgres 재시작 직후 실측 약 37 MiB.

## 검증 근거

- 공식 catalog 순차 적용: Google 55개, Groq 14개, Ollama 20개 ID 확인. 일반 채팅이 아닌 이미지/TTS/음성/안전 분류/compound 등은 신규 채팅 후보에서 제외. 등록과 실제 활성화는 별개다.
- Google Gemini3.5, Groq GPT OSS20B, Ollama GPT OSS20B의 실제 probe 성공이 DB source=probe에 저장됨.
- worker 한 번 실행: catalog:google:daily 완료 및 다음 일정/lease 해제 확인.
- 별도 테스트 DB: migration, cooldown/복구, 모델/제공사 quota, 수동 숨김 보존, dry-run 무변경, 잘못된 catalog 거부, 48시간 retirement 증거, 무료 증거 만료, 일일 예산 10회, worker 중복 및 stale lease 회수 검증.
- 브라우저 E2E: 은퇴 참조 2개(UUID와 legacy)를 한 번에 교체·저장·reload, edge 보존. 은퇴 모델 실행 시 upstream 시작/실행 snapshot 없음 확인.
- 실제 임시 채팅: 은퇴 모델 실행 차단/0차감→Gemini3.1로 교체→정상 SSE/20분 응답→runtime 점검 기록→4 credits 차감 확인.

raw와 테스트 로그는 `.local`에만 저장:
- `.local/ai-captures/stage4-catalog-*`, `stage4-probe-*`, `stage4-worker-once`
- `.local/ai-captures/candidates-1789237879041` (Gemini 성공 및 최초 Groq transport 진단)
- `.local/ai-captures/candidates-1789237925314` (Qwen3.8 성공, Qwen3.6 OTPM 오류)
- `.local/ai-captures/candidates-1789237987309` (Qwen3.6 재검증 성공)
- `.local/ai-captures/stage4-extra-1789238135853` (추론 수준/ALLaM)
- `.local/ai-captures/stage3-app-1789238063784` (Gemini3.1 영속 2턴)
- `.local/ai-captures/stage4-preflight-1789238276582` (차단→교체→실행)

운영 명령/제약은 [model-maintenance.md](../operations/model-maintenance.md)에 정리했다. 운영 적용 전 계정 무료 allowlist 확인, 운영 migration/dry-run 검토, 종료 공지 검토 및 worker 활성화가 남는다(5단계 배포 전 점검 대상).
