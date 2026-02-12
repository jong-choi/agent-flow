"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createChatFromWorkflow } from "@/features/chats/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatStartButton({ workflowId }: { workflowId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations<AppMessageKeys>("Chat");

  const clickHandler = async () => {
    if (loading) return;
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
    <Button size="sm" type="button" onClick={clickHandler} disabled={loading}>
      {loading ? <Spinner className="size-3.5" /> : <Play />}
      <span className="sm:hidden md:block">{t("action.startChat")}</span>
    </Button>
  );
}
