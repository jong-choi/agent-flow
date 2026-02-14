"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatPanelContainer({ children }: React.PropsWithChildren) {
  const t = useTranslations<AppMessageKeys>("Chat");
  const threadId = useCanvasStore((s) => s.threadId);
  const setThreadId = useCanvasStore((s) => s.setThreadId);

  return (
    <Dialog
      open={Boolean(threadId)}
      onOpenChange={(open) => {
        if (!open) setThreadId(null);
      }}
    >
      <DialogTitle className="sr-only">{t("dialog.chatPanelTitle")}</DialogTitle>
      <DialogContent
        className="h-[700px] w-[min(1200px,calc(100vw-2rem))] sm:max-w-7xl"
        ariaDescribedby="chat dialog"
      >
        <div className="h-full overflow-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
