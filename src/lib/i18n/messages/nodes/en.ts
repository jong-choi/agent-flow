const message = {
  default: {
    title: "Node Guide",
    summary: "Drag nodes from the sidebar onto the canvas.",
    description: "Dragging a node from the sidebar adds it to the canvas.",
    guides: {
      first: "Drag nodes onto the canvas.",
      second: "Connect node handles to build your workflow.",
      third: "The graph must start at Start and end at End.",
    },
  },
  node: {
    start: {
      label: "Start",
      title: "Start Node",
      summary: "Entry point of the workflow.",
      description:
        "Every workflow begins at the Start node. It acts as the entry point and can connect to subsequent nodes.",
      guides: {
        first: "Only one Start node can be placed on the canvas.",
        second: "Start nodes cannot receive incoming connections.",
        third: "Connect to the next step to compose your workflow.",
      },
    },
    end: {
      label: "End",
      title: "End Node",
      summary: "Terminal point of the workflow.",
      description:
        "This node collects the final output of a workflow. Every execution path should eventually reach End.",
      guides: {
        first: "Only one End node can be placed on the canvas.",
        second: "End nodes cannot create outgoing connections.",
        third: "Multiple paths can be merged before reaching End.",
      },
    },
    chat: {
      label: "Chat",
      title: "Chat Node",
      summary: "Generates responses with an AI agent.",
      description:
        "This node calls the selected AI agent and generates a response from the incoming input.",
      guides: {
        first: "Choose the AI agent to use.",
        second: "Combine with Prompt nodes for more specific instructions.",
        third: "Generated responses are passed to the next node.",
      },
    },
    prompt: {
      label: "Prompt",
      title: "Prompt Node",
      summary: "Creates custom text input.",
      description:
        "Write custom text and use '{input}' to reference output from the previous node.",
      guides: {
        first: "Use '{input}' to receive output from the previous node.",
        second: "Combine fixed text and variables as needed.",
        third: "Useful for building instructions for Chat nodes.",
      },
    },
    search: {
      label: "Search",
      title: "Search Node",
      summary: "Runs web search.",
      description:
        "Runs web searches using input keywords. Multiple keywords can be separated by commas.",
      guides: {
        first: "Enter a single keyword, or",
        second: "separate multiple keywords with commas to run together.",
        third: "Results are passed to the next node as text.",
      },
    },
    document: {
      label: "Document",
      title: "Document Node",
      summary: "Reads or edits a document.",
      description:
        "Connect one of your documents, then read or edit it based on the selected action.",
      guides: {
        first: "Choose an action: Read / Replace / Merge.",
        second: "Select and connect a document.",
        third: "Replace/Merge uses output from previous nodes.",
      },
    },
    split: {
      label: "Split",
      title: "Split Node",
      summary: "Splits one input into multiple outputs.",
      description:
        "Duplicates one input into three identical outputs for parallel processing.",
      guides: {
        first: "One input is duplicated into three outputs.",
        second: "Each output can be routed independently.",
        third: "Use when parallel branches are needed.",
      },
    },
    merge: {
      label: "Merge",
      title: "Merge Node",
      summary: "Merges multiple inputs into one.",
      description:
        "Accepts up to three incoming inputs and combines them into one text output.",
      guides: {
        first: "Up to three incoming inputs can be connected.",
        second: "Inputs are combined into one output text.",
        third: "Useful after Split for collecting parallel results.",
      },
    },
  },
};

export default message;
