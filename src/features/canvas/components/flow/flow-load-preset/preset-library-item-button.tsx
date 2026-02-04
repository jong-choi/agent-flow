"use client";

import { BoringCardAvatar } from "@/components/boring-avatar";
import { Spinner } from "@/components/ui/spinner";
import type { getPresetLibraryForCanvasAction } from "@/db/query/presets";

type PresetLibraryItem = Awaited<
  ReturnType<typeof getPresetLibraryForCanvasAction>
>[number];

export function PresetLibraryItemButton({
  preset,
  disabled,
  isPending,
  onSelect,
}: {
  preset: PresetLibraryItem;
  disabled: boolean;
  isPending: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
    >
      <BoringCardAvatar
        seed={preset.id}
        size={32}
        square={false}
        className="size-8 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{preset.title}</span>
          {isPending ? <Spinner className="size-4" /> : null}
        </div>
        {preset.summary ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {preset.summary}
          </p>
        ) : null}
      </div>
    </button>
  );
}
