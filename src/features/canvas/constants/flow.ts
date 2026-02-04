import { type Edge } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { FlowNode } from "@/features/canvas/components/flow/flow-node/flow-node";
import {
  type NodeType,
  nodeTypes,
} from "@/features/canvas/constants/node-types";

export const INITIAL_NODES: FlowCanvasNode[] = [];

export const INITIAL_EDGES: Edge[] = [];

type SidebarNodeSeedItem = {
  label: string;
  description: string;
  type: NodeType;
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
  information: {
    title: string;
    summary: string;
    description: string;
    guides: Array<string>;
  };
};

const ChatNodeItem: SidebarNodeSeedItem = {
  label: "채팅",
  description: "응답 생성 노드",
  type: "chatNode",
  content: {
    type: "select",
    label: "Agent",
    placeholder: "Agent를 선택하기",
    optionsSource: "ai_models",
  },
  handle: null,
  information: {
    title: "채팅 노드",
    summary: "AI 에이전트가 응답을 생성합니다",
    description:
      "선택한 AI 에이전트를 호출하여 입력받은 내용에 대한 응답을 생성하는 노드입니다. 다양한 AI 모델 중에서 선택할 수 있습니다.",
    guides: [
      "사용할 AI 에이전트를 선택하세요",
      "프롬프트 노드와 함께 사용하면 더 정교한 지시사항을 전달할 수 있습니다",
      "생성된 응답은 다음 노드로 전달됩니다",
    ],
  },
};

const SearchNodeItem: SidebarNodeSeedItem = {
  label: "검색",
  description: "구글 검색 노드",
  type: "searchNode",
  content: null,
  handle: null,
  information: {
    title: "검색 노드",
    summary: "구글 검색을 수행합니다",
    description:
      "입력받은 검색어로 구글 검색을 실행하는 노드입니다. 쉼표로 구분하여 여러 검색어를 동시에 처리할 수 있습니다.",
    guides: [
      "하나의 검색어를 입력하거나",
      "쉼표로 구분하여 여러 검색어를 한 번에 처리할 수 있습니다",
      "검색 결과는 텍스트 형태로 다음 노드에 전달됩니다",
    ],
  },
};

const DocumentNodeItem: SidebarNodeSeedItem = {
  label: "문서",
  description: "문서를 읽거나 수정",
  type: "documentNode",
  content: {
    type: "select",
    label: "동작",
    placeholder: "동작 선택",
    value: "읽기",
  },
  handle: null,
  information: {
    title: "문서 노드",
    summary: "문서를 읽거나(읽기), 수정하거나(대치/병합) 합니다",
    description:
      "문서 노드는 내 문서와 연결한 뒤, 선택한 동작에 따라 문서를 읽거나 수정합니다. 대치/병합은 입력이 필요합니다.",
    guides: [
      "동작을 선택하세요: 읽기 / 대치 / 병합",
      "문서를 선택해 연결하세요",
      "대치/병합은 이전 노드의 출력값을 사용합니다",
    ],
  },
};

const MergeNodeItem: SidebarNodeSeedItem = {
  label: "병합",
  description: "여러 입력을 병합",
  type: "mergeNode",
  handle: {
    target: {
      count: 3,
    },
  },
  content: null,
  information: {
    title: "병합 노드",
    summary: "여러 입력을 하나로 합칩니다",
    description:
      "최대 3개의 입력 연결을 받아서 하나의 텍스트로 결합하는 노드입니다. 분기된 여러 경로를 다시 하나로 모을 때 사용합니다.",
    guides: [
      "최대 3개의 입력을 연결할 수 있습니다",
      "모든 입력이 도착하면 하나의 텍스트로 합쳐집니다",
      "분할 노드와 함께 사용하여 병렬 처리 후 결과를 모을 수 있습니다",
    ],
  },
};

const SplitNodeItem: SidebarNodeSeedItem = {
  label: "분할",
  description: "하나의 입력을 분할",
  type: "splitNode",
  handle: {
    source: {
      count: 3,
    },
  },
  content: null,
  information: {
    title: "분할 노드",
    summary: "하나의 입력을 여러 출력으로 나눕니다",
    description:
      "하나의 입력을 받아서 3개의 동일한 출력으로 복제하는 노드입니다. 같은 데이터를 여러 경로로 동시에 처리하고 싶을 때 사용합니다.",
    guides: [
      "하나의 입력이 3개의 출력으로 복제됩니다",
      "각 출력은 독립적인 경로로 연결할 수 있습니다",
      "병렬 처리가 필요한 경우에 활용하세요",
    ],
  },
};
const StartNodeItem: SidebarNodeSeedItem = {
  label: "시작",
  description: "시작 노드",
  type: "startNode",
  handle: {
    target: {
      count: 0,
    },
  },
  content: null,
  information: {
    title: "시작 노드",
    summary: "워크플로우의 시작점입니다",
    description:
      "모든 워크플로우는 시작 노드에서 출발합니다. 이 노드는 전체 프로세스의 진입점 역할을 하며, 다른 노드들로 연결할 수 있습니다.",
    guides: [
      "캔버스에는 하나의 시작 노드만 배치할 수 있습니다",
      "시작 노드는 입력 연결을 받을 수 없습니다",
      "다음 단계로 연결하여 워크플로우를 구성하세요",
    ],
  },
};

const EndNodeItem: SidebarNodeSeedItem = {
  label: "종료",
  description: "종료 노드",
  type: "endNode",
  handle: {
    source: {
      count: 0,
    },
  },
  content: null,
  information: {
    title: "종료 노드",
    summary: "워크플로우의 종착점입니다",
    description:
      "워크플로우의 최종 결과를 수집하는 노드입니다. 모든 실행 경로는 최종적으로 종료 노드에 도달해야 합니다.",
    guides: [
      "캔버스에는 하나의 종료 노드만 배치할 수 있습니다",
      "종료 노드는 출력 연결을 만들 수 없습니다",
      "여러 경로를 하나로 모아 종료할 수 있습니다",
    ],
  },
};

const PromptNodeItem: SidebarNodeSeedItem = {
  label: "프롬프트",
  description: "텍스트를 입력",
  type: "promptNode",
  content: {
    type: "dialog",
    label: "프롬프트 수정",
    dialogTitle: "프롬프트 입력",
    dialogDescription: "{input}으로 이전 노드의 결과물을 받을 수 있습니다",
    value: "{input}을 검색해줘",
  },
  handle: null,
  information: {
    title: "프롬프트 노드",
    summary: "사용자 정의 텍스트를 생성합니다",
    description:
      "원하는 텍스트를 직접 작성할 수 있는 노드입니다. 이전 노드의 출력을 {input} 변수로 받아 활용할 수 있습니다.",
    guides: [
      "{input}을 사용하면 이전 노드의 결과를 받을 수 있습니다",
      "고정된 텍스트와 변수를 조합하여 사용하세요",
      "채팅 노드에 전달할 명령어를 구성할 때 유용합니다",
    ],
  },
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

export const NODE_TYPE: Record<NodeType, typeof FlowNode> = Object.fromEntries(
  nodeTypes.map((type) => [type, FlowNode]),
) as Record<NodeType, typeof FlowNode>;
