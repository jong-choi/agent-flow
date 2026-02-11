"use client";

import { useLocale, useTranslations } from "next-intl";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { DraggableItem } from "@/features/canvas/components/dnd/draggable-item";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type SidebarItemCardProps = {
  item: SidebarNodeData;
};

type SidebarInfo = Omit<NonNullable<SidebarNodeData["information"]>, "id">;

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

export function SidebarItemCard({ item }: SidebarItemCardProps) {
  const locale = useLocale();
  const t = useTranslations<AppMessageKeys>("Nodes");
  const setSelectedInfo = useCanvasStore((s) => s.setSelectedInfo);

  const messageKey = nodeTypeMessageKey[item.type];
  const fallbackInformation: SidebarInfo = {
    nodeId: item.id,
    title: t(`node.${messageKey}.title`),
    summary: t(`node.${messageKey}.summary`),
    description: t(`node.${messageKey}.description`),
    guides: [
      t(`node.${messageKey}.guides.first`),
      t(`node.${messageKey}.guides.second`),
      t(`node.${messageKey}.guides.third`),
    ],
  };

  const handleOnMouseDown = () => {
    if (locale === "en") {
      setSelectedInfo(fallbackInformation);
      return;
    }

    if (item.information) {
      setSelectedInfo({
        nodeId: item.information.nodeId,
        title: item.information.title,
        summary: item.information.summary,
        description: item.information.description,
        guides: item.information.guides,
      });
      return;
    }

    setSelectedInfo(fallbackInformation);
  };

  return <DraggableItem item={item} onMouseDown={handleOnMouseDown} />;
}
