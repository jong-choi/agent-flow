"use client";

import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { searchDocumentsByTitleAction } from "@/features/documents/server/actions";
import { useDebounce } from "@/hooks/use-debounce";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export type DocumentReferenceSuggestion = {
  id: string;
  title: string;
  content: string;
};

const MAX_SUGGESTIONS = 6;

const buildPreview = (content: string, emptyContentLabel: string) => {
  const MAX_TEXT_LEN = 40;
  let trimmed = content.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LEN);
  if (!trimmed) return emptyContentLabel;

  if (content.length > MAX_TEXT_LEN) {
    trimmed = trimmed + "...";
  }

  return trimmed;
};

export function DocumentReferencePicker({
  initialDocuments,
  isInitialLoading,
  isLoadingMore,
  hasMoreInitial,
  onLoadMoreInitial,
  onSelect,
}: {
  initialDocuments: DocumentReferenceSuggestion[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasMoreInitial: boolean;
  onLoadMoreInitial: () => void;
  onSelect: (docId: string) => void;
}) {
  const t = useTranslations<AppMessageKeys>("Workflows");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<
    DocumentReferenceSuggestion[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchDocumentsByTitleAction({
        query,
        limit: MAX_SUGGESTIONS,
      });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 400);

  const trimmedQuery = searchText.trim();
  const showingInitial = trimmedQuery.length === 0;

  const visibleDocuments = useMemo(() => {
    return showingInitial ? initialDocuments : searchResults;
  }, [initialDocuments, searchResults, showingInitial]);

  const isLoading = showingInitial ? isInitialLoading : isSearching;
  const shouldShowLoadMore = showingInitial && hasMoreInitial && !isLoading;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={(event) => {
            const value = event.target.value;
            setSearchText(value);

            const nextQuery = value.trim();
            if (!nextQuery) {
              setIsSearching(false);
              setSearchResults([]);
              return;
            }

            debouncedSearch(nextQuery);
          }}
          placeholder={t("canvas.document.picker.searchPlaceholder")}
          autoComplete="off"
        />
      </div>

      <div className="h-72 overflow-y-auto rounded-md border">
        <div className="flex min-h-full flex-col">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Spinner className="size-3" />
              {t("canvas.document.picker.loading")}
            </div>
          ) : null}

          {!isLoading && visibleDocuments.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {showingInitial
                ? t("canvas.document.picker.noDocuments")
                : t("canvas.document.picker.noSearchResults")}
            </div>
          ) : null}

          {visibleDocuments.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className="flex w-full grow-0 flex-col gap-1 border-b px-4 py-3 text-left text-sm transition hover:bg-accent"
              onClick={() => {
                onSelect(doc.id);
              }}
            >
              <span className="w-full truncate font-medium">{doc.title}</span>
              <span className="w-full text-xs">
                {buildPreview(
                  doc.content,
                  t("canvas.document.picker.emptyContent"),
                )}
              </span>
            </button>
          ))}

          {shouldShowLoadMore ? (
            <div className="mt-auto flex justify-center py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onLoadMoreInitial}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? <Spinner className="mr-2 size-4" /> : null}
                {t("canvas.document.picker.loadMore")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
