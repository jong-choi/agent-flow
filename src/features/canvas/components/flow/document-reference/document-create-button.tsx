"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createDocumentAction } from "@/features/documents/server/actions";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

type DocumentCreateButtonProps = {
  onClose: () => void;
  onCreated: (docId: string) => void;
};

export function DocumentCreateButton({
  onClose,
  onCreated,
}: DocumentCreateButtonProps) {
  const isCreatingDocument = useCanvasStore((s) => s.isCreatingDocument);
  const setIsCreatingDocument = useCanvasStore((s) => s.setIsCreatingDocument);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const handleCreateAndLink = useCallback(() => {
    if (isCreatingDocument) {
      return;
    }

    setIsCreatingDocument(true);
    setSelectedNodeId(null);
    onClose();
    void (async () => {
      try {
        const createdId = await createDocumentAction();
        if (!createdId) {
          throw new Error("문서 생성에 실패하였습니다.");
        }

        onCreated(createdId);
        toast.success("문서가 연결되었습니다.");
      } catch {
        toast.error("문서 생성에 실패하였습니다.");
      } finally {
        setIsCreatingDocument(false);
      }
    })();
  }, [
    isCreatingDocument,
    onClose,
    onCreated,
    setIsCreatingDocument,
    setSelectedNodeId,
  ]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={handleCreateAndLink}
      disabled={isCreatingDocument}
    >
      새 문서로 연결
    </Button>
  );
}
