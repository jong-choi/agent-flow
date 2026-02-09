"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createChatFromWorkflow } from "@/features/chats/server/actions";

export function ChatStartButton({ workflowId }: { workflowId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const clickHandler = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const { chatId } = await createChatFromWorkflow({ workflowId });
      if (!chatId) {
        throw new Error("chat 생성에 실패하였습니다.");
      }
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
    <Button size="sm" type="button" onClick={clickHandler} disabled={loading}>
      {loading ? <Spinner className="size-3.5" /> : <Play />}
      <span className="sm:hidden md:block">채팅 시작</span>
    </Button>
  );
}
