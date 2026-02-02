"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ChatStartButton({ workflowId }: { workflowId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const clickHandler = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const response = await fetch("/api/chat/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, locale: "ko" }),
      });

      if (!response.ok) {
        throw new Error("채팅 생성에 실패하였습니다.");
      }

      const json: {
        data: { thread_id: string };
      } = await response.json();

      const threadId = json.data.thread_id;
      if (!threadId) {
        console.log(JSON.stringify(json.data));
        throw new Error("thread 생성에 실패하였습니다.");
      }
      router.push(`/chat/${threadId}`);
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
      채팅 시작
    </Button>
  );
}
