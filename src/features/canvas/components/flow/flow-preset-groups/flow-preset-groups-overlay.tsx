"use client";

import { useTranslations } from "next-intl";
import { ViewportPortal, useNodes } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { usePresetGroupBoxes } from "@/features/canvas/hooks/use-preset-group-boxes";
import { usePresetGroupDrag } from "@/features/canvas/hooks/use-preset-group-drag";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function FlowPresetGroupsOverlay() {
  const t = useTranslations<AppMessageKeys>("Workflows");
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
            {t("canvas.loadPreset.groupLabel")}
          </div>
        </div>
      ))}
    </ViewportPortal>
  );
}
