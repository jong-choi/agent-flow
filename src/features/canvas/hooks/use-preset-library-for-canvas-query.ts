import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPresetLibraryForCanvasAction } from "@/db/query/presets";

const presetLibraryForCanvasQueryKey = ["preset", "library", "canvas"] as const;

type PresetLibrary = Awaited<
  ReturnType<typeof getPresetLibraryForCanvasAction>
>;

const EMPTY_PRESET_LIBRARY: PresetLibrary = [];

export const usePresetLibraryForCanvasQuery = (enabled: boolean) => {
  const query = useQuery({
    queryKey: presetLibraryForCanvasQueryKey,
    queryFn: getPresetLibraryForCanvasAction,
    enabled,
  });

  const presets = query.data ?? EMPTY_PRESET_LIBRARY;

  const errorMessage = useMemo(() => {
    if (!query.error) {
      return null;
    }

    const message =
      query.error instanceof Error
        ? query.error.message
        : "프리셋 목록 로딩 실패";

    return message.includes("사용자 정보가 없습니다")
      ? "로그인이 필요합니다."
      : message;
  }, [query.error]);

  return { ...query, presets, errorMessage };
};
