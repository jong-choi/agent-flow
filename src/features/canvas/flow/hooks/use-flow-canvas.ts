import { useCallback, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import {
  type ColorMode,
  type Connection,
  type Edge,
  type Node,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { addNodeToCenter } from "@/features/canvas/flow/utils/add-node-with-layout";
import {
  type SidebarItem,
  type SidebarItemData,
} from "@/features/canvas/types/sidebar-item";

export function useFlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const flowWrapperRef = useRef<HTMLDivElement | null>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  const handleAddEdge = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const { theme } = useTheme();
  const colorMode = useMemo(() => {
    if (theme && ["system", "dark", "light"].includes(theme)) {
      return theme as ColorMode;
    }
    return "system";
  }, [theme]);

  const handleAddNode = useCallback(
    (item: SidebarItem) => {
      // AddNode 호출하기
      setNodes((current) =>
        addNodeToCenter({
          currentNodes: current,
          item,
          flowWrapperRef,
          screenToFlowPosition,
        }),
      );

      // fitView를 이용해서 카메라 자동 이동
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
    },
    [fitView, screenToFlowPosition, setNodes],
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleAddEdge,
    handleAddNode,
    flowWrapperRef,
    fitView,
    colorMode,
  };
}

const INITIAL_NODES: Node<SidebarItemData>[] = [
  {
    id: "start",
    type: "flowCard",
    position: { x: 180, y: 140 },
    data: {
      label: "시작",
      description: "첫 노드를 추가했습니다",
    },
  },
];

const INITIAL_EDGES: Edge[] = [];
