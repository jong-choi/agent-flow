import { END, START, StateGraph } from "@langchain/langgraph";
import * as runnableNodes from "@/app/api/chat/_nodes";
import { FlowStateAnnotation } from "@/app/api/chat/flow-state";
import {
  type FlowEdge,
  type FlowNode,
  isValidNodeType,
} from "@/app/api/chat/types";

// addEdge가 단일/다중 소스 모두 받도록 타입만 확장한 Graph 래퍼
type DynamicStateGraph = Omit<
  StateGraph<typeof FlowStateAnnotation>,
  "addEdge"
> & {
  addEdge(source: string | string[], target: string): void;
};

const buildInputTree = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const inputTree: Record<string, Record<string, string>> = {};

  const nodeIds = new Set(nodes.map((node) => node.id));

  // 모든 노드에 대해 기본 빈 매핑을 만든다
  for (const node of nodes) {
    inputTree[node.id] = {};
  }

  // 유효한 엣지만 골라 target 기준으로 source를 기록
  for (const edge of edges) {
    // 존재하지 않는 노드가 포함된 엣지는 무시
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }

    if (!edge.targetHandle) {
      continue;
    }

    if (!inputTree[edge.target]) {
      inputTree[edge.target] = {};
    }
    inputTree[edge.target][edge.targetHandle] = edge.source;
  }

  return inputTree;
};

export const buildStateGraph = (nodes: FlowNode[], edges: FlowEdge[]) => {
  // 동적 생성을 위해 그래프를 타입캐스팅
  const graph = new StateGraph(FlowStateAnnotation) as DynamicStateGraph;

  // 유효성 확인용 노드 ID 집합
  const nodeIds = new Set(nodes.map((node) => node.id));

  // pan-in/pan-out용 mergeNodeIds 수집
  const mergeNodeIds = new Set(
    nodes.filter((node) => node.type === "mergeNode").map((node) => node.id),
  );

  const startNode = nodes.find((node) => node.type === "startNode");
  const endNode = nodes.find((node) => node.type === "endNode");

  const inputTree = buildInputTree(nodes, edges);

  // merge 노드로 들어오는 모든 소스를 모아둔다
  const incomingSources = new Map<string, Set<string>>();

  for (const edge of edges) {
    // 존재하지 않는 노드가 포함된 엣지는 무시
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }
    // merge 대상이 아닌 엣지는 여기서 처리하지 않음
    if (!mergeNodeIds.has(edge.target)) {
      continue;
    }

    const sources = incomingSources.get(edge.target) ?? new Set<string>();

    sources.add(edge.source);

    incomingSources.set(edge.target, sources);
  }

  // Graph에 동적으로 노드 추가
  for (const node of nodes) {
    if (!node.type || !isValidNodeType(node.type)) {
      continue;
    }

    const runnable = runnableNodes[node.type];

    graph.addNode(node.id, runnable, {
      metadata: { langgraph_node: node.id, type: node.type, data: node.data },
    });
  }

  // START -> startNode 연결
  if (startNode) {
    graph.addEdge(START, startNode.id);
  } else {
    throw new Error("시작 노드가 없습니다");
  }

  // 엣지 연결 (merge 노드 제외)
  for (const edge of edges) {
    // 존재하지 않는 노드가 포함된 엣지는 무시
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }

    // merge 노드 대상은 건너뛴다
    if (mergeNodeIds.has(edge.target)) {
      continue;
    }

    graph.addEdge(edge.source, edge.target);
  }

  // merge 노드 다중 연결
  for (const [mergeNodeId, sources] of incomingSources.entries()) {
    const sourceList = Array.from(sources);

    if (sourceList.length === 1) {
      graph.addEdge(sourceList[0], mergeNodeId);
    } else if (sourceList.length > 1) {
      graph.addEdge(sourceList, mergeNodeId);
    }
  }

  // endNode -> END 연결
  if (endNode) {
    graph.addEdge(endNode.id, END);
  } else {
    throw new Error("종료 노드가 없습니다");
  }

  return { graph, inputTree };
};
