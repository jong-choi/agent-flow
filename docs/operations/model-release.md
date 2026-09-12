# 모델 관리 반영 메모

범위는 모델 레지스트리, provider adapter, 호출 관측과 은퇴 처리다. 기존 UI, 과금 처리, 빌드 명령과 배포 파이프라인을 변경하지 않는다. 별도의 CI/E2E 통과 조건을 배포에 추가하지 않는다.

## 모델 스키마와 설정

모델 관련 migration은 기존의 다음 세 명령을 사용한다. 운영 적용은 아직 하지 않았다. 적용 시에는 DB 백업 및 기존 코드와의 호환 순서를 먼저 검토한다.

```sh
npm run models -- migrate up
npm run models -- history-migrate up
npm run models -- maintenance-migrate up
```

레지스트리 migration은 모델의 provider/upstream ID와 기존 workflow 참조를 보존한다. provider-history는 서버에서 사용할 원본 메시지 필드, maintenance는 모델 점검 상태를 추가한다. 모델 이력이나 실행 데이터가 생긴 뒤의 destructive down migration은 기존 guard를 따른다.

seed는 기존 운영자 설정을 덮어쓰지 않는다. 새로 삽입하는 모델은 candidate로 두고, 검증과 공개 여부 결정을 거쳐 사용한다. Google/Ollama 초기 모델의 thinkingLevel 및 제목 모델 우선순위도 초기값으로만 넣는다.

```sh
npm run models -- list
npm run models:maintenance -- sync groq --discover
npm run models:maintenance -- status
```

sync 기본값은 dry-run이다. 무료 계정 확인과 worker 활성화는 [model-maintenance.md](./model-maintenance.md)의 기존 절차를 따른다. API 호출 성공을 무료 계정 증명으로 간주하지 않는다.

## 로컬 모델 검증

실호출은 전역 순차 실행기를 사용하며 raw는 `.local`에만 저장한다.

```sh
RUN_AI_LIVE=1 npm run models:onboard
RUN_AI_LIVE=1 npm run test:ai:live
RUN_AI_LIVE=1 AI_CANDIDATE_MODELS=qwen/qwen3.6-27b,qwen/qwen3.8-27b npm run test:ai:candidates
```

모델 관련 기존 검증 명령:

```sh
npm run test:ai:queue
npm run test:models:registry
npm run test:ai:history
npm run test:models:maintenance
```

이는 변경 확인을 위한 명령 목록이며 새로운 배포 차단 조건이 아니다. 실운영 배포/DB 적용은 이 작업에서 실행하지 않았다.
