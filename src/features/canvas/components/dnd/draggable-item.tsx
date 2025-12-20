import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SidebarItem } from "@/features/canvas/types/sidebar-item";

type DraggableItemProps = {
  item: SidebarItem;
  onClick: React.MouseEventHandler<HTMLDivElement>;
};

export function DraggableItem({ item, onClick }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: item,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={onClick}
      className="w-full cursor-pointer p-2 px-0"
    >
      <CardHeader>
        <CardTitle>{item.label}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
