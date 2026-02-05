"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { BoringCardAvatar } from "@/components/boring-avatar";
import {
  issueWorkflowCanvasIdAction,
  softDeleteWorkflowCanvasIdAction,
} from "@/db/query/secrets";
import { cn, formatKoreanDate } from "@/lib/utils";

type WorkflowSummary = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
};

type WorkflowApiListProps = {
  workflows: WorkflowSummary[];
  baseUrl: string;
};

const SECRET_PLACEHOLDER = "lc-**********************";
const CANVAS_ID_PLACEHOLDER = "lc-id-*******************";

export function WorkflowApiList({ workflows, baseUrl }: WorkflowApiListProps) {
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WorkflowSummary | null>(null);
  const [canvasId, setCanvasId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const effectiveBaseUrl = useMemo(() => {
    const normalized = (baseUrl || "").trim().replace(/\/$/, "");
    if (normalized) {
      return normalized;
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  }, [baseUrl]);

  const openWorkflow = (workflow: WorkflowSummary) => {
    setSelected(workflow);
    setCanvasId(null);
    setOpen(true);

    startTransition(async () => {
      try {
        const issued = await issueWorkflowCanvasIdAction({
          workflowId: workflow.id,
        });
        setCanvasId(issued.canvasId);
      } catch (error) {
        console.error(error);
        toast.error("워크플로우 ID 발급에 실패했습니다.");
      }
    });
  };

  const rotateCanvasId = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        const issued = await issueWorkflowCanvasIdAction({
          workflowId: selected.id,
          rotate: true,
        });
        setCanvasId(issued.canvasId);
        toast.success("새 X-CANVAS-ID가 발급되었습니다.");
      } catch (error) {
        console.error(error);
        toast.error("재발급에 실패했습니다.");
      }
    });
  };

  const revokeCanvasId = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await softDeleteWorkflowCanvasIdAction({ workflowId: selected.id });
        setCanvasId(null);
        toast.success("비활성화되었습니다.");
      } catch (error) {
        console.error(error);
        toast.error("비활성화에 실패했습니다.");
      }
    });
  };

  const canvasIdValue = canvasId ?? CANVAS_ID_PLACEHOLDER;
  const endpoint = effectiveBaseUrl
    ? `${effectiveBaseUrl}/api/v1/chat`
    : "/api/v1/chat";

  const curlSnippet = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-CANVAS-SECRET: ${SECRET_PLACEHOLDER}" \\
  -H "X-CANVAS-ID: ${canvasIdValue}" \\
  -d '{
    "message": "강아지 키우는 법을 검색해줘"
  }'`;

  const jsSnippet = `await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CANVAS-SECRET": "${SECRET_PLACEHOLDER}",
    "X-CANVAS-ID": "${canvasIdValue}"
  },
  body: JSON.stringify({
    message: "강아지 키우는 법을 검색해줘"
  })
});`;

  return (
    <>
      {workflows.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>워크플로우가 없습니다</CardTitle>
            <CardDescription>
              먼저 캔버스에서 워크플로우를 만들어 주세요.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflows.map((workflow) => (
            <button
              key={workflow.id}
              type="button"
              onClick={() => openWorkflow(workflow)}
              className="rounded-lg text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex h-full flex-col gap-1 rounded-lg border border-border/60 bg-background p-4 transition-colors hover:bg-primary/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 truncate text-sm font-semibold text-foreground">
                    {workflow.title}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    업데이트 {formatKoreanDate(workflow.updatedAt)}
                  </div>
                </div>
                <div className="h-6 truncate text-sm text-foreground/80">
                  {workflow.description ?? "설명이 없습니다."}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="mb-1">
                    <BoringCardAvatar
                      seed={workflow.id}
                      variant="bauhaus"
                      square={false}
                      className="size-8"
                    />
                  </div>
                  <div className="text-xs font-medium text-primary">
                    API 코드 보기
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setSelected(null);
            setCanvasId(null);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          ariaDescribedby={descriptionId}
        >
          <DialogHeader>
            <DialogTitle>{selected?.title ?? "워크플로우 API"}</DialogTitle>
            <DialogDescription id={descriptionId}>
              <code>X-CANVAS-ID</code>는 워크플로우별로 발급됩니다.{" "}
              <code>X-CANVAS-SECRET</code>는 서비스 키입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">X-CANVAS-ID</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={rotateCanvasId}
                    disabled={!selected || isPending}
                  >
                    {isPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                    재발급
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={revokeCanvasId}
                    disabled={!selected || isPending || !canvasId}
                  >
                    <Trash2 className="size-4" />
                    비활성화
                  </Button>
                </div>
              </div>

              <CodeBlock
                code={canvasIdValue}
                muted={!canvasId}
                onCopy={() => navigator.clipboard.writeText(canvasIdValue)}
                copyDisabled={!canvasId}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">cURL</div>
              <CodeBlock
                code={curlSnippet}
                onCopy={() => navigator.clipboard.writeText(curlSnippet)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">JavaScript</div>
              <CodeBlock
                code={jsSnippet}
                onCopy={() => navigator.clipboard.writeText(jsSnippet)}
              />
            </div>
          </div>

          <DialogFooter>
            <p className="text-xs text-muted-foreground">
              서비스 키는 <code>/developers</code>에서 발급 후 보관해 주세요.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CodeBlock({
  code,
  onCopy,
  copyDisabled,
  muted,
}: {
  code: string;
  onCopy: () => void;
  copyDisabled?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-muted",
        muted && "opacity-70",
      )}
    >
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-3 pr-10 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground"
        aria-label="copy"
        onClick={() => {
          onCopy();
          toast.success("복사되었습니다.");
        }}
        disabled={copyDisabled}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
