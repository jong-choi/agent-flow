"use client";

import { useState } from "react";
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
import { softDeleteChat } from "@/features/chats/server/actions";
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
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations<AppMessageKeys>("Chat");

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      await softDeleteChat({ chatId }).then(() => {
        if (isActive) {
          router.push("/chat");
        }
      });
      toast.success(t("toast.deleteSuccess"));
    } catch {
      toast.error(t("toast.deleteFailed"));
    } finally {
      setIsDeleting(false);
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
          <AlertDialogCancel disabled={isDeleting}>
            {t("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {t("action.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
