"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { useGraphSession } from "@/features/canvas/hooks/use-graph-session";

export function FlowSessionLoader() {
  const { getGraphSession, deleteGraphSession } = useGraphSession();
  const { setNodes, setEdges } = useReactFlow();
  const { id } = useParams();
  const workflowId = typeof id === "string" ? id : null;
  const [data, setData] = useState(getGraphSession({ workflowId }));

  if (!data || !data.nodes.length) return null;

  const handleLoad = () => {
    const { nodes, edges } = data;
    setNodes(nodes);
    setEdges(edges);
    deleteGraphSession({ workflowId });
    setData(null);
  };

  const handleDelete = () => {
    deleteGraphSession({ workflowId });
    setData(null);
  };

  return (
    <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-muted-foreground">
      <div>임시 저장된 그래프가 있습니다.</div>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-[11px] font-normal text-muted-foreground"
        onClick={handleLoad}
      >
        불러오기
      </Button>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-[11px] font-normal text-muted-foreground"
        onClick={handleDelete}
      >
        삭제하기
      </Button>
    </div>
  );
}
