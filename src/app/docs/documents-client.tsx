"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Clock, FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { formatKoreanDate } from "@/lib/utils";

type DocumentSummary = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type DocumentsClientProps = {
  documents: DocumentSummary[];
  createDocument: () => Promise<string | null>;
  currentPage: number;
  totalPages: number;
};

const sortOptions = [
  { label: "최근 업데이트 순", value: "recent" },
  { label: "최신순", value: "latest" },
  { label: "오래된 순", value: "oldest" },
  { label: "이름 순", value: "name" },
] as const;

const buildPreview = (content: string) => {
  const trimmed = content.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 50) {
    return trimmed;
  }
  return `${trimmed.slice(0, 50)}…`;
};

export function DocumentsClient({
  documents,
  createDocument,
  currentPage,
  totalPages,
}: DocumentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appliedQuery = searchParams.get("q") ?? "";
  const rawSort = searchParams.get("sort");
  const appliedSort = (
    sortOptions.some((option) => option.value === rawSort) ? rawSort : "recent"
  ) as "recent" | "latest" | "oldest" | "name";

  const [searchText, setSearchText] = useState(appliedQuery);
  const [suggestions, setSuggestions] = useState<DocumentSummary[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();

  useEffect(() => {
    setSearchText(appliedQuery);
  }, [appliedQuery]);

  const buildQueryString = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(overrides).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    return params.toString();
  };

  const debouncedSuggest = useDebounce((value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      return;
    }

    const matches = documents
      .filter((doc) => doc.title.toLowerCase().includes(normalized))
      .slice(0, 6);

    setSuggestions(matches);
    setIsSuggestOpen(true);
  }, 500);

  const handleSortChange = (value: "recent" | "latest" | "oldest" | "name") => {
    const query = buildQueryString({
      sort: value === "recent" ? null : value,
      page: null,
    });
    router.push(query ? `/docs?${query}` : "/docs");
  };

  const handleResetFilters = () => {
    router.push("/docs");
    setIsSuggestOpen(false);
  };

  const handleSearchSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = searchText.trim();
    const query = buildQueryString({ q: trimmed || null, page: null });
    router.push(query ? `/docs?${query}` : "/docs");
    setIsSuggestOpen(false);
  };

  const handlePageChange = (nextPage: number) => {
    const query = buildQueryString({
      page: nextPage === 1 ? null : String(nextPage),
    });
    router.push(query ? `/docs?${query}` : "/docs");
  };

  const buildPaginationItems = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, total, current]);
    if (current - 1 > 1) {
      pages.add(current - 1);
    }
    if (current + 1 < total) {
      pages.add(current + 1);
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const items: Array<number | "ellipsis"> = [];
    let lastPage = 0;

    sortedPages.forEach((page) => {
      if (page - lastPage > 1) {
        if (page - lastPage === 2) {
          items.push(lastPage + 1);
        } else {
          items.push("ellipsis");
        }
      }
      items.push(page);
      lastPage = page;
    });

    return items;
  };

  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const handleCreate = () => {
    startCreateTransition(async () => {
      const id = await createDocument();
      if (id) {
        router.push(`/docs/edit/${id}`);
      }
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">내 문서</p>
            <h1 className="text-2xl font-semibold">문서 관리</h1>
            <p className="text-sm text-muted-foreground">
              작성한 문서와 최신 내용을 빠르게 확인하세요.
            </p>
          </div>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <Spinner className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            새 문서
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">정렬</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleResetFilters}
              >
                초기화
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    appliedSort === option.value ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() => handleSortChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <form
            className="relative w-full max-w-md"
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
                  }}
                  placeholder="문서 제목으로 검색"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                검색
              </Button>
            </div>
            {isSuggestOpen ? (
              <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-lg border bg-background shadow-md">
                {suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {appliedQuery
                      ? "검색 결과가 없습니다."
                      : "작성한 문서가 없습니다"}
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {suggestions.map((doc) => (
                      <Link
                        key={doc.id}
                        href={`/docs/${doc.id}`}
                        className="flex w-full flex-col gap-1 border-b px-4 py-3 text-left text-sm transition hover:bg-accent"
                        onClick={() => setIsSuggestOpen(false)}
                      >
                        <span className="font-medium">{doc.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {buildPreview(doc.content)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </form>
        </div>

        <Separator />

        <div className="grid gap-4 lg:grid-cols-2">
          {documents.length === 0 ? (
            <Card className="col-span-2 bg-background">
              <CardHeader>
                <CardTitle>
                  {appliedQuery ? "검색 결과 없음" : "작성한 문서 없음"}
                </CardTitle>
                <CardDescription>
                  {appliedQuery
                    ? "다른 키워드로 다시 검색해 주세요."
                    : "문서를 작성해보세요."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id} className="bg-background">
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="size-4 text-muted-foreground" />
                      {doc.title}
                    </CardTitle>
                    <CardDescription>
                      {buildPreview(doc.content)}
                    </CardDescription>
                  </div>
                  <CardAction>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/docs/${doc.id}`}>
                        보기
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>업데이트 {formatKoreanDate(doc.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {totalPages > 1 ? (
          <Pagination>
            <PaginationContent>
              {currentPage > 1 ? (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/docs${buildQueryString({
                      page: String(currentPage - 1),
                    })}`}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                  />
                </PaginationItem>
              ) : null}
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href={`/docs${buildQueryString({
                        page: item === 1 ? null : String(item),
                      })}`}
                      isActive={item === currentPage}
                      onClick={(event) => {
                        event.preventDefault();
                        handlePageChange(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              {currentPage < totalPages ? (
                <PaginationItem>
                  <PaginationNext
                    href={`/docs${buildQueryString({
                      page: String(currentPage + 1),
                    })}`}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              ) : null}
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  );
}
