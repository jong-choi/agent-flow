import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Background, type ColorMode, Controls } from "@xyflow/react";
import {
  INITIAL_EDGES,
  INITIAL_NODES,
  NODE_TYPE,
} from "@/features/canvas/constants/flow";

const ReactFlow = dynamic(
  () => import("@xyflow/react").then((m) => m.ReactFlow),
  { ssr: false },
);

export function FlowApp() {
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
      defaultNodes={INITIAL_NODES}
      defaultEdges={INITIAL_EDGES}
      nodeTypes={NODE_TYPE}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <Background gap={16} size={1} color="#e5e7eb" />
      <Controls position="bottom-left" />
    </ReactFlow>
  );
}
