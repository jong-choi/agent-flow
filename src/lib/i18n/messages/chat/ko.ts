const message = {
  meta: {
    chatTitle: "채팅",
    chatFallbackTitle: "채팅",
  },
  page: {
    heading: "워크플로우를 선택하여 채팅을 시작하세요.",
    empty: {
      noWorkflows: "저장된 워크플로우가 없습니다.",
      createWorkflow: "워크플로우 생성하기",
    },
  },
  sidebar: {
    currentChat: "채팅",
    newChat: "새 채팅",
    empty: "아직 시작한 채팅이 없습니다.",
  },
  header: {
    noWorkflow: "워크플로우 없음",
    workflowLabel: "워크플로우",
    viewDetail: "상세 보기",
  },
  title: {
    newChat: "새 채팅",
    chatMenuAria: "채팅 메뉴",
    rename: "이름 바꾸기",
    placeholder: "새 채팅",
  },
  action: {
    startChat: "채팅 시작",
    newChat: "새 채팅",
    more: "더 보기",
    viewGraph: "그래프 보기",
    copyMessageAria: "메시지 복사",
    closePanelAria: "채팅 패널 닫기",
    send: "전송",
    cancel: "취소",
    delete: "삭제",
  },
  dialog: {
    workflowListTitle: "워크플로우 목록",
    untitledWorkflow: "제목이 없습니다.",
    chatDeleteTitle: "채팅을 삭제할까요?",
    chatDeleteDescription: "삭제한 채팅은 복구할 수 없습니다.",
    chatPanelTitle: "채팅 다이얼로그",
  },
  input: {
    placeholder: "메시지를 입력하세요...",
    noMessage: "메시지를 입력하여 채팅을 시작하세요",
    credits: "{count} 크레딧",
  },
  status: {
    idle: "대기 중",
    processing: "처리 중",
    searchNode: "검색 중",
    documentNode: "문서 읽는 중",
    chatNode: "응답 생성 중",
  },
  toast: {
    createFailed: "채팅 생성에 실패했습니다.",
    renameSuccess: "채팅 이름을 변경했어요.",
    renameFailed: "채팅 이름 변경에 실패했습니다.",
    deleteSuccess: "채팅을 삭제했어요.",
    deleteFailed: "채팅 삭제에 실패했습니다.",
    startGraphNotFound: "채팅 시작 중 오류: 그래프를 찾을 수 없습니다.",
    startSessionNotFound: "채팅 시작 중 오류: 세션을 찾을 수 없습니다.",
    responseUnavailable: "응답을 받을 수 없습니다.",
  },
  errors: {
    missingChatId: "chatId가 없습니다.",
    missingThreadId: "threadId가 없습니다.",
    responseUnavailable: "응답을 받을 수 없습니다.",
  },
};

export default message;
