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
import { Button } from "@/components/ui/button";
import {
  INITIAL_EDGES,
  INITIAL_NODES,
  NODE_TYPE,
} from "@/features/canvas/constants/flow";
import { useCheckValidGraph } from "@/features/canvas/hooks/use-check-valid-graph";
import { useIsValidConnection } from "@/features/canvas/hooks/use-is-valid-connection";
import { useReconnectEdge } from "@/features/canvas/hooks/use-reconnect-edge";
import { useCanvasStore } from "@/features/canvas/store/providers/canvas-store-provider";
import { type SidebarItemData } from "@/features/canvas/types/sidebar-item";

const ReactFlow = dynamic<ReactFlowProps<Node<SidebarItemData>, Edge>>(
  () => import("@xyflow/react").then((m) => m.ReactFlow),
  { ssr: false },
);

export function FlowApp() {
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  const isValidGraph = useCanvasStore((s) => s.isValidGraph);

  const isValidConnection = useIsValidConnection();
  const checkValidGraph = useCheckValidGraph();
  const { handleReconnect, handleReconnectStart } = useReconnectEdge();

  const handleOnConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      checkValidGraph({ edges: newEdges });
      setEdges(newEdges);
    },
    [checkValidGraph, edges, setEdges],
  );

  const { theme } = useTheme();

  const colorMode = useMemo(() => {
    if (theme && ["system", "dark", "light"].includes(theme)) {
      return theme as ColorMode;
    }
    return "system";
  }, [theme]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 z-10">
        <Button type="button" disabled={!isValidGraph}>
          시작하기
        </Button>
      </div>
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
        onReconnect={handleReconnect}
        onReconnectStart={handleReconnectStart}
        isValidConnection={isValidConnection}
      >
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
