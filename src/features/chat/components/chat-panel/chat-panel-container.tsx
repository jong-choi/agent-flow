"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";

export function ChatPanelContainer({ children }: React.PropsWithChildren) {
  const setSearchParams = useSetSearchParams();

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) setSearchParams({ thread_id: null });
      }}
    >
      <DialogTitle className="sr-only">채팅 다이알로그</DialogTitle>
      <DialogContent className="h-[700px] w-[min(1200px,calc(100vw-2rem))] sm:max-w-7xl">
        <div className="h-full w-4xl overflow-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
