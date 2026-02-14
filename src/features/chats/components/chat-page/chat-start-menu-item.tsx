"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useCreateChatFromWorkflowMutation } from "@/features/chats/lib/query/mutations";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatStartMenuItem({
  workflowId,
}: {
  workflowId?: string | null;
}) {
  const router = useRouter();
  const t = useTranslations<AppMessageKeys>("Chat");
  const createChatMutation = useCreateChatFromWorkflowMutation();

  const handleNewChat = async () => {
    if (!workflowId || createChatMutation.isPending) return;

    try {
      const { chatId } = await createChatMutation.mutateAsync({ workflowId });
      if (!chatId) {
        throw new Error(t("toast.createFailed"));
      }
      router.push(`/chat/${chatId}`);
    } catch {
      toast.error(t("toast.createFailed"));
    }
  };

  return (
    <DropdownMenuItem
      disabled={createChatMutation.isPending || !workflowId}
      onSelect={handleNewChat}
    >
      {createChatMutation.isPending && <Spinner className="size-3.5" />}
      {t("action.newChat")}
    </DropdownMenuItem>
  );
}
