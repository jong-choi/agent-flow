const message = {
  meta: {
    developerApiTitle: "개발자 API",
    workflowApiTitle: "워크플로우 API",
  },
  common: {
    noDescription: "설명이 없습니다.",
    copy: "복사",
    cancel: "취소",
    toasts: {
      copied: "복사되었습니다.",
      deleted: "삭제되었습니다.",
      deleteFailed: "삭제에 실패했습니다.",
    },
  },
  indexPage: {
    heading: "Developer API",
    description:
      "서비스 키를 발급하고 워크플로우를 외부에서 실행할 수 있습니다.",
    workflowApiButton: "워크플로우 API",
    secretCardTitle: "서비스 키",
    secretCardDescription:
      "API 호출 시 <code>X-CANVAS-SECRET</code> 헤더로 전달합니다. 키는 발급 시 1회만 노출됩니다.",
    guidesCardTitle: "Developer API 사용 가이드",
    openAiGuideTitle: "OpenAI 호환 가이드",
    openAiGuideDescription:
      "OpenAI SDK/클라이언트에서 바로 호출하는 방법",
    agentflowGuideTitle: "AgentFlow API 가이드",
    agentflowGuideDescription:
      "/api/v1/chat (X-CANVAS-SECRET + X-CANVAS-ID)",
  },
  apisPage: {
    heading: "워크플로우 API",
    description:
      "워크플로우별 <code>X-CANVAS-ID</code>를 발급하고 호출 코드를 복사합니다.",
    serviceKeysButton: "서비스 키 관리",
  },
  secretManager: {
    empty: "발급된 키가 없습니다.",
    issuedCount: "발급된 키 {count}개",
    issueButton: "새 키 발급",
    issuedAt: "발급 {date}",
    lastUsedAt: "최근 사용 {date}",
    delete: "삭제",
    toasts: {
      createFailed: "시크릿 키 발급에 실패했습니다.",
    },
    deleteDialog: {
      title: "시크릿 키를 삭제할까요?",
      description: "삭제하면 외부 서비스에서 더 이상 사용할 수 없습니다.",
    },
  },
  newSecretDialog: {
    title: "새 시크릿 키",
    description:
      "이 키는 지금만 확인할 수 있습니다. 안전한 곳에 복사해 두세요.",
    issueFailed: "키 발급에 실패했습니다.",
    hint: "화면에 노출되는 키는 발급 시 1회만 제공됩니다.",
  },
  workflowApi: {
    updatedAt: "업데이트 {date}",
    viewCode: "API 코드 보기",
    curl: "cURL",
    empty: {
      title: "워크플로우가 없습니다",
      description: "먼저 캔버스에서 워크플로우를 만들어 주세요.",
    },
    toasts: {
      issueFailed: "워크플로우 ID 발급에 실패했습니다.",
      rotated: "새 X-CANVAS-ID가 발급되었습니다.",
      rotateFailed: "재발급에 실패했습니다.",
      revoked: "비활성화되었습니다.",
      revokeFailed: "비활성화에 실패했습니다.",
    },
    samples: {
      prompt: "강아지 키우는 법을 검색해줘",
    },
    tabs: {
      agentflow: "AgentFlow API 가이드",
      openAiChat: "OpenAI Chat Completions",
      openAiResponses: "OpenAI Responses",
    },
    snippets: {
      agentflow: {
        description: "AgentFlow API 가이드",
        scriptLabel: "JavaScript (fetch)",
      },
      openAiChat: {
        description: "OpenAI Chat Completions 호환 호출",
        scriptLabel: "JavaScript (OpenAI SDK)",
      },
      openAiResponses: {
        description: "OpenAI Responses 호환 호출",
        scriptLabel: "JavaScript (OpenAI SDK)",
      },
    },
    dialog: {
      description:
        "<code>X-CANVAS-ID</code>는 워크플로우별로 발급됩니다. OpenAI 호환 라우트에서는 이 값을 <code>model</code>로 사용합니다.",
      canvasIdLabel: "X-CANVAS-ID",
      rotate: "재발급",
      revoke: "비활성화",
      footer:
        "서비스 키는 <code>/developers</code>에서 발급 후 보관해 주세요.",
    },
  },
};

export default message;
