"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { searchDocumentsByTitleAction } from "@/features/documents/server/actions";
import { useDebounce } from "@/hooks/use-debounce";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type DocumentSuggestion = {
  id: string;
  title: string;
  content: string;
};

const MAX_SUGGESTIONS = 6;

export function DocumentsSearch() {
  const t = useTranslations<AppMessageKeys>("Docs");
  const router = useRouter();
  const searchParams = useSearchParams();
  const appliedQuery = searchParams.get("q") ?? "";

  const [searchText, setSearchText] = useState(appliedQuery);
  const [suggestions, setSuggestions] = useState<DocumentSuggestion[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchText(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const buildPreview = (content: string) => {
    const trimmed = content.replace(/\s+/g, " ").trim();
    if (trimmed.length <= 50) {
      return trimmed;
    }
    return `${trimmed.slice(0, 50)}…`;
  };

  const fetchSuggestions = useCallback(async (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      setSuggestions([]);
      setIsLoading(false);
      setIsSuggestOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const results = await searchDocumentsByTitleAction({
        query: normalized,
        limit: MAX_SUGGESTIONS,
      });
      setSuggestions(results);
      setIsSuggestOpen(true);
    } catch {
      setSuggestions([]);
      setIsSuggestOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSuggest = useDebounce((value: string) => {
    void fetchSuggestions(value);
  }, 500);

  const handleSearchSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    params.delete("page");
    params.delete("cursor");
    params.delete("dir");
    const queryString = params.toString();
    router.push(queryString ? `/docs?${queryString}` : "/docs");
    setIsSuggestOpen(false);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (searchText.trim()) {
      setIsSuggestOpen(true);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsSuggestOpen(false);
    }, 120);
  };

  return (
    <form
      className="relative ml-auto w-full max-w-md"
      onSubmit={handleSearchSubmit}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(event) => {
              const value = event.target.value;
              setSearchText(value);
              debouncedSuggest(value);
              const trimmed = value.trim();
              if (!trimmed) {
                setSuggestions([]);
                setIsSuggestOpen(false);
                setIsLoading(false);
                return;
              }
              setIsSuggestOpen(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={t("search.placeholder")}
            className="pl-9"
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("search.submit")}
        </Button>
      </div>
      {isSuggestOpen ? (
        <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-lg border bg-background shadow-md">
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Spinner className="size-3" />
                {t("search.loading")}
              </div>
            ) : null}
            {!isLoading && suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                {t("search.noResults")}
              </div>
            ) : null}
            {suggestions.map((doc) => (
              <Link
                key={doc.id}
                href={`/docs/${doc.id}`}
                className="flex w-full flex-col gap-1 border-b px-4 py-3 text-left text-sm transition hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsSuggestOpen(false)}
              >
                <span className="font-medium">{doc.title}</span>
                <span className="text-xs text-muted-foreground">
                  {buildPreview(doc.content)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
