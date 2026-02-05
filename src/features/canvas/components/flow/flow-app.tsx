"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  Background,
  type ColorMode,
  type Connection,
  Controls,
  type Edge,
  type ReactFlowProps,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { FlowLoadPresetButton } from "@/features/canvas/components/flow/flow-load-preset/flow-load-preset-button";
import { FlowPresetGroupsOverlay } from "@/features/canvas/components/flow/flow-preset-groups/flow-preset-groups-overlay";
import { FlowSaveButton } from "@/features/canvas/components/flow/flow-save-button";
import { FlowStartButton } from "@/features/canvas/components/flow/flow-start-button";
import {
  INITIAL_EDGES,
  INITIAL_NODES,
  NODE_TYPE,
} from "@/features/canvas/constants/flow";
import { useCheckValidGraph } from "@/features/canvas/hooks/use-check-valid-graph";
import { useIsValidConnection } from "@/features/canvas/hooks/use-is-valid-connection";
import { useReconnectEdge } from "@/features/canvas/hooks/use-reconnect-edge";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import {
  type WorkflowState,
  defaultWorkflowState,
} from "@/features/canvas/store/slices/workflow-slice";
import { useDebounce } from "@/hooks/use-debounce";

const ReactFlow = dynamic<ReactFlowProps<FlowCanvasNode, Edge>>(
  () => import("@xyflow/react").then((m) => m.ReactFlow),
  { ssr: false },
);

type FlowAppProps = {
  initialNodes?: FlowCanvasNode[];
  initialEdges?: Edge[];
  workflow?: WorkflowState;
};

export function FlowApp({
  initialNodes = INITIAL_NODES,
  initialEdges = INITIAL_EDGES,
  workflow,
}: FlowAppProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const checkValidGraph = useCheckValidGraph();
  const setLoading = useCanvasStore((s) => s.setIsStartLoading);
  const setWorkflow = useCanvasStore((s) => s.setWorkflow);

  const estimatedCredits = useMemo(() => {
    return nodes
      .filter((node) => node.type === "chatNode")
      .reduce((sum, node) => {
        const modelId = node.data.content?.value;
        if (typeof modelId !== "string") return sum;

        const option = node.data.content?.options?.find(
          (item) => item.value === modelId,
        );
        const price = typeof option?.price === "number" ? option.price : 0;
        return sum + Math.max(0, price);
      }, 0);
  }, [nodes]);

  const hasChatNode = useMemo(
    () => nodes.some((node) => node.type === "chatNode"),
    [nodes],
  );

  const isValidConnection = useIsValidConnection();

  const { handleReconnect, handleReconnectStart } = useReconnectEdge();

  const handleOnConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
    },
    [edges, setEdges],
  );

  const { theme } = useTheme();

  const colorMode = useMemo(() => {
    if (theme && ["system", "dark", "light"].includes(theme)) {
      return theme as ColorMode;
    }
    return "system";
  }, [theme]);

  const debouncedCheckValidGraph = useDebounce(() => {
    checkValidGraph({ nodes, edges });
    setLoading(false);
  }, 500);

  useEffect(() => {
    setLoading(true);
    debouncedCheckValidGraph();
  }, [nodes, edges, debouncedCheckValidGraph, setLoading]);

  useEffect(() => {
    setWorkflow(workflow ?? defaultWorkflowState);
  }, [setWorkflow, workflow]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Suspense>
          <FlowStartButton />
        </Suspense>
        <FlowLoadPresetButton />
        <FlowSaveButton />
        {hasChatNode ? (
          <Badge variant="secondary" className="h-9">
            예상 소모: {estimatedCredits.toLocaleString()} 크레딧
          </Badge>
        ) : null}
      </div>
      <ReactFlow
        snapToGrid
        snapGrid={[16, 16]}
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
        <FlowPresetGroupsOverlay />
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
