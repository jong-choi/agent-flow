"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BoringCardAvatar } from "@/components/boring-avatar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  issueWorkflowCanvasIdAction,
  softDeleteWorkflowCanvasIdAction,
} from "@/features/developers/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { cn, formatYMD } from "@/lib/utils";

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

type SnippetTab = "agentflow" | "openai-chat" | "openai-responses";

const SECRET_PLACEHOLDER = "af-**********************";
const CANVAS_ID_PLACEHOLDER = "af-id-*******************";

export function WorkflowApiList({ workflows, baseUrl }: WorkflowApiListProps) {
  const t = useTranslations<AppMessageKeys>("Developers");
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WorkflowSummary | null>(null);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [snippetTab, setSnippetTab] = useState<SnippetTab>("agentflow");

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
    setSnippetTab("agentflow");
    setOpen(true);

    startTransition(async () => {
      try {
        const issued = await issueWorkflowCanvasIdAction({
          workflowId: workflow.id,
        });
        setCanvasId(issued.canvasId);
      } catch (error) {
        console.error(error);
        toast.error(t("workflowApi.toasts.issueFailed"));
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
        toast.success(t("workflowApi.toasts.rotated"));
      } catch (error) {
        console.error(error);
        toast.error(t("workflowApi.toasts.rotateFailed"));
      }
    });
  };

  const revokeCanvasId = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await softDeleteWorkflowCanvasIdAction({ workflowId: selected.id });
        setCanvasId(null);
        toast.success(t("workflowApi.toasts.revoked"));
      } catch (error) {
        console.error(error);
        toast.error(t("workflowApi.toasts.revokeFailed"));
      }
    });
  };

  const canvasIdValue = canvasId ?? CANVAS_ID_PLACEHOLDER;
  const agentFlowEndpoint = effectiveBaseUrl
    ? `${effectiveBaseUrl}/api/v1/chat`
    : "/api/v1/chat";
  const openAiBaseUrl = effectiveBaseUrl
    ? `${effectiveBaseUrl}/api/v1/openai`
    : "/api/v1/openai";
  const openAiChatEndpoint = `${openAiBaseUrl}/chat/completions`;
  const openAiResponsesEndpoint = `${openAiBaseUrl}/responses`;
  const samplePrompt = t("workflowApi.samples.prompt");

  const agentFlowCurlSnippet = `curl -X POST "${agentFlowEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-CANVAS-SECRET: ${SECRET_PLACEHOLDER}" \\
  -H "X-CANVAS-ID: ${canvasIdValue}" \\
  -d '{
    "message": "${samplePrompt}"
  }'`;

  const agentFlowJsSnippet = `await fetch("${agentFlowEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CANVAS-SECRET": "${SECRET_PLACEHOLDER}",
    "X-CANVAS-ID": "${canvasIdValue}"
  },
  body: JSON.stringify({
    message: "${samplePrompt}"
  })
});`;

  const openAiChatCurlSnippet = `curl -X POST "${openAiChatEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${SECRET_PLACEHOLDER}" \\
  -d '{
    "model": "${canvasIdValue}",
    "messages": [
      { "role": "user", "content": "${samplePrompt}" }
    ]
  }'`;

  const openAiChatSdkSnippet = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${SECRET_PLACEHOLDER}",
  baseURL: "${openAiBaseUrl}"
});

const result = await client.chat.completions.create({
  model: "${canvasIdValue}",
  messages: [{ role: "user", content: "${samplePrompt}" }]
});`;

  const openAiResponsesCurlSnippet = `curl -X POST "${openAiResponsesEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${SECRET_PLACEHOLDER}" \\
  -d '{
    "model": "${canvasIdValue}",
    "input": "${samplePrompt}"
  }'`;

  const openAiResponsesSdkSnippet = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${SECRET_PLACEHOLDER}",
  baseURL: "${openAiBaseUrl}"
});

