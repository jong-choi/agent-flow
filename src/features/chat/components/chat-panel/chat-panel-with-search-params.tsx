"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";

export function ChatPanelWithSearchParams({
  children,
}: React.PropsWithChildren) {
  const thread_id = useSearchParams().get("thread_id");
  const setSearchParams = useSetSearchParams();

  useEffect(() => {
    const controller = new AbortController();
    if (!thread_id) return;

    (async () => {
      const response = await fetch(`/api/chat/${thread_id}/health`, {
        signal: controller.signal,
      });

      if (response.ok) {
        return;
      }

      if (response.status === 400) {
        toast.error("채팅 시작 중 오류 : 그래프를 찾을 수 없습니다.");
      } else if (response.status === 404) {
        toast.error("채팅 시작 중 오류 : 세션을 찾을 수 없습니다.");
      }
      setSearchParams({ thread_id: null });
    })();

    return () => {
      controller.abort();
    };
  }, [setSearchParams, thread_id]);

  if (!thread_id) {
    return null;
  }

  return children;
}
