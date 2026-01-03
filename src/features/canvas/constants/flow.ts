import { type Edge, type Node } from "@xyflow/react";
import { type SidebarNodeData } from "@/db/query/sidebar-nodes";
import { FlowNode } from "@/features/canvas/components/flow/flow-node/flow-node";

export const INITIAL_NODES: Node<SidebarNodeData>[] = [];

export const INITIAL_EDGES: Edge[] = [];

type SidebarNodeSeedItem = {
  label: string;
  description: string;
  type: string;
  content: null | {
    type: "select" | "dialog";
    label: string;
    placeholder?: string;
    value?: string;
    optionsSource?: "ai_models";
    dialogTitle?: string;
    dialogDescription?: string;
  };
  handle: null | {
    target?: { count: number };
    source?: { count: number };
  };
};

const ChatNodeItem: SidebarNodeSeedItem = {
  label: "채팅",
  description: "응답 생성 노드",
  type: "flowNode",
  content: {
    type: "select",
    label: "Agent",
    placeholder: "Agent를 선택하기",
    optionsSource: "ai_models",
  },
  handle: null,
};

const SearchNodeItem = {
  label: "검색",
  description: "구글 검색 노드",
  type: "flowNode",
  content: null,
  handle: null,
};

const MergeNodeItem = {
  label: "병합",
  description: "여러 입력을 하나로 병합",
  type: "flowNode",
  handle: {
    target: {
      count: 3,
    },
  },
  content: null,
};

const SplitNodeItem = {
  label: "분할",
  description: "입력을 여러 출력으로 분할",
  type: "flowNode",
  handle: {
    source: {
      count: 3,
    },
  },
  content: null,
};
const StartNodeItem = {
  label: "시작",
  description: "시작 노드",
  type: "startNode",
  handle: {
    target: {
      count: 0,
    },
  },
  content: null,
};

const EndNodeItem = {
  label: "종료",
  description: "종료 노드",
  type: "endNode",
  handle: {
    source: {
      count: 0,
    },
  },
  content: null,
};

const PromptNodeItem: SidebarNodeSeedItem = {
  label: "프롬프트",
  description: "텍스트를 입력",
  type: "flowNode",
  content: {
    type: "dialog",
    label: "프롬프트 수정",
    dialogTitle: "프롬프트 입력",
    dialogDescription: "{input}으로 이전 노드의 결과물을 받을 수 있습니다",
    value: "{input}을 검색해줘",
  },
  handle: null,
};

export const sidebarNodesData: SidebarNodeSeedItem[] = [
  StartNodeItem,
  ChatNodeItem,
  MergeNodeItem,
  SplitNodeItem,
  SearchNodeItem,
  EndNodeItem,
  PromptNodeItem,
];

const SidebarNodeTypes = Array.from(
  new Set(sidebarNodesData.map((node) => node.type)),
);

export const NODE_TYPE: Record<
  (typeof SidebarNodeTypes)[number],
  typeof FlowNode
> = Object.fromEntries(SidebarNodeTypes.map((type) => [type, FlowNode]));
