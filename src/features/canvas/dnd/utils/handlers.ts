import { DragEndEvent } from "@dnd-kit/core";

export const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  const data = active.data.current;
  if (data) {
    console.log("드롭된 사이드바 요소:", data);
  }

  const rect = active.rect.current.translated;
  if (over && rect) {
    const x = rect.left + rect.width / 2 - over.rect.left;
    const y = rect.top + rect.height / 2 - over.rect.top;

    console.log("드롭 위치(캔버스 기준):", { x, y });
  }
};
