import { Handle, Position } from "@xyflow/react";
import { type FlowNodeData } from "@/db/query/sidebar-nodes";

export function FlowNodeHandles({
  handle,
}: {
  handle: FlowNodeData["handle"];
}) {
  if (!handle) {
    return (
      <>
        <Handle type="target" id="target" position={Position.Left} />
        <Handle type="source" id="source" position={Position.Right} />
      </>
    );
  }

  const { targetCount, sourceCount } = handle;

  return (
    <>
      {targetCount == null ? (
        <Handle type="target" id="target" position={Position.Left} />
      ) : (
        Array.from({ length: targetCount }).map((_e, i, arr) => {
          const top = `${((i + 1) * 100) / (arr.length + 1)}%`;
          return (
            <Handle
              key={i}
              type="target"
              id={"target" + i}
              position={Position.Left}
              style={{ top }}
            />
          );
        })
      )}
      {sourceCount == null ? (
        <Handle type="source" id="source" position={Position.Right} />
      ) : (
        Array.from({ length: sourceCount }).map((_e, i, arr) => {
          const top = `${((i + 1) * 100) / (arr.length + 1)}%`;
          return (
            <Handle
              key={i}
              type="source"
              id={"source" + i}
              position={Position.Right}
              style={{ top }}
            />
          );
        })
      )}
    </>
  );
}
