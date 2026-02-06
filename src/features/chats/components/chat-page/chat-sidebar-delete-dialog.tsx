"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  chatListQueryKey,
  type ChatListResponse,
} from "@/features/chats/components/chat-page/chat-queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { softDeleteChat } from "@/features/chats/server/actions";

type ChatSidebarDeleteDialogProps = {
  chatId: string;
  isActive: boolean;
};

export function ChatSidebarDeleteDialog({
  chatId,
  isActive,
}: ChatSidebarDeleteDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    const previous =
      queryClient.getQueryData<ChatListResponse>(chatListQueryKey);

    queryClient.setQueryData<ChatListResponse>(chatListQueryKey, (old) => {
      if (!old) return old;
      return { ...old, data: old.data.filter((item) => item.id !== chatId) };
    });

    try {
      await softDeleteChat({ chatId });
      toast.success("채팅을 삭제했어요.");
      if (isActive) {
        router.push("/chat");
      }
    } catch (error) {
      if (previous) {
        queryClient.setQueryData(chatListQueryKey, previous);
      }
      const message =
        error instanceof Error ? error.message : "채팅 삭제에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem variant="destructive">삭제</DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>채팅을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제한 채팅은 복구할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
