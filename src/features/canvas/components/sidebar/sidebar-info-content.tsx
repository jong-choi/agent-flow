"use client";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function SidebarInfoContent() {
  const selectedInfo = useCanvasStore((s) => s.selectedInfo);

  return (
    <ScrollArea key={selectedInfo.nodeId} className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{selectedInfo.title}</CardTitle>
        <CardDescription className="text-xs">
          {selectedInfo.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">설명</h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {selectedInfo.description}
          </p>
        </div>
        {selectedInfo.guides && selectedInfo.guides.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">가이드</h4>
            <ul className="space-y-1.5">
              {selectedInfo.guides.map((guide, index) => (
                <li
                  key={index}
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  • {guide}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </ScrollArea>
  );
}
