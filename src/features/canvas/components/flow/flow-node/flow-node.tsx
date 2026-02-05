"use client";
import { useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { FlowNodeContent } from "@/features/canvas/components/flow/flow-node/flow-node-content";
import { FlowNodeDeleteButton } from "@/features/canvas/components/flow/flow-node/flow-node-delete-button";
import { FlowNodeHandles } from "@/features/canvas/components/flow/flow-node/flow-node-handles";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { cn } from "@/lib/utils";

export function FlowNode({ data, id, type }: NodeProps<FlowCanvasNode>) {
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const handleClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);

  return (
    <Card
      className={cn(
        "relative cursor-pointer p-2 px-0",
        data.content?.type ? "w-56" : "w-48",
      )}
      onClick={handleClick}
    >
      <FlowNodeDeleteButton id={id} />
      <CardHeader>
        <CardTitle>{data.label}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <FlowNodeContent content={data.content} id={id} nodeType={type} />
      <FlowNodeHandles handle={data.handle} />
    </Card>
  );
}
