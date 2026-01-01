import { type Node, type NodeProps } from "@xyflow/react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SidebarNodeData } from "@/db/query/sidebar-nodes";
import { FlowNodeContent } from "@/features/canvas/components/flow/flow-node/flow-node-content";
import { FlowNodeDeleteButton } from "@/features/canvas/components/flow/flow-node/flow-node-delete-button";
import { FlowNodeHandles } from "@/features/canvas/components/flow/flow-node/flow-node-handles";

export function FlowNode({ data, id }: NodeProps<Node<SidebarNodeData>>) {
  return (
    <Card className="relative w-48 cursor-pointer p-2 px-0">
      <FlowNodeDeleteButton id={id} />
      <CardHeader>
        <CardTitle>{data.label}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <FlowNodeContent content={data.content} id={id} />
      <FlowNodeHandles handle={data.handle} />
    </Card>
  );
}
