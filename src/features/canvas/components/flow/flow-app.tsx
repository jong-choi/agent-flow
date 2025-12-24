import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  Background,
  type ColorMode,
  type Connection,
  Controls,
  type Edge,
  type Node,
  type ReactFlowProps,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import {
  INITIAL_EDGES,
  INITIAL_NODES,
  NODE_TYPE,
} from "@/features/canvas/constants/flow";
import { useIsValidConnection } from "@/features/canvas/hooks/use-is-valid-connection";
import { type SidebarItemData } from "@/features/canvas/types/sidebar-item";

const ReactFlow = dynamic<ReactFlowProps<Node<SidebarItemData>, Edge>>(
  () => import("@xyflow/react").then((m) => m.ReactFlow),
  { ssr: false },
);

export function FlowApp() {
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const isValidConnection = useIsValidConnection();

  const handleOnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const { theme } = useTheme();
  const colorMode = useMemo(() => {
    if (theme && ["system", "dark", "light"].includes(theme)) {
      return theme as ColorMode;
    }
    return "system";
  }, [theme]);

  return (
    <ReactFlow
      colorMode={colorMode}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={NODE_TYPE}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      style={{ width: "100%", height: "100%" }}
      onConnect={handleOnConnect}
      isValidConnection={isValidConnection}
    >
      <Background gap={16} size={1} color="#e5e7eb" />
      <Controls position="bottom-left" />
    </ReactFlow>
  );
}
