import { getSidebarNodesWithOptions } from "@/db/query/sidebar-nodes";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { SidebarItemCard } from "@/features/canvas/components/sidebar/sidebar-item-card";

export async function SidebarContent() {
  const flowNodeList: SidebarNodeData[] = await getSidebarNodesWithOptions();

  return (
    <>
      {flowNodeList.map((item) => (
        <SidebarItemCard item={item} key={item.id} />
      ))}
    </>
  );
}
