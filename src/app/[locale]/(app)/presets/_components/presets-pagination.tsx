import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  buildQueryString,
  type QueryDefaults,
  type QueryParams,
} from "@/features/chat/utils/query-string";

type PresetsPaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  params: QueryParams;
  defaults?: QueryDefaults;
};

const buildPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage - 1 > 1) {
    pages.add(currentPage - 1);
  }
  if (currentPage + 1 < totalPages) {
    pages.add(currentPage + 1);
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

export function PresetsPagination({
  basePath,
  currentPage,
  totalPages,
  params,
  defaults,
}: PresetsPaginationProps) {
  if (totalPages <= 1) return null;

  const paginationItems = buildPaginationItems(currentPage, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        {currentPage > 1 ? (
          <PaginationItem>
            <PaginationPrevious
              href={`${basePath}${buildQueryString(
                params,
                { page: String(currentPage - 1) },
                defaults,
              )}`}
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
                href={`${basePath}${buildQueryString(
                  params,
                  { page: String(item) },
                  defaults,
                )}`}
                isActive={item === currentPage}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        {currentPage < totalPages ? (
          <PaginationItem>
            <PaginationNext
              href={`${basePath}${buildQueryString(
                params,
                { page: String(currentPage + 1) },
                defaults,
              )}`}
            />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
