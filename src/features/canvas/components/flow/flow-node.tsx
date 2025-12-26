import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  useReactFlow,
} from "@xyflow/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SidebarItemData } from "@/features/canvas/types/sidebar-item";

export function FlowNode({ data, id }: NodeProps<Node<SidebarItemData>>) {
  return (
    <Card className="w-48 cursor-pointer p-2 px-0">
      <CardHeader>
        <CardTitle>{data.label}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <FlowNodeContent content={data.content} id={id} />
      <FlowHandles handle={data.handle} />
    </Card>
  );
}

function FlowHandles({ handle }: { handle: SidebarItemData["handle"] }) {
  if (!handle) {
    return (
      <>
        <Handle type="target" id="target" position={Position.Left} />
        <Handle type="source" id="source" position={Position.Right} />
      </>
    );
  }

  const targetArr = handle.target ? Array(handle.target.count).fill(0) : null;
  const sourceArr = handle.source ? Array(handle.source.count).fill(0) : null;

  return (
    <>
      {!targetArr && (
        <Handle type="target" id="target" position={Position.Left} />
      )}
      {targetArr &&
        targetArr.map((e, i) => {
          const top = `${((i + 1) * 100) / (targetArr.length + 1)}%`;
          return (
            <Handle
              key={i}
              type="target"
              id={"target" + i}
              position={Position.Left}
              style={{ top }}
            />
          );
        })}
      {!sourceArr && (
        <Handle type="source" id="source" position={Position.Right} />
      )}
      {sourceArr &&
        sourceArr.map((e, i) => {
          const top = `${((i + 1) * 100) / (sourceArr.length + 1)}%`;
          return (
            <Handle
              key={i}
              type="source"
              id={"source" + i}
              position={Position.Right}
              style={{ top }}
            />
          );
        })}
    </>
  );
}

function FlowNodeContent({
  content,
  id,
}: {
  content: SidebarItemData["content"];
  id: string;
}) {
  const { updateNodeData } = useReactFlow<Node<SidebarItemData>>();

  if (!content) return null;

  const handleValueChange = (value: string) => {
    updateNodeData(id, { content: { ...content, value } });
  };

  if (content.type === "select") {
    return (
      <CardContent className="-mt-4">
        <Select onValueChange={handleValueChange} value={content.value}>
          <SelectTrigger>
            <SelectValue placeholder={content.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{content.label} </SelectLabel>
              {content.options.map((value) => {
                return (
                  <SelectItem value={value} key={value}>
                    {value}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    );
  }

  return null;
}
