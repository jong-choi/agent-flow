"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function SidebarInfoContent() {
  const t = useTranslations<AppMessageKeys>("Nodes");
  const selectedInfo = useCanvasStore((s) => s.selectedInfo);

  const normalizedInfo = useMemo(() => {
    if (!selectedInfo) {
      return null;
    }

    if (selectedInfo.nodeId !== "0") {
      return selectedInfo;
    }

    return {
      ...selectedInfo,
      title: t("default.title"),
      summary: t("default.summary"),
      description: t("default.description"),
      guides: [
        t("default.guides.first"),
        t("default.guides.second"),
        t("default.guides.third"),
      ],
    };
  }, [selectedInfo, t]);

  if (!normalizedInfo) return null;

  return (
    <div
      key={normalizedInfo.nodeId}
      className="flex h-52 min-h-0 flex-col rounded-xl border border-muted bg-background py-3"
    >
      <div className="mb-2 flex shrink-0 items-center gap-2 px-3">
        <Info className="size-3 text-primary" />
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
          {normalizedInfo.title}
        </span>
      </div>
      <ScrollArea className="min-h-0 px-3">
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {normalizedInfo.summary}
          </p>

          {normalizedInfo.description && (
            <p className="border-t border-muted pt-2 text-[11px] leading-relaxed text-muted-foreground">
              {normalizedInfo.description}
            </p>
          )}
        </div>

        {normalizedInfo.guides && normalizedInfo.guides.length > 0 && (
          <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-muted pt-2">
            <ul className="space-y-1">
              {normalizedInfo.guides.map((guide, index) => (
                <li
                  key={index}
                  className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-muted" />
                  {guide}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
