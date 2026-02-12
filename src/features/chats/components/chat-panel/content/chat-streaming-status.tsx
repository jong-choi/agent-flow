import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";
import { type NodeType } from "@/features/canvas/constants/node-types";
import { useChatStore } from "@/features/chats/store/chat-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const MAX_STATUS_COUNT = 3;

export function ChatStreamingStatus() {
  const t = useTranslations<AppMessageKeys>("Chat");
  const isStreaming = useChatStore((s) => s.isStreaming);
  const runningNodes = useChatStore((s) => s.runningNodes);

  const statusLabels = useMemo(() => {
    const statusLabelByNodeType: Partial<Record<NodeType, string>> = {
      searchNode: t("status.searchNode"),
      documentNode: t("status.documentNode"),
      chatNode: t("status.chatNode"),
    };

    const labels: string[] = [];
    const seen = new Set<string>();

    for (const node of runningNodes) {
      const label = statusLabelByNodeType[node.type];
      if (!label || seen.has(label)) {
        continue;
      }

      labels.push(label);
      seen.add(label);

      if (labels.length >= MAX_STATUS_COUNT) {
        break;
      }
    }

    return labels;
  }, [runningNodes, t]);

  if (!isStreaming) {
    return <span className="text-xs text-muted-foreground">{t("status.idle")}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Spinner className="size-4" />
      <span>
        {statusLabels.length > 0 ? statusLabels.join(" · ") : t("status.processing")}
      </span>
    </span>
  );
}
