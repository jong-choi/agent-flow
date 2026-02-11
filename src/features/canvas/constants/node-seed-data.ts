type SidebarNodeSeedItem = {
  type:
    | "startNode"
    | "endNode"
    | "chatNode"
    | "promptNode"
    | "searchNode"
    | "documentNode"
    | "splitNode"
    | "mergeNode";
  icon: string;
  backgroundColor: string;
  order: number;
  content: null | {
    type: "select" | "dialog";
    value?: string;
    optionsSource?: "ai_models";
  };
  handle: null | {
    target?: { count: number };
    source?: { count: number };
  };
};

const StartNodeItem: SidebarNodeSeedItem = {
  type: "startNode",
  icon: "Play",
  backgroundColor: "bg-orange-600 dark:bg-orange-800",
  order: 20,
  handle: {
    target: {
      count: 0,
    },
  },
  content: null,
};

const EndNodeItem: SidebarNodeSeedItem = {
  type: "endNode",
  icon: "Square",
  backgroundColor: "bg-sky-600 dark:bg-sky-800",
  order: 40,
  handle: {
    source: {
      count: 0,
    },
  },
  content: null,
};

const ChatNodeItem: SidebarNodeSeedItem = {
  type: "chatNode",
  icon: "MessageSquare",
  backgroundColor: "bg-lime-600 dark:bg-lime-800",
  order: 60,
  content: {
    type: "select",
    optionsSource: "ai_models",
  },
  handle: null,
};

const PromptNodeItem: SidebarNodeSeedItem = {
  type: "promptNode",
  icon: "Terminal",
  backgroundColor: "bg-amber-600 dark:bg-amber-800",
  order: 80,
  content: {
    type: "dialog",
    value: "{input}을 검색해줘",
  },
  handle: null,
};

const SearchNodeItem: SidebarNodeSeedItem = {
  type: "searchNode",
  icon: "Search",
  backgroundColor: "bg-pink-600 dark:bg-pink-800",
  order: 100,
  content: null,
  handle: null,
};

const DocumentNodeItem: SidebarNodeSeedItem = {
  type: "documentNode",
  icon: "FileText",
  backgroundColor: "bg-green-600 dark:bg-green-800",
  order: 120,
  content: {
    type: "select",
    value: "읽기",
  },
  handle: null,
};

const SplitNodeItem: SidebarNodeSeedItem = {
  type: "splitNode",
  icon: "GitFork",
  backgroundColor: "bg-purple-600 dark:bg-purple-800",
  order: 140,
  handle: {
    source: {
      count: 3,
    },
  },
  content: null,
};

const MergeNodeItem: SidebarNodeSeedItem = {
  type: "mergeNode",
  icon: "GitMerge",
  backgroundColor: "bg-cyan-600 dark:bg-cyan-800",
  order: 160,
  handle: {
    target: {
      count: 3,
    },
  },
  content: null,
};

export const sidebarNodesData: SidebarNodeSeedItem[] = [
  StartNodeItem,
  ChatNodeItem,
  MergeNodeItem,
  SplitNodeItem,
  SearchNodeItem,
  DocumentNodeItem,
  EndNodeItem,
  PromptNodeItem,
];
