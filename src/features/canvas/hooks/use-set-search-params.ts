import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SearchParamKeys = "thread_id";
type Entries = Partial<Record<SearchParamKeys, string | null | undefined>>;

export function useSetSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setSearchParams = useCallback(
    (entries: Entries) => {
      const params = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(entries)) {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return setSearchParams;
}
