"use client";

import { useCallback } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatPanelCloseButton() {
  const t = useTranslations<AppMessageKeys>("Chat");
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
      aria-label={t("action.closePanelAria")}
      onClick={handleClose}
    >
      <X />
    </Button>
  );
}
