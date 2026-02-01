"use client";

import {
  PageContentTitle,
  PageDescription,
  PageHeader,
} from "@/components/page-template";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function CanvasContainer({ children }: { children: React.ReactNode }) {
  const title = useCanvasStore((s) => s.workflow.title.trim());
  const description = useCanvasStore((s) => s.workflow.description?.trim());

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <PageHeader>
        <PageContentTitle>{title || "새 워크플로우"}</PageContentTitle>
        <PageDescription>
          {description || "설명이 기재되지 않았습니다"}
        </PageDescription>
      </PageHeader>
      {children}
    </div>
  );
}
