"use client";

import { useCallback, useState } from "react";
import { Link2Off } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
import { DocumentCreateButton } from "@/features/canvas/components/flow/document-reference/document-create-button";
import { DocumentReferencePicker } from "@/features/canvas/components/flow/document-reference/document-reference-picker";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import {
  getDocumentTitleByIdAction,
  getRecentDocumentsForPickerPageAction,
} from "@/features/documents/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const DOCUMENT_PICKER_PAGE_SIZE = 20;

export function DocumentReferenceDialog({
  referenceId,
  onChange,
  triggerLabel,
}: {
  referenceId: string | null | undefined;
  onChange: (nextReferenceId: string | null) => void;
  triggerLabel?: string;
}) {
  const t = useTranslations<AppMessageKeys>("Workflows");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isCreatingDocument = useCanvasStore((s) => s.isCreatingDocument);
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const resolvedReferenceId = referenceId?.trim() ? referenceId.trim() : null;

  const {
    data: initialPages,
    isLoading: isLoadingInitial,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["documents", "recent", "picker"],
    queryFn: ({ pageParam }) =>
      getRecentDocumentsForPickerPageAction({
        cursor:
          typeof pageParam === "string" && pageParam ? pageParam : undefined,
        limit: DOCUMENT_PICKER_PAGE_SIZE,
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    enabled: open,
  });

  const initialDocuments =
    initialPages?.pages.flatMap((page) => page.items) ?? [];

  const { data: connectedTitle, isFetching: isFetchingTitle } = useQuery({
    queryKey: ["documents", "title", resolvedReferenceId],
    queryFn: () => getDocumentTitleByIdAction({ docId: resolvedReferenceId! }),
    enabled: Boolean(resolvedReferenceId),
  });

  const resolvedTriggerLabel =
    triggerLabel ?? t("canvas.document.reference.triggerLabel");
  const triggerText = resolvedReferenceId
    ? isFetchingTitle
      ? ""
      : connectedTitle?.trim() || resolvedTriggerLabel
    : resolvedTriggerLabel;

  const handleCreated = useCallback(
    (docId: string) => {
      onChange(docId);

      void queryClient.invalidateQueries({
        queryKey: ["documents", "recent", "picker"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["documents", "title"],
      });
    },
    [onChange, queryClient],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={resolvedReferenceId ? "outline" : "default"}
            className="min-w-0 flex-1"
            size="sm"
            title={triggerText}
            disabled={isCreatingDocument || isFetchingTitle}
          >
            <span className="min-w-0 truncate text-sm">{triggerText}</span>
          </Button>
        </DialogTrigger>
        {resolvedReferenceId ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onChange(null)}
            title={t("canvas.document.reference.unlink")}
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
          <DialogTitle>
            {t("canvas.document.reference.dialogTitle")}
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <DocumentReferencePicker
            initialDocuments={initialDocuments}
            isInitialLoading={isLoadingInitial}
            isLoadingMore={isFetchingNextPage}
            hasMoreInitial={hasNextPage}
            onLoadMoreInitial={() => void fetchNextPage()}
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
              {t("canvas.document.reference.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
