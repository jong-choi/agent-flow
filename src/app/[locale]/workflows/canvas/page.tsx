import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import "@xyflow/react/dist/style.css";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale, withMetadataSuffix } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows/canvas">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Workflows",
  });
  const title = t("meta.canvasTitle");

  return {
    title: withMetadataSuffix(title, "CANVAS"),
  };
}

export default function CanvasPage() {
  return (
    <DroppableZone>
      <FlowApp />
    </DroppableZone>
  );
}
