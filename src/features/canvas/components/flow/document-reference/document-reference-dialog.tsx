"use client";

import { useCallback, useState } from "react";
import { Link2Off } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getDocumentTitleById,
  getRecentDocumentsForPicker,
} from "@/db/query/documents";
import { DocumentCreateButton } from "@/features/canvas/components/flow/document-reference/document-create-button";
import { DocumentReferencePicker } from "@/features/canvas/components/flow/document-reference/document-reference-picker";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

const MAX_SUGGESTIONS = 6;

export function DocumentReferenceDialog({
  referenceId,
  onChange,
  triggerLabel = "문서연결",
}: {
  referenceId: string | null | undefined;
  onChange: (nextReferenceId: string | null) => void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const isCreatingDocument = useCanvasStore((s) => s.isCreatingDocument);
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const resolvedReferenceId = referenceId?.trim() ? referenceId.trim() : null;

  const { data: initialDocuments = [], isLoading: isLoadingInitial } = useQuery(
    {
      queryKey: ["documents", "recent", "picker", MAX_SUGGESTIONS],
      queryFn: () => getRecentDocumentsForPicker(MAX_SUGGESTIONS),
    },
  );

  const { data: connectedTitle, isFetching: isFetchingTitle } = useQuery({
    queryKey: ["documents", "title", resolvedReferenceId],
    queryFn: () => getDocumentTitleById({ docId: resolvedReferenceId! }),
    enabled: Boolean(resolvedReferenceId),
  });

  const triggerText = resolvedReferenceId
    ? isFetchingTitle
      ? ""
      : connectedTitle?.trim()
    : triggerLabel;

  const handleCreated = useCallback(
    (docId: string) => {
      onChange(docId);
    },
    [onChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={resolvedReferenceId ? "outline" : "default"}
            className="min-w-0 flex-1"
            title={triggerText}
            disabled={isCreatingDocument}
          >
            <span className="min-w-0 truncate">{triggerText}</span>
          </Button>
        </DialogTrigger>
        {resolvedReferenceId ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onChange(null)}
            title="연결 해제"
          >
            <Link2Off className="size-4" />
          </Button>
        ) : null}
      </div>

      <DialogContent
        className="sm:max-w-lg"
        ariaDescribedby="document reference picker"
      >
        <DialogHeader>
          <DialogTitle>문서 선택</DialogTitle>
        </DialogHeader>

        {open ? (
          <DocumentReferencePicker
            initialDocuments={initialDocuments}
            isInitialLoading={isLoadingInitial}
            onSelect={(docId) => {
              onChange(docId);
              setOpen(false);
            }}
          />
        ) : null}

        <DialogFooter className="sm:justify-end">
          <div className="flex items-center justify-start">
            <DocumentCreateButton
              onClose={() => setOpen(false)}
              onCreated={handleCreated}
            />
          </div>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              닫기
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
