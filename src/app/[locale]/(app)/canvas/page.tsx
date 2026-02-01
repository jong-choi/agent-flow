import "@xyflow/react/dist/style.css";
import { DroppableZone } from "@/features/canvas/components/dnd/droppable-zone";
import { FlowApp } from "@/features/canvas/components/flow/flow-app";

export default function CanvasPage() {
  return (
    <DroppableZone>
      <FlowApp />
    </DroppableZone>
  );
}
