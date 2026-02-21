"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { type ChatCreateThreadRequest } from "@/app/api/chat/temporary/route";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import {
  ApiClientError,
  isApiClientError,
  parseApiErrorPayload,
  resolveApiToastMessage,
} from "@/lib/errors/api-client-error";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function FlowStartButton() {
  const t = useTranslations<AppMessageKeys>("Workflows");
  const isValidGraph = useCanvasStore((s) => s.isValidGraph);
  const loading = useCanvasStore((s) => s.isStartLoading);
  const setLoading = useCanvasStore((s) => s.setIsStartLoading);
  const threadId = useCanvasStore((s) => s.threadId);
  const setThreadId = useCanvasStore((s) => s.setThreadId);
  const { getEdges, getNodes } = useCanvasReactFlow();

  const disabled = !isValidGraph || !!threadId || loading;

  const handleStart = useCallback(async () => {
    if (loading || !isValidGraph || threadId) return;

    setLoading(true);

    const edges = getEdges();
    const nodes = getNodes();

    try {
      const requestBody: ChatCreateThreadRequest = { nodes, edges };

      const response = await fetch("/api/chat/temporary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const parsedError = parseApiErrorPayload(payload);
        if (parsedError) {
          throw new ApiClientError(parsedError);
        }
        throw new ApiClientError({
          message: t("toast.createFailed"),
          type: "invalid_request_error",
          code: "invalid_request",
        });
      }

      const payload = (await response.json()) as {
        data?: { thread_id?: string };
      };
      const nextThreadId = payload?.data?.thread_id;

      if (!nextThreadId) {
        throw new ApiClientError({
          message: t("toast.missingThreadId"),
          type: "invalid_request_error",
          code: "missing_thread_id",
        });
      }

      setThreadId(nextThreadId);
    } catch (error) {
      console.error("Error while starting chat:", error);
      toast.error(
        resolveApiToastMessage({
          t,
          code: isApiClientError(error) ? error.payload.code : undefined,
          fallbackKey: "toast.fallback",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    isValidGraph,
    threadId,
    setLoading,
    setThreadId,
    getEdges,
    getNodes,
    t,
  ]);

  return (
    <Button
      type="button"
      className="min-w-24"
      disabled={disabled}
      onClick={handleStart}
    >
      {loading ? <Spinner className="size-4" /> : t("canvas.actions.startChat")}
    </Button>
  );
}
