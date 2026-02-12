"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatPanelContainer({ children }: React.PropsWithChildren) {
  const t = useTranslations<AppMessageKeys>("Chat");
  const setSearchParams = useSetSearchParams();

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) setSearchParams({ thread_id: null });
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
