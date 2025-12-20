"use client";

import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CanvasContentContainer } from "@/features/canvas/components/canvas-contant-container";
import { CanvasSidebar } from "@/features/canvas/components/canvas-sidebar";
import { FlowCardNode } from "@/features/canvas/flow/components/flow-card-node";
import { useFlowCanvas } from "@/features/canvas/flow/hooks/use-flow-canvas";
import { type SidebarItem } from "@/features/canvas/types/sidebar-item";

const NODE_TYPE = { flowCard: FlowCardNode };

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "task", label: "업무", description: "할 일을 표현하는 노드" },
  { id: "decision", label: "결정", description: "분기 처리를 위한 노드" },
  { id: "api", label: "API", description: "외부 호출을 나타내는 노드" },
  { id: "note", label: "메모", description: "참고용 메모 블록" },
];

export function FlowApp() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleAddEdge,
    handleAddNode,
    flowWrapperRef,
    colorMode,
  } = useFlowCanvas();

  return (
    <>
      <CanvasSidebar>
        {SIDEBAR_ITEMS.map((item) => (
          <Card
            key={item.id}
            onClick={() => handleAddNode(item)}
            className="w-full cursor-pointer p-2 px-0"
          >
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </CanvasSidebar>
      <CanvasContentContainer>
        <div
          ref={flowWrapperRef}
          className="h-[70vh] overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <ReactFlow
            colorMode={colorMode}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleAddEdge}
            nodeTypes={NODE_TYPE}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            style={{ width: "100%", height: "100%" }}
          >
            <Background gap={16} size={1} color="#e5e7eb" />
            <Controls position="bottom-left" />
          </ReactFlow>
        </div>
      </CanvasContentContainer>
    </>
  );
}
