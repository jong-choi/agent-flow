"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { createChatFromWorkflow } from "@/features/chats/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatStartMenuItem({
  workflowId,
}: {
  workflowId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations<AppMessageKeys>("Chat");

  const handleNewChat = async () => {
    if (!workflowId || loading) return;

    try {
      setLoading(true);
      const { chatId } = await createChatFromWorkflow({ workflowId });
      if (!chatId) {
        throw new Error(t("toast.createFailed"));
      }
      router.push(`/chat/${chatId}`);
    } catch {
      toast.error(t("toast.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      disabled={loading || !workflowId}
      onSelect={handleNewChat}
    >
      {loading && <Spinner className="size-3.5" />}
      {t("action.newChat")}
    </DropdownMenuItem>
  );
}
