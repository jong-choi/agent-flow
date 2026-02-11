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
        description: "Enter a name and description, then save.",
        nameLabel: "Name",
        namePlaceholder: "Workflow name",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Workflow description",
        descriptionLimit: "You can enter up to 140 characters.",
        close: "Close",
        submit: "Save",
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
      dialog: {
        title: "Load Preset",
        description:
          "You can add purchased or created presets to the current canvas.",
        searchPlaceholder: "Search presets (title)",
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
        action: "Action",
        selectValue: "Selected Value",
        dialogValue: "Dialog Value",
        name: "Name",
        description: "Description",
        documentReference: "Document Link",
        handles: "Handles",
        targetInputs: "Target Inputs",
        sourceOutputs: "Source Outputs",
        credits: "Credits",
      },
      placeholders: {
        name: "Node Name",
        description: "Description...",
      },
      save: "Save",
    },
  },
};

export default message;
