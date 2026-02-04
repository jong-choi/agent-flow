"use client";

import { ViewportPortal, useNodes } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { usePresetGroupBoxes } from "@/features/canvas/hooks/use-preset-group-boxes";
import { usePresetGroupDrag } from "@/features/canvas/hooks/use-preset-group-drag";

export function FlowPresetGroupsOverlay() {
  const nodes = useNodes<FlowCanvasNode>();
  const groups = usePresetGroupBoxes(nodes);
  const handlePointerDown = usePresetGroupDrag();

  if (groups.length === 0) {
    return null;
  }

  return (
    <ViewportPortal>
      {groups.map((group) => (
        <div
          key={group.key}
          className="pointer-events-none absolute rounded-lg border border-dashed border-primary/40 bg-primary/5"
          style={{
            transform: `translate(${group.x}px, ${group.y}px)`,
            width: group.width,
            height: group.height,
          }}
        >
          <div
            className="pointer-events-auto absolute top-2 left-2 cursor-move rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow select-none"
            onPointerDown={(event) => handlePointerDown(group, event)}
          >
            프리셋
          </div>
        </div>
      ))}
    </ViewportPortal>
  );
}
