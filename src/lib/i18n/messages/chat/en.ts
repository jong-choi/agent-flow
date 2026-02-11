const message = {
  meta: {
    chatTitle: "Chat",
    chatFallbackTitle: "Chat",
  },
  page: {
    heading: "Select a workflow to start chatting.",
    empty: {
      noWorkflows: "No saved workflows.",
      createWorkflow: "Create Workflow",
    },
  },
  sidebar: {
    currentChat: "Chat",
    newChat: "New chat",
    empty: "No chats started yet.",
  },
  header: {
    noWorkflow: "No workflow",
    workflowLabel: "Workflow",
    viewDetail: "View details",
  },
  title: {
    newChat: "New chat",
    chatMenuAria: "Chat menu",
    rename: "Rename",
    placeholder: "New chat",
  },
  action: {
    startChat: "Start chat",
    newChat: "New chat",
    more: "More",
    viewGraph: "View graph",
    copyMessageAria: "Copy message",
    closePanelAria: "Close chat panel",
    send: "Send",
    cancel: "Cancel",
    delete: "Delete",
  },
  dialog: {
    workflowListTitle: "Workflow list",
    untitledWorkflow: "Untitled",
    chatDeleteTitle: "Delete this chat?",
    chatDeleteDescription: "Deleted chats cannot be restored.",
    chatPanelTitle: "Chat dialog",
  },
  input: {
    placeholder: "Type your message...",
    noMessage: "Enter a message to start chatting",
    credits: "{count} credits",
  },
  status: {
    idle: "Idle",
    processing: "Processing",
    searchNode: "Searching",
    documentNode: "Reading documents",
    chatNode: "Generating response",
  },
  toast: {
    createFailed: "Failed to create chat.",
    renameSuccess: "Chat title updated.",
    renameFailed: "Failed to rename chat.",
    deleteSuccess: "Chat deleted.",
    deleteFailed: "Failed to delete chat.",
    startGraphNotFound: "Chat start failed: Graph not found.",
    startSessionNotFound: "Chat start failed: Session not found.",
    responseUnavailable: "Unable to receive a response.",
  },
  errors: {
    missingChatId: "chatId is missing.",
    missingThreadId: "threadId is missing.",
    responseUnavailable: "Unable to receive a response.",
  },
};

export default message;
