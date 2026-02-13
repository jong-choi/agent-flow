"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { type WorkflowEdge, type WorkflowNode } from "@/db/schema/workflows";

type CanvasPreviewProps = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

const CanvasPreviewClient = dynamic(
  () =>
    import(
      "@/features/canvas/components/cavas-preview/canvas-preview-client"
    ).then((m) => m.CanvasPreviewClient),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[200px] w-full rounded-lg border bg-background/70" />
    ),
  },
);

export function CanvasPreview({ nodes, edges }: CanvasPreviewProps) {
  return <CanvasPreviewClient nodes={nodes} edges={edges} />;
}
