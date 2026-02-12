import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getPresetLibraryForCanvasAction } from "@/features/presets/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const presetLibraryForCanvasQueryKey = ["preset", "library", "canvas"] as const;

type PresetLibrary = Awaited<
  ReturnType<typeof getPresetLibraryForCanvasAction>
>;

const EMPTY_PRESET_LIBRARY: PresetLibrary = [];

export const usePresetLibraryForCanvasQuery = (enabled: boolean) => {
  const t = useTranslations<AppMessageKeys>("Workflows");
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
        : t("canvas.loadPreset.errors.libraryLoadFailed");

    const isAuthError =
      message.includes("사용자 정보가 없습니다") ||
      /unauthorized|forbidden|no user|user.*(not|missing)/i.test(message);

    return isAuthError
      ? t("canvas.loadPreset.errors.loginRequired")
      : message;
  }, [query.error, t]);

  return { ...query, presets, errorMessage };
};
