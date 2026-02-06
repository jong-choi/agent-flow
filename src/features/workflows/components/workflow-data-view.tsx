import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type WorkflowEdge, type WorkflowNode } from "@/db/schema/workflows";
import { CanvasPreview } from "@/features/canvas/components/flow/cavas-preview/canvas-preview";

export function WorkflowDataView({
  nodes,
  edges,
}: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>그래프 프리뷰</CardTitle>
        </CardHeader>
        <CardContent>
          <CanvasPreview nodes={nodes} edges={edges} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>노드 목록</CardTitle>
          <CardDescription>
            워크플로우에 포함된 노드를 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              노드가 아직 없습니다.
            </p>
          ) : (
            <div className="scrollbar-slim max-h-80 space-y-3 overflow-auto pr-2">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-start justify-between gap-4 rounded-lg border bg-background/70 px-3 py-2"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{node.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {node.description ?? "설명이 없습니다."}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {node.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>워크플로우 요약</CardTitle>
          <CardDescription>그래프 통계와 기록</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">노드</span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">엣지</span>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
