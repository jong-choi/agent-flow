import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { SidebarItemCard } from "@/features/canvas/components/sidebar/sidebar-item-card";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function SidebarContent({
  params,
}: {
  params: LayoutProps<"/[locale]/workflows/canvas">["params"];
}) {
  const { locale } = await params;
  const flowNodeList: SidebarNodeData[] = await getSidebarNodesWithOptions(
    resolveMetadataLocale(locale),
  );

  return (
    <>
      {flowNodeList.map((item) => (
        <SidebarItemCard item={item} key={item.id} />
      ))}
    </>
  );
}
