"use client";

import { useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";

export function ChatPanelCloseButton() {
  const setSearchParams = useSetSearchParams();

  const handleClose = useCallback(() => {
    setSearchParams({ thread_id: null });
  }, [setSearchParams]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="mt-0.5 text-muted-foreground"
      aria-label="close chat panel"
      onClick={handleClose}
    >
      <X />
    </Button>
  );
}
