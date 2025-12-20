import { DraggableItem } from "@/features/canvas/components/dnd/draggable-item";
import { useAddNode } from "@/features/canvas/hooks/use-add-node";
import { type SidebarItem } from "@/features/canvas/types/sidebar-item";

type SidebarItemCardProps = {
  item: SidebarItem;
};

export function SidebarItemCard({ item }: SidebarItemCardProps) {
  const addNode = useAddNode();

  const handleOnClick = () => {
    addNode(item, {
      x: 180 + Math.floor(Math.random() * 50),
      y: 140 - 100 + Math.floor(Math.random() * 20),
    });
  };

  return <DraggableItem item={item} onClick={handleOnClick} />;
}
