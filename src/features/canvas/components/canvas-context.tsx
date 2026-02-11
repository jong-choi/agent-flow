"use client";

import { useCallback, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { flushSync } from "react-dom";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { DraggableItemView } from "@/features/canvas/components/dnd/draggable-item";
import { CANVAS_DROPPABLE_ID } from "@/features/canvas/components/dnd/droppable-zone";
import { useAddNode } from "@/features/canvas/hooks/use-add-node";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const nodeTypeMessageKey = {
  startNode: "start",
  endNode: "end",
  chatNode: "chat",
  promptNode: "prompt",
  searchNode: "search",
  documentNode: "document",
  splitNode: "split",
  mergeNode: "merge",
} as const;

export function CanvasContext({ children }: React.PropsWithChildren) {
  const locale = useLocale();
  const tNodes = useTranslations<AppMessageKeys>("Nodes");
  const tWorkflows = useTranslations<AppMessageKeys>("Workflows");
  const dndId = useId();
  const [activeItem, setActiveItem] = useState<SidebarNodeData | null>(null);

  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const addNode = useAddNode();
  const { screenToFlowPosition } = useCanvasReactFlow();

  const localizeNodeDataOnDrop = useCallback(
    (item: SidebarNodeData, nodeId: string): SidebarNodeData => {
      const nextContent = item.content
        ? {
            ...item.content,
            options: item.content.options?.map((option) => ({ ...option })),
          }
        : null;

      if (item.type === "documentNode" && nextContent?.type === "select") {
        nextContent.label = tWorkflows("canvas.nodePanel.labels.action");
        nextContent.placeholder = tWorkflows(
          "canvas.nodePanel.placeholders.action",
        );
      }

      if (item.type === "chatNode" && nextContent?.type === "select") {
        nextContent.placeholder = tWorkflows(
          "canvas.nodePanel.placeholders.agent",
        );
      }

      if (item.type === "promptNode" && nextContent?.type === "dialog") {
        nextContent.label = tWorkflows("canvas.nodePanel.labels.promptEdit");
        nextContent.dialogDescription = tWorkflows(
          "canvas.nodePanel.placeholders.promptInputHint",
        );
      }

      const nextInformation = item.information
        ? {
            ...item.information,
            guides: [...item.information.guides],
          }
        : null;

      const nextItem: SidebarNodeData = {
        ...item,
        id: nodeId,
        content: nextContent,
        handle: item.handle ? { ...item.handle } : null,
        information: nextInformation,
      };

      if (locale !== "en") {
        return nextItem;
      }

      const messageKey = nodeTypeMessageKey[item.type];

      return {
        ...nextItem,
        label: tNodes(`node.${messageKey}.label`),
        description: tNodes(`node.${messageKey}.summary`),
        information: nextInformation
          ? {
              ...nextInformation,
              title: tNodes(`node.${messageKey}.title`),
              summary: tNodes(`node.${messageKey}.summary`),
              description: tNodes(`node.${messageKey}.description`),
              guides: [
                tNodes(`node.${messageKey}.guides.first`),
                tNodes(`node.${messageKey}.guides.second`),
                tNodes(`node.${messageKey}.guides.third`),
              ],
            }
          : null,
      };
    },
    [locale, tNodes, tWorkflows],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;

    if (data) {
      setActiveItem(data as SidebarNodeData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    const data = active.data.current;
    const rect = active.rect.current.translated;

    if (over?.id === CANVAS_DROPPABLE_ID && data && rect) {
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      const nodeId = crypto.randomUUID();
      const nodeData = localizeNodeDataOnDrop(data as SidebarNodeData, nodeId);

      // addNode를 setSelectedNodeId보다 먼저 실행
      flushSync(() => {
        addNode(nodeData, position);
      });
      setSelectedNodeId(nodeId);
    }

    setActiveItem(null);
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveItem(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeItem ? <DraggableItemView item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
