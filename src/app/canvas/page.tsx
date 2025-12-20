"use client";

import { useId } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DraggableItem } from "@/features/canvas/components/dnd/draggable-item";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { CanvasContainer } from "@/features/canvas/components/ui/canvas-container";
import { CanvasSidebar } from "@/features/canvas/components/ui/canvas-sidebar";
import { useFlowCanvas } from "@/features/canvas/hooks/use-flow-canvas";
import { type SidebarItem } from "@/features/canvas/types/sidebar-item";
import { NODE_TYPE } from "@/features/canvas/utils/flow";

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "task",
    label: "업무",
    description: "할 일을 표현하는 노드",
    type: "flowCard",
  },
  {
    id: "decision",
    label: "결정",
    description: "분기 처리를 위한 노드",
    type: "flowCard",
  },
  {
    id: "api",
    label: "API",
    description: "외부 호출을 나타내는 노드",
    type: "flowCard",
  },
  {
    id: "note",
    label: "메모",
    description: "참고용 메모 블록",
    type: "flowCard",
  },
];

export default function CanvasPage() {
  const dndId = useId();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleAddEdge,
    handleAddNode,
    flowWrapperRef,
    colorMode,
    screenToFlowPosition,
  } = useFlowCanvas();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;

    const data = active.data.current;
    const rect = active.rect.current.translated;

    // 드랍된 화면 위치를 기준으로 xyflow 캔버스에 노드 추가
    if (data && rect) {
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      return handleAddNode(data as SidebarItem, position);
    }
  };

  const addNodeToCenter = (item: SidebarItem) => {
    const rect = flowWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 드랍된 화면 위치를 기준으로 xyflow 캔버스에 노드 추가
    const center = screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    return handleAddNode(item, center);
  };

  return (
    <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
      <CanvasSidebar>
        {SIDEBAR_ITEMS.map((item) => (
          <div key={item.id} onClick={() => addNodeToCenter(item)}>
            <DraggableItem item={item} />
          </div>
        ))}
      </CanvasSidebar>
      <CanvasContainer>
        <DroppableZone>
          <div
            ref={flowWrapperRef}
            className="h-[70vh] overflow-hidden rounded-xl bg-card shadow-sm"
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
        </DroppableZone>
      </CanvasContainer>
    </DndContext>
  );
}
