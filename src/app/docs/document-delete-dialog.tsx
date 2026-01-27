"use client";

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

type DocumentDeleteDialogProps = {
  docId: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function DocumentDeleteDialog({
  docId,
  deleteAction,
}: DocumentDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" type="button">
          삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>문서를 삭제하시겠어요?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제하면 문서 목록에서 숨겨집니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <form action={deleteAction}>
            <input type="hidden" name="docId" value={docId} />
            <AlertDialogAction type="submit">삭제</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
