import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type WorkflowEdge, type WorkflowNode } from "@/db/schema/workflows";
import { CanvasPreview } from "@/features/canvas/components/cavas-preview/canvas-preview";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function WorkflowDataView({
  locale,
  nodes,
  edges,
}: {
  locale: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Workflows",
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("dataView.graphPreviewTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CanvasPreview nodes={nodes} edges={edges} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("dataView.nodeListTitle")}</CardTitle>
          <CardDescription>{t("dataView.nodeListDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dataView.noNodes")}
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
                      {node.description ?? t("dataView.noNodeDescription")}
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
          <CardTitle>{t("dataView.summaryTitle")}</CardTitle>
          <CardDescription>{t("dataView.summaryDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("dataView.nodeLabel")}
              </span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("dataView.edgeLabel")}
              </span>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
