## VS Code 설정 가이드

### `.vscode/settings.json`

`files.associations["*.css"] = "tailwindcss"` : vscode unknown at rules 문제를 해결하기 위해 추가된 설정
`"editor.defaultFormatter"`, `"editor.formatOnSave"` : prettier를 기본 포맷터로 지정하기 위한 설정

### `.prettierrc`

`plugins` : tailwind 클래스명을 정렬하는 `prettier-plugin-tailwindcss`와 임포트 경로를 정렬하는 `@trivago/prettier-plugin-sort-imports`
`tailwindStylesheet` : tailwind 4와 호환을 위한 경로 지정
