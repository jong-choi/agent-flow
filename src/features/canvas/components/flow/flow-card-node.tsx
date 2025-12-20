import { Handle, Position } from "@xyflow/react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SidebarItemData } from "@/features/canvas/types/sidebar-item";

export function FlowCardNode({ data }: { data: SidebarItemData }) {
  return (
    <Card className="w-48 cursor-pointer p-2 px-0">
      <CardHeader>
        <CardTitle>{data.label}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </Card>
  );
}
