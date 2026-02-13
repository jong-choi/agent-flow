"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteChatMutation } from "@/features/chats/lib/query/mutations";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type ChatSidebarDeleteDialogProps = {
  chatId: string;
  isActive: boolean;
  open: boolean;
  setIsOpen: (value: boolean) => void;
};

export function ChatSidebarDeleteDialog({
  chatId,
  isActive,
  open,
  setIsOpen,
}: ChatSidebarDeleteDialogProps) {
  const t = useTranslations<AppMessageKeys>("Chat");
  const router = useRouter();
  const deleteChatMutation = useDeleteChatMutation();

  const handleDelete = async () => {
    if (deleteChatMutation.isPending) return;

    try {
      await deleteChatMutation.mutateAsync({ chatId });
      if (isActive) {
        router.push("/chat");
      }
      toast.success(t("toast.deleteSuccess"));
    } catch {
      toast.error(t("toast.deleteFailed"));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialog.chatDeleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialog.chatDeleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteChatMutation.isPending}>
            {t("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void handleDelete();
            }}
            disabled={deleteChatMutation.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {t("action.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
