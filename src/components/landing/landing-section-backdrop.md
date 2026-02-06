# Landing Section Backdrop 튜닝 메모

`grid-waving` 배경을 더 크게 보이게 하거나, 더 역동적으로 보이게 하거나, 가독성을 높이고 싶을 때 조정할 포인트를 정리한 문서입니다.

## 1) `grid-wave-weave` 전체 위빙 진폭 키우기

파일: `src/components/landing/landing-section-backdrop.module.css` (`@keyframes grid-wave-weave` 주변)

- `translate3d(...)`의 `%` 절댓값을 키웁니다.
- `scaleX(...)`의 최소/최대 차이를 더 벌립니다.
- `skewY(...)` 각도를 현재보다 더 크게 줍니다. (예: `+-0.4deg`보다 크게)

효과: 격자 전체가 좌우로 더 크게 흔들려 회전 착시가 강해집니다.

## 2) `grid-dot-wave` 점 개별 파동 키우기

파일: `src/components/landing/landing-section-backdrop.module.css` (`@keyframes grid-dot-wave` 주변)

- `var(--gw-x)`, `var(--gw-y)`에 곱해지는 계수의 절댓값을 키웁니다.
- 현재 사용 중인 대표 계수: `-0.8`, `-0.92`, `0.62`, `-0.42`
- 이 값들의 절댓값을 올리면 점 이동량이 커집니다.

효과: 점 단위 파동이 커져서 입체감이 더 강해집니다.

## 3) 원본 진폭(`ampX`, `ampY`) 키우기

파일: `src/components/landing/landing-section-backdrop.tsx` (`variant === "grid-waving"` 내부)

- `ampX`, `ampY` 값을 키웁니다.
- 이 값들은 CSS 변수(`--gw-x`, `--gw-y`)로 전달되어 실제 점 이동량을 결정합니다.

효과: 파동의 전체 폭/높이가 즉시 커집니다.

## 4) 배경 전체를 더 크게 렌더링하기 (`.layer`)

파일: `src/components/landing/landing-section-backdrop.module.css` (`.layer`)

- `inset`을 더 음수로 조정해 커버리지를 늘립니다.
- 예시: `-12% -> -18%` 또는 `-20%`
- `width`/`height`를 `124%`에서 `136% ~ 140%`로 키웁니다.

효과: 배경이 줌인된 것처럼 더 크게 보입니다.

## 5) `grid-waving`만 따로 확대하기

파일: `src/components/landing/landing-section-backdrop.module.css` (`@keyframes grid-wave-surface-drift` 주변)

- `from`/`to` 양쪽 `transform`에 `scale(...)`을 추가합니다.
- 권장 범위: `scale(1.1) ~ scale(1.15)`
- 루프 경계에서 튐이 없도록 `from`/`to` 모두에 일관되게 넣습니다.

효과: 다른 variant는 그대로 두고 `grid-waving`만 확대할 수 있습니다.

## 6) `infinite-nodes`는 `.layer`가 아니라 `.trackLayer` 사용

관련 파일:

- `src/components/landing/landing-section-backdrop.tsx`
- `src/components/landing/landing-section-backdrop.module.css`

- `infinite-nodes`는 `.trackLayer` 기반으로 렌더링됩니다.
- 해당 variant를 확대하려면 `.trackLayer` 또는 해당 variant 전용 transform을 수정해야 합니다.
- `.layer`만 수정하면 `infinite-nodes`에는 적용되지 않습니다.

## 7) 점 자체 크기 키우기

파일: `src/components/landing/landing-section-backdrop.tsx` (`variant === "grid-waving"` 내부)

- 원 반지름 `r="1.35"` 값을 필요에 맞게 올립니다.

효과: 파동/불투명도를 올려도 점이 약하게 보일 때 가시성이 좋아집니다.
