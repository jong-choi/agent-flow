const message = {
  meta: {
    developerApiTitle: "Developer API",
    workflowApiTitle: "Workflow API",
  },
  common: {
    noDescription: "No description.",
    copy: "Copy",
    cancel: "Cancel",
    toasts: {
      copied: "Copied.",
      deleted: "Deleted.",
      deleteFailed: "Failed to delete.",
    },
  },
  indexPage: {
    heading: "Developer API",
    description: "Issue service keys and run workflows from external services.",
    workflowApiButton: "Workflow API",
    secretCardTitle: "Service Keys",
    secretCardDescription:
      "Send it in the <code>X-FLOW-SECRET</code> header for API calls. The key is shown only once when issued.",
    guidesCardTitle: "Developer API Guides",
    openAiGuideTitle: "OpenAI Compatibility Guide",
    openAiGuideDescription: "How to call directly from OpenAI SDK/clients",
    agentflowGuideTitle: "AgentFlow API Guide",
    agentflowGuideDescription: "/api/v1/chat (X-FLOW-SECRET + X-FLOW-ID)",
  },
  apisPage: {
    heading: "Workflow API",
    description:
      "Issue per-workflow <code>X-FLOW-ID</code> values and copy invocation code.",
    serviceKeysButton: "Manage Service Keys",
  },
  secretManager: {
    empty: "No keys issued.",
    issuedCount: "Issued keys {count}",
    issueButton: "Issue New Key",
    issuedAt: "Issued {date}",
    lastUsedAt: "Last used {date}",
    delete: "Delete",
    loadMore: "Load more",
    toasts: {
      createFailed: "Failed to issue secret key.",
    },
    deleteDialog: {
      title: "Delete this secret key?",
      description:
        "After deletion, it can no longer be used from external services.",
    },
  },
  newSecretDialog: {
    title: "New Secret Key",
    description: "You can only see this key now. Copy and store it safely.",
    issueFailed: "Failed to issue key.",
    hint: "A visible key is provided only once when issued.",
  },
  workflowApi: {
    updatedAt: "Updated {date}",
    viewCode: "View API Code",
    curl: "cURL",
    empty: {
      title: "No workflows",
      description: "Create a workflow first.",
    },
    toasts: {
      issueFailed: "Failed to issue workflow ID.",
      rotated: "A new X-FLOW-ID has been issued.",
      rotateFailed: "Failed to reissue.",
      revoked: "Deactivated.",
      revokeFailed: "Failed to deactivate.",
    },
    samples: {
      prompt: "Search for how to raise a puppy",
    },
    tabs: {
      agentflow: "AgentFlow API Guide",
      openAiChat: "OpenAI Chat Completions",
      openAiResponses: "OpenAI Responses",
    },
    snippets: {
      agentflow: {
        description: "AgentFlow API guide",
        scriptLabel: "JavaScript (fetch)",
      },
      openAiChat: {
        description: "OpenAI Chat Completions compatible call",
        scriptLabel: "JavaScript (OpenAI SDK)",
      },
      openAiResponses: {
        description: "OpenAI Responses compatible call",
        scriptLabel: "JavaScript (OpenAI SDK)",
      },
    },
    dialog: {
      description:
        "<code>X-FLOW-ID</code> is issued per workflow. On OpenAI-compatible routes, use this value as <code>model</code>.",
      canvasIdLabel: "X-FLOW-ID",
      rotate: "Reissue",
      revoke: "Deactivate",
      footer: "Issue and store service keys at <code>/developers</code>.",
    },
  },
};

export default message;
