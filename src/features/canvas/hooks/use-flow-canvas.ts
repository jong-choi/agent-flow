import { useCallback, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import {
  type ColorMode,
  type Connection,
  type Node,
  type XYPosition,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import {
  type SidebarItem,
  type SidebarItemData,
} from "@/features/canvas/types/sidebar-item";
import { INITIAL_EDGES, INITIAL_NODES } from "@/features/canvas/utils/flow";

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
    (item: SidebarItem, position: XYPosition) => {
      const nextNode: Node<SidebarItemData> = {
        id: `${item.id}-${Date.now()}`,
        type: item.type,
        position: position,
        data: {
          label: item.label,
          description: item.description ?? "",
        },
      };

      setNodes((current) => [...current, nextNode]);
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
    },
    [fitView, setNodes],
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
    screenToFlowPosition,
  };
}
