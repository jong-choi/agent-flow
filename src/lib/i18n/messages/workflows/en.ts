const message = {
  meta: {
    workflowsTitle: "Workflows",
    workflowFallbackTitle: "Workflow",
    canvasTitle: "Canvas",
  },
  listPage: {
    heading: "My Workflows",
    description: "Graphs created in the flow canvas.",
    newWorkflow: "New Workflow",
  },
  listView: {
    emptyTitle: "No workflows yet",
    emptyDescription: "Create your first workflow in the canvas.",
    createWorkflow: "Create Workflow",
    detail: "Details",
  },
  detailPage: {
    backToList: "Back to list",
    noDescription: "No description.",
    updatedAt: "Updated {date}",
    openInCanvas: "Open in Canvas",
  },
  dataView: {
    graphPreviewTitle: "Graph Preview",
    nodeListTitle: "Nodes",
    nodeListDescription: "Review nodes included in this workflow.",
    noNodes: "No nodes yet.",
    noNodeDescription: "No description.",
    summaryTitle: "Workflow Summary",
    summaryDescription: "Graph statistics and records",
    nodeLabel: "Nodes",
    edgeLabel: "Edges",
  },
  canvas: {
    header: {
      newWorkflow: "New Workflow",
      noDescription: "No description provided.",
    },
    actions: {
      startChat: "Start Chat",
      loadPreset: "Load Preset",
      save: "Save",
    },
    validation: {
      startNodeCountInvalid: "Exactly one start node is required.",
      endNodeCountInvalid: "Exactly one end node is required.",
      disconnectedNodeExists: "There are unconnected nodes.",
      nodeTypeMissing: "A node type is missing.",
      chatNodeValueMissing: "Please select a model for the chat node.",
      documentNodeReferenceMissing:
        "The document node must have a linked document.",
    },
    start: {
      errors: {
        createFailed: "Unable to start chat.",
        missingThreadId: "Chat ID was not issued.",
        fallback: "Failed to start chat.",
      },
    },
    save: {
      validation: {
        titleRequired: "Please enter a workflow name.",
      },
      dialog: {
        title: "Save Workflow",
        titleCreate: "Save Workflow",
        titleEdit: "Update Workflow",
        description: "Enter a name and description, then save.",
        descriptionCreate: "Enter a name and description, then save.",
        descriptionEdit:
          "Review the current name and description, then update.",
        nameLabel: "Name",
        namePlaceholder: "Workflow name",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Workflow description",
        descriptionLimit: "You can enter up to {max} characters.",
        close: "Close",
        submit: "Save",
        submitCreate: "Save",
        submitEdit: "Update",
      },
      toast: {
        success: "Saved.",
      },
      errors: {
        saveFailed: "Failed to save workflow.",
        fallback: "Workflow save failed.",
      },
    },
    loadPreset: {
      groupLabel: "Preset",
      dialog: {
        title: "Load Preset",
        description:
          "You can add purchased or created presets to the current canvas.",
        searchPlaceholder: "Search presets (title)",
        loadMore: "Load more",
      },
      empty: {
        noOwned: "You do not have any presets.",
        cycleBlocked: "Presets created from this workflow cannot be loaded.",
        noMatch: "No presets match your criteria.",
      },
      toast: {
        appended: "Preset added to canvas.",
      },
      errors: {
        noNodes: "No nodes to add from this preset.",
        loadFailed: "Failed to load preset.",
        libraryLoadFailed: "Failed to load preset list.",
        loginRequired: "Sign in is required.",
      },
    },
    node: {
      savedToast: "Saved.",
      editDialogSrOnly: "Node edit dialog",
      close: "Close",
      save: "Save",
      delete: {
        ariaLabel: "Delete node",
        title: "Delete this node?",
        description: "Select Delete to remove this node.",
        cancel: "Cancel",
        confirm: "Delete",
      },
    },
    document: {
      create: {
        button: "Link New Document",
        successToast: "Document linked.",
        failedToast: "Failed to create document.",
      },
      reference: {
        triggerLabel: "Link Document",
        unlink: "Unlink",
        dialogTitle: "Select Document",
        close: "Close",
      },
      picker: {
        searchPlaceholder: "Search by document title",
        loading: "Loading...",
        loadMore: "Load more",
        noDocuments: "No documents found.",
        noSearchResults: "No search results.",
        emptyContent: "No content.",
      },
    },
    nodePanel: {
      validation: {
        nameRequired: "Please enter a name.",
        handleRange: "Enter an integer between 0 and 5.",
      },
      labels: {
        agent: "Agent",
        action: "Action",
        promptEdit: "Edit Prompt",
        promptDialogTitle: "Prompt Input",
        selectValue: "Selected Value",
        dialogValue: "Prompt",
        name: "Name",
        description: "Description",
        documentReference: "Document Link",
        handles: "Handles",
        targetInputs: "Max Input Count",
        sourceOutputs: "Max Output Count",
        credits: "Credits",
      },
      placeholders: {
        name: "Node Name",
        description: "Description...",
        action: "Select action",
        agent: "Select Agent",
        promptInputHint:
          "Use '{input}' to receive output from the previous node.",
      },
      save: "Save",
    },
  },
};

export default message;
