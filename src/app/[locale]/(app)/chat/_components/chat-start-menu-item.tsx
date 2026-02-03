"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { chatListQueryKey } from "@/app/[locale]/(app)/chat/_components/chat-queries";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { createChatFromWorkflow } from "@/db/query/chat";

export function ChatStartMenuItem({
  workflowId,
}: {
  workflowId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleNewChat = async () => {
    if (!workflowId || loading) return;

    try {
      setLoading(true);
      const { chatId } = await createChatFromWorkflow({ workflowId });
      if (!chatId) {
        throw new Error("chat 생성에 실패하였습니다.");
      }
      await queryClient.refetchQueries({ queryKey: chatListQueryKey });
      router.push(`/chat/${chatId}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      disabled={loading || !workflowId}
      onSelect={handleNewChat}
    >
      {loading && <Spinner className="size-3.5" />}새 채팅
    </DropdownMenuItem>
  );
}
