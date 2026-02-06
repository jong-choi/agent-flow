"use client";

import { useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { FlowNodeContent } from "@/features/canvas/components/flow/flow-node/flow-node-content";
import { FlowNodeDeleteButton } from "@/features/canvas/components/flow/flow-node/flow-node-delete-button";
import { FlowNodeHandles } from "@/features/canvas/components/flow/flow-node/flow-node-handles";
import { Icons, isIconName } from "@/features/canvas/constants/icons";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { cn } from "@/lib/utils";

export function FlowNode({ data, id, type }: NodeProps<FlowCanvasNode>) {
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const handleClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);

  const IconComponent = isIconName(data.icon) ? Icons[data.icon] : Icons.Circle;

  return (
    <div
      className={cn(
        "relative w-[240px] cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl",
      )}
      onClick={handleClick}
    >
      <FlowNodeDeleteButton id={id} />

      {/* Header: Icon + Type + Title */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
            data.backgroundColor,
          )}
        >
          <IconComponent className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {type.replace("Node", "")}
          </div>
          <h4 className="truncate text-sm font-semibold">{data.label}</h4>
        </div>
      </div>

      {/* Description */}
      <p className="mb-3 w-full truncate text-[11px] text-muted-foreground">
        {data.description}
      </p>

      {/* Content (Select or Dialog) */}
      <FlowNodeContent content={data.content} id={id} nodeType={type} />

      {/* Handles */}
      <FlowNodeHandles handle={data.handle} />
    </div>
  );
}
