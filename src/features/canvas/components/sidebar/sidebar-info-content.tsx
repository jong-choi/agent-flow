"use client";

import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function SidebarInfoContent() {
  const selectedInfo = useCanvasStore((s) => s.selectedInfo);
  return <div className="h-full">{JSON.stringify(selectedInfo, null, 2)}</div>;
}