const result = await client.responses.create({
  model: "${canvasIdValue}",
  input: "${samplePrompt}"
});`;

  const snippetMeta: Record<
    SnippetTab,
    {
      description: string;
      curl: string;
      scriptLabel: string;
      script: string;
    }
  > = {
    agentflow: {
      description: t("workflowApi.snippets.agentflow.description"),
      curl: agentFlowCurlSnippet,
      scriptLabel: t("workflowApi.snippets.agentflow.scriptLabel"),
      script: agentFlowJsSnippet,
    },
    "openai-chat": {
      description: t("workflowApi.snippets.openAiChat.description"),
      curl: openAiChatCurlSnippet,
      scriptLabel: t("workflowApi.snippets.openAiChat.scriptLabel"),
      script: openAiChatSdkSnippet,
    },
    "openai-responses": {
      description: t("workflowApi.snippets.openAiResponses.description"),
      curl: openAiResponsesCurlSnippet,
      scriptLabel: t("workflowApi.snippets.openAiResponses.scriptLabel"),
      script: openAiResponsesSdkSnippet,
    },
  };

  const activeSnippet = snippetMeta[snippetTab];

  return (
    <>
      {workflows.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("workflowApi.empty.title")}</CardTitle>
            <CardDescription>
              {t("workflowApi.empty.description")}
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
              className="rounded-lg text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            >
              <div className="flex h-full flex-col gap-1 rounded-lg border border-border/60 bg-background p-4 transition-colors hover:bg-primary/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 truncate text-sm font-semibold text-foreground">
                    {workflow.title}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {t("workflowApi.updatedAt", {
                      date: formatYMD(workflow.updatedAt),
                    })}
                  </div>
                </div>
                <div className="h-6 truncate text-sm text-foreground/80">
                  {workflow.description ?? t("common.noDescription")}
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
                    {t("workflowApi.viewCode")}
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
            setSnippetTab("agentflow");
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl" ariaDescribedby={descriptionId}>
          <DialogHeader>
            <DialogTitle>{selected?.title ?? t("meta.workflowApiTitle")}</DialogTitle>
            <DialogDescription id={descriptionId}>
              {t.rich("workflowApi.dialog.description", {
                code: (chunks) => <code>{chunks}</code>,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  {t("workflowApi.dialog.canvasIdLabel")}
                </div>
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
                    {t("workflowApi.dialog.rotate")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={revokeCanvasId}
                    disabled={!selected || isPending || !canvasId}
                  >
                    <Trash2 className="size-4" />
                    {t("workflowApi.dialog.revoke")}
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

            <div className="space-y-3">
              <div className="overflow-x-auto">
                <div className="inline-flex min-w-full gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
                  <SnippetTabButton
                    active={snippetTab === "agentflow"}
                    onClick={() => setSnippetTab("agentflow")}
                    label={t("workflowApi.tabs.agentflow")}
                  />
                  <SnippetTabButton
                    active={snippetTab === "openai-chat"}
                    onClick={() => setSnippetTab("openai-chat")}
                    label={t("workflowApi.tabs.openAiChat")}
                  />
                  <SnippetTabButton
                    active={snippetTab === "openai-responses"}
                    onClick={() => setSnippetTab("openai-responses")}
                    label={t("workflowApi.tabs.openAiResponses")}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {activeSnippet.description}
              </p>
              <ScrollArea className="h-[500px] min-h-0 overflow-auto">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t("workflowApi.curl")}</div>
                  <CodeBlock
                    code={activeSnippet.curl}
                    onCopy={() =>
                      navigator.clipboard.writeText(activeSnippet.curl)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold">
                    {activeSnippet.scriptLabel}
                  </div>
                  <CodeBlock
                    code={activeSnippet.script}
                    onCopy={() =>
                      navigator.clipboard.writeText(activeSnippet.script)
                    }
                  />
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <p className="text-xs text-muted-foreground">
              {t.rich("workflowApi.dialog.footer", {
                code: (chunks) => <code>{chunks}</code>,
              })}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SnippetTabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
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
  const t = useTranslations<AppMessageKeys>("Developers");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-muted",
        muted && "opacity-70",
      )}
    >
      <pre className="max-h-72 overflow-auto p-3 pr-10 text-xs leading-relaxed whitespace-pre-wrap">
        <code className="font-mono">{code}</code>
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground"
        aria-label={t("common.copy")}
        onClick={() => {
          onCopy();
          toast.success(t("common.toasts.copied"));
        }}
        disabled={copyDisabled}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
