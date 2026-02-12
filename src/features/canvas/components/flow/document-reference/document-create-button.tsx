"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createDocumentAction } from "@/features/documents/server/actions";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type DocumentCreateButtonProps = {
  onClose: () => void;
  onCreated: (docId: string) => void;
};

export function DocumentCreateButton({
  onClose,
  onCreated,
}: DocumentCreateButtonProps) {
  const t = useTranslations<AppMessageKeys>("Workflows");
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
          throw new Error(t("canvas.document.create.failedToast"));
        }

        onCreated(createdId);
        toast.success(t("canvas.document.create.successToast"));
      } catch {
        toast.error(t("canvas.document.create.failedToast"));
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
    t,
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
      {t("canvas.document.create.button")}
    </Button>
  );
}
