import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getPresetLibraryForCanvasAction } from "@/features/presets/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const PRESET_LIBRARY_PAGE_SIZE = 20;
const presetLibraryForCanvasQueryKey = (query: string) =>
  ["preset", "library", "canvas", query] as const;

type PresetLibraryPage = Awaited<
  ReturnType<typeof getPresetLibraryForCanvasAction>
>;

const EMPTY_PRESET_LIBRARY: PresetLibraryPage["items"] = [];

export const usePresetLibraryForCanvasQuery = ({
  enabled,
  query,
}: {
  enabled: boolean;
  query: string;
}) => {
  const t = useTranslations<AppMessageKeys>("Workflows");
  const normalizedQuery = query.trim();
  const queryResult = useInfiniteQuery({
    queryKey: presetLibraryForCanvasQueryKey(normalizedQuery),
    queryFn: ({ pageParam }) =>
      getPresetLibraryForCanvasAction({
        query: normalizedQuery,
        cursor:
          typeof pageParam === "string" && pageParam
            ? pageParam
            : undefined,
        limit: PRESET_LIBRARY_PAGE_SIZE,
      }),
    enabled,
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  });

  const presets =
    queryResult.data?.pages.flatMap((page) => page.items) ??
    EMPTY_PRESET_LIBRARY;

  const errorMessage = useMemo(() => {
    if (!queryResult.error) {
      return null;
    }

    const message =
      queryResult.error instanceof Error
        ? queryResult.error.message
        : t("canvas.loadPreset.errors.libraryLoadFailed");

    const isAuthError =
      message.includes("사용자 정보가 없습니다") ||
      /unauthorized|forbidden|no user|user.*(not|missing)/i.test(message);

    return isAuthError
      ? t("canvas.loadPreset.errors.loginRequired")
      : message;
  }, [queryResult.error, t]);

  return { ...queryResult, presets, errorMessage };
};
