import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";
import { resolveMetadataLocale, withMetadataSuffix } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/workflows/canvas">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const title = locale === "ko" ? "캔버스" : "Canvas";

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
