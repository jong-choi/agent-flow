"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { deleteDocumentAction } from "@/features/documents/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type DocumentDeleteDialogProps = {
  docId: string;
};

export function DocumentDeleteDialog({ docId }: DocumentDeleteDialogProps) {
  const t = useTranslations<AppMessageKeys>("Docs");

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" type="button">
          <Trash2 className="size-4" />
          {t("deleteDialog.openButton")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <form action={deleteDocumentAction}>
            <input type="hidden" name="docId" value={docId} />
            <AlertDialogAction type="submit">
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
