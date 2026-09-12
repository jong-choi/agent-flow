# 5단계 — AI 모델 관리 검증

기준: 4단계 완료 커밋 `025ad35`. 범위는 모델 레지스트리·호출 호환성·호출 상태 관측·은퇴 관리다.

## 남긴 모델 관련 변경

- Groq 1.0.4 adapter가 generationInfo에 두는 finish_reason을 메시지에도 보존해, length 종료를 정상 답변으로 오인하지 않게 한다. 일반/스트리밍 계약을 fixture와 실호출로 확인했다.
- provider 호출 관측을 분리하고 취소가 완료보다 먼저 확정된 호출을 성공으로 기록하지 않는다.
- Groq adapter 버전을 1.0.4로 고정한다. 실호출 진단도 production adapter와 공통 capture를 사용한다.
- seed의 기존 운영자 설정 보존은 유지한다. 신규 모델은 candidate로 삽입하고, 초기 Google/Ollama 모델과 Qwen 후보 및 제목 우선순위 기본값을 등록한다.

## 되돌린 범위 확장

테스트 실패만으로 추가했던 검색 처리 변경·입력 비활성화·hydration hook을 전부 원복했다. 기존 일반 UI 테스트, 빌드 설정, 배포/CI 파이프라인도 4단계 상태로 돌렸다. 새 과금 예약·세션 잠금·전체 앱 bootstrap/복합키 변경 역시 이 단계에서 제외했다.

Git 이력 확인:
- `36758a9`: 채팅 입력을 의도적으로 uncontrolled로 전환.
- `356aaa6`: 메시지 큐 및 스트리밍 중 입력 처리 추가.
- `87a97c5`: 검색 시 cursor/dir 초기화 의도.
- `9e095b3`, `7d901f0`: 문서·프로필 E2E 작성 시점.
- `cc84f54`: 이후 적용된 Suspense/fallback 변경.

오래된 테스트의 선택자/대기 문제를 제품 버그로 단정했던 설명은 철회한다. 기존 UI 동작을 바꾸어 테스트를 맞추지 않는다. 추가 CI/E2E 배포 차단 조건은 없다.

## 실제 모델 확인

Google 4종/Ollama 3종의 invoke·저장/복원한 이력·공통 SSE를 순차 재검증했고 통과했다. Groq GPT OSS20B/120B는 invoke·stream·후속 대화 및 finish_reason=stop을 확인했다. Qwen3.6/3.8 후보도 이력/SSE까지 통과했다.

- Google: gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemma-4-26b-a4b-it, gemma-4-31b-it
- Ollama: gpt-oss:20b, gpt-oss:120b, gemma4:31b
- Groq: openai/gpt-oss-20b, openai/gpt-oss-120b
- Groq 후보: qwen/qwen3.6-27b, qwen/qwen3.8-27b

raw는 Git에 포함하지 않았다:
- `.local/ai-captures/onboarding-1789243101139`
- `.local/ai-captures/groq-release-1789243280397`
- `.local/ai-captures/candidates-1789243339336`

호환성 성공과 무료 계정 자격은 별개다. ALLaM은 공식 무료 구간 확인이 없어 무료 후보에서 제외했다. 운영 배포/운영 DB 적용/worker 활성화는 하지 않았다.

[모델 반영 메모](../operations/model-release.md) · [상태/은퇴 정책](../operations/model-maintenance.md)

## 최종 로컬 확인

범위를 줄인 후 모델 관련 테스트 56개, 타입 검사, 기존 registry/history/maintenance/queue 검증이 통과했다. 원래 `npm run build`(Next 기본 빌드)도 설정 우회 없이 통과했다. 일반 UI·과금·CI·배포 설정은 `025ad35`와 동일하다.
