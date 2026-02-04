"use client";

import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { searchDocumentsByTitle } from "@/db/query/documents";
import { useDebounce } from "@/hooks/use-debounce";

export type DocumentReferenceSuggestion = {
  id: string;
  title: string;
  content: string;
};

const MAX_SUGGESTIONS = 6;

const buildPreview = (content: string) => {
  const MAX_TEXT_LEN = 40;
  let trimmed = content.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LEN);
  if (!trimmed) return "내용이 없습니다.";

  if (content.length > MAX_TEXT_LEN) {
    trimmed = trimmed + "...";
  }

  return trimmed;
};

export function DocumentReferencePicker({
  initialDocuments,
  isInitialLoading,
  onSelect,
}: {
  initialDocuments: DocumentReferenceSuggestion[];
  isInitialLoading: boolean;
  onSelect: (docId: string) => void;
}) {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<
    DocumentReferenceSuggestion[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchDocumentsByTitle(query, MAX_SUGGESTIONS);
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
          placeholder="문서 제목으로 검색"
          autoComplete="off"
        />
      </div>

      <div className="h-72 overflow-y-auto rounded-md border">
        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Spinner className="size-3" />
            불러오는 중...
          </div>
        ) : null}

        {!isLoading && visibleDocuments.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            {showingInitial ? "문서가 없습니다." : "검색 결과가 없습니다."}
          </div>
        ) : null}

        {visibleDocuments.map((doc) => (
          <button
            key={doc.id}
            type="button"
            className="flex w-full grow-0 flex-col gap-1 border-b px-4 py-3 text-left text-sm transition hover:bg-accent"
            onClick={() => onSelect(doc.id)}
          >
            <span className="w-full truncate font-medium">{doc.title}</span>
            <span className="w-full text-xs">{buildPreview(doc.content)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
