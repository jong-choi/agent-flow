import { SidebarItemCard } from "@/features/canvas/components/sidebar/sidebar-item-card";
import { SIDEBAR_ITEMS } from "@/features/canvas/constants/node-data";

export async function SidebarContent() {
  const flowNodeList = SIDEBAR_ITEMS;
  return (
    <>
      {flowNodeList.map((item) => (
        <SidebarItemCard item={item} key={item.id} />
      ))}
    </>
  );
}
