"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
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
import {
  PageContentTitle,
  PageDescription,
  PageHeader,
} from "@/components/page-template";
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
import { useGraphSession } from "@/features/canvas/hooks/use-graph-session";
import { useIsValidConnection } from "@/features/canvas/hooks/use-is-valid-connection";
import { useReconnectEdge } from "@/features/canvas/hooks/use-reconnect-edge";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import {
  type WorkflowState,
  defaultWorkflowState,
} from "@/features/canvas/store/slices/workflow-slice";
import { useDebounce } from "@/hooks/use-debounce";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { usePathname } from "@/lib/i18n/navigation";

const ReactFlow = dynamic<ReactFlowProps<FlowCanvasNode, Edge>>(
  () => import("@xyflow/react").then((m) => m.ReactFlow),
  { ssr: false },
);

const FlowSessionLoader = dynamic(
  () =>
    import("@/features/canvas/components/flow/flow-session-loader").then(
      (m) => m.FlowSessionLoader,
    ),
  { ssr: false },
);

type FlowAppProps = {
  initialNodes?: FlowCanvasNode[];
  initialEdges?: Edge[];
  workflow?: WorkflowState;
};

export function FlowAppWithRemount(props: FlowAppProps) {
  const pathname = usePathname();

  return <FlowApp key={pathname} {...props} />;
}

function FlowApp({
  initialNodes = INITIAL_NODES,
  initialEdges = INITIAL_EDGES,
  workflow,
}: FlowAppProps) {
  const t = useTranslations<AppMessageKeys>("Workflows");
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const checkValidGraph = useCheckValidGraph();
  const { saveGraphSession } = useGraphSession();
  const setLoading = useCanvasStore((s) => s.setIsStartLoading);
  const setWorkflow = useCanvasStore((s) => s.setWorkflow);
  const workflowId = useCanvasStore((s) => s.workflow.id);
  const isValidGraph = useCanvasStore((s) => s.isValidGraph);
  const isValidGraphMessage = useCanvasStore((s) => s.isValidGraphMessage);
  const title = useCanvasStore((s) => s.workflow.title.trim());
  const description = useCanvasStore((s) => s.workflow.description?.trim());

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
    saveGraphSession({ workflowId, nodes, edges });
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
    <div className="relative h-full w-full" data-testid="flow-canvas">
      <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
        <div className="flex flex-col items-start gap-3 rounded-lg bg-muted/50 p-4 backdrop-blur-sm">
          <PageHeader className="flex min-w-sm flex-col gap-1">
            <PageContentTitle>
              {title || t("canvas.header.newWorkflow")}
            </PageContentTitle>
            <PageDescription>
              {description || t("canvas.header.noDescription")}
            </PageDescription>
          </PageHeader>
          <div className="flex items-center gap-2">
            <Suspense>
              <FlowStartButton />
            </Suspense>
            <FlowLoadPresetButton />
            <FlowSaveButton />
          </div>
        </div>
        <FlowSessionLoader />
        {!isValidGraph && isValidGraphMessage ? (
          <p className="px-1 text-xs text-muted-foreground">
            {t(`canvas.validation.${isValidGraphMessage}`)}
          </p>
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
        fitView={true}
        fitViewOptions={{ padding: 0.5 }}
        proOptions={{ hideAttribution: true }}
        style={{ width: "100%", height: "100%" }}
        onConnect={handleOnConnect}
        onReconnect={handleReconnect}
        onReconnectStart={handleReconnectStart}
        isValidConnection={isValidConnection}
        defaultEdgeOptions={{
          animated: true,
          style: {
            strokeWidth: 1.5,
            animation: "dashdraw 2s linear infinite",
          },
        }}
      >
        <FlowPresetGroupsOverlay />
        <Background
          gap={32}
          size={1}
          color={theme === "dark" ? "#262626" : "#e5e5e5"}
        />
        <Controls position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
