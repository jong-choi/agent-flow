"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateChatTagsAction } from "@/features/chats/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

export function PresetChatExampleRefreshButton() {
  const router = useRouter();
  const t = useTranslations<AppMessageKeys>("Presets");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      await updateChatTagsAction();
      router.refresh();
    } catch (error) {
      toast.error(t("chatExampleCard.refreshFailed"));
      console.error("Failed to refresh chat examples:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, router, t]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="group"
      title={t("chatExampleCard.refreshTitle")}
      aria-label={t("chatExampleCard.refreshAriaLabel")}
      onClick={() => void handleRefresh()}
      disabled={isRefreshing}
    >
      <RefreshCw
        className={cn(
          "size-4 text-muted-foreground transition-transform duration-200 group-hover:rotate-90",
          isRefreshing && "animate-spin",
        )}
      />
    </Button>
  );
}
