# 2단계 — 모델 레지스트리·카드·가격

2026-09-13. 브랜치 codex/model-management-stage-2. 운영 DB/배포/주기 작업은 변경하지 않음.

## 완료
- 내부 UUID와 제공사 upstream ID 분리. 기존 modelId alias 조회 유지, 알려진 chatNode 참조 UUID 마이그레이션.
- lifecycle/entitlement/health/운영 공개 상태 분리. 미존재/은퇴/비공개 모델도 기존 참조를 해석하거나 placeholder 표시.
- 수집 사양과 운영 설정 저장 경로 분리. seed는 최초 insert만 수행하고 catalog upsert는 운영 가격/이름/순서/공개 상태를 보존.
- CLI로 카드 설명·가격·순서·입출력 제한 수정. 신규 카탈로그는 비공개 후보로만 등록.
- 캔버스/노드 패널 공통 ModelSelect 카드: 제공사, 가격, 상태, 서비스 제한, 제공사 컨텍스트 구분.
- 영속/임시 채팅 가격 계산이 UUID/alias를 모두 처리. 알 수 없거나 사용할 수 없는 모델을 0크레딧으로 오표시하지 않음.
- 실행별 모델·가격·제한 snapshot 저장 및 실제 upstreamModelId 호출. 기존 metadata.maxOutputTokens는 운영 제한 호환 fallback으로 보존.

## 검증
- 단위/통합 테스트 126개 통과.
- TypeScript 및 ESLint 통과.
- 독립 PostgreSQL fixture: migration 2회, rollback, reapply; node 위치/edge/preset/chat 관계 유지; 미존재 참조/다른 노드 텍스트 유지.
- provider가 다른 동일 upstream ID를 별도 UUID로 보존하고 동일 catalog 재반영 시 UUID가 유지됨.
- seed 2회 및 catalog/부분 metadata 재반영 후 운영 가격·이름·순서·공개 상태·제한 보존.
- 기존 데이터 복구 가능한 상태에서는 rollback 성공, 새 모델/실행 이력 존재 시 파괴적 rollback 거부.
- Chromium 카드 E2E: legacy 참조 표시, 가격 7→9 및 이름 변경 후 reload 반영, 은퇴 모델 선택 차단, 미존재 모델/가격 확인 필요 표시.
- 기존 영속 채팅 SSE/재열기 E2E와 로그인/랜딩 회귀 확인. 브라우저 합성 E2E는 외부 모델을 호출하지 않음.
- 실제 Groq20B/120B 각각 2턴 순차 호출. 20B는 alias, 120B는 UUID 노드로 실행. SSE=저장 답변, 정상 재열기 확인.
- 각 모델 첫 턴은 DB AI 잠금을 잡아 대기시킨 뒤 운영 가격을 변경. 실제 완료/차감까지 변경 가격을 유지해도 시작 당시 가격으로 snapshot/차감됨을 검증. 이후 원래 가격 복원.
- raw 및 로컬 실행 기록은 .local/ai-captures/stage2-1789230463784에 보존하며 Git/Docker 제외.

## 후속 범위
- 신규 Ollama/Google 모델 활성화와 adapter 교체는 3단계.
- 자동 무료 판정/주간 동기화/장애 상태 전이/대체 UX 완성은 4단계.
- 전체 운영 마이그레이션/backup/배포/복구 리허설 및 credit reservation은 5단계.
- 현재 쓰기 관리 명령은 로컬 DB로 제한. 운영 절차는 docs/operations/model-registry.md 참고.
