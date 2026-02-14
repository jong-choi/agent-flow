"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCreateChatFromWorkflowMutation } from "@/features/chats/lib/query/mutations";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatStartButton({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const t = useTranslations<AppMessageKeys>("Chat");
  const createChatMutation = useCreateChatFromWorkflowMutation();

  const clickHandler = async () => {
    if (createChatMutation.isPending) return;

    try {
      const createdChat = await createChatMutation.mutateAsync({ workflowId });
      if (!createdChat.id) {
        throw new Error(t("toast.createFailed"));
      }
      router.push(`/chat/${createdChat.id}`);
    } catch {
      toast.error(t("toast.createFailed"));
    }
  };

  return (
    <Button
      size="sm"
      type="button"
      onClick={clickHandler}
      disabled={createChatMutation.isPending}
    >
      {createChatMutation.isPending ? <Spinner className="size-3.5" /> : <Play />}
      <span className="sm:hidden md:block">{t("action.startChat")}</span>
    </Button>
  );
}
