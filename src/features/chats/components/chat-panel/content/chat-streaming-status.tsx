import { useMemo } from "react";
import { Spinner } from "@/components/ui/spinner";
import { type NodeType } from "@/features/canvas/constants/node-types";
import { useChatStore } from "@/features/chats/store/chat-store";

const MAX_STATUS_COUNT = 3;

const STATUS_LABEL_BY_NODE_TYPE: Partial<Record<NodeType, string>> = {
  searchNode: "검색 중",
  documentNode: "문서 읽는 중",
  chatNode: "응답 생성 중",
};

export function ChatStreamingStatus() {
  const isStreaming = useChatStore((s) => s.isStreaming);
  const runningNodes = useChatStore((s) => s.runningNodes);

  const statusLabels = useMemo(() => {
    const labels: string[] = [];
    const seen = new Set<string>();

    for (const node of runningNodes) {
      const label = STATUS_LABEL_BY_NODE_TYPE[node.type];
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
  }, [runningNodes]);

  if (!isStreaming) {
    return <span className="text-xs text-muted-foreground">대기 중</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Spinner className="size-4" />
      <span>
        {statusLabels.length > 0 ? statusLabels.join(" · ") : "처리 중"}
      </span>
    </span>
  );
}
