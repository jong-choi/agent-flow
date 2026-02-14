"use client";

import { type ReactNode, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type Control, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateNodeInternals } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type FlowNodeData } from "@/db/types/sidebar-nodes";
import { DocumentReferenceDialog } from "@/features/canvas/components/flow/document-reference/document-reference-dialog";
import { Icons, isIconName } from "@/features/canvas/constants/icons";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import {
  handleCountRefine,
  pruneEdgesForHandleCount,
} from "@/features/canvas/utils/canvas-node-panel";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { sanitizeString } from "@/lib/utils";

type FormValues = {
  label: string;
  description: string;
  contentValue: string;
  contentReferenceId?: string;
  targetCount: string;
  sourceCount: string;
};

type WorkflowsTranslator = ReturnType<typeof useTranslations>;

const createFormSchema = (t: WorkflowsTranslator) =>
  z.object({
    label: z.string().min(1, t("canvas.nodePanel.validation.nameRequired")),
    description: z.string(),
    contentValue: z.string(),
    contentReferenceId: z.string().optional(),
    targetCount: z
      .string()
      .refine(handleCountRefine, t("canvas.nodePanel.validation.handleRange")),
    sourceCount: z
      .string()
      .refine(handleCountRefine, t("canvas.nodePanel.validation.handleRange")),
  });

export function CanvasNodePanelContent({
  selectedNodeId,
}: {
  selectedNodeId: string;
}) {
  const { getNode } = useCanvasReactFlow();
  const node = getNode(selectedNodeId)!;
  const locale = useLocale();
  const t = useTranslations<AppMessageKeys>("Workflows");
  const { updateNodeData, getEdges, setEdges } = useCanvasReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const data = node.data;
  const IconComponent = isIconName(data.icon) ? Icons[data.icon] : Icons.Circle;
  const { label, description, content, handle } = data;
  const { targetCount, sourceCount } =
    handle != null ? handle : { targetCount: null, sourceCount: null };

  const isTargetCount = targetCount != null;
  const isSourceHandle = sourceCount != null;

  const targetCountEditable = isTargetCount && targetCount > 0;
  const sourceCountEditable = isSourceHandle && sourceCount > 0;

  const contentLabel = useMemo(() => {
    if (!data.content) return null;
    if (node.type === "documentNode") {
      return t("canvas.nodePanel.labels.action");
    }
    return data.content.type === "select"
      ? t("canvas.nodePanel.labels.selectValue")
      : t("canvas.nodePanel.labels.dialogValue");
  }, [data.content, node.type, t]);

  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      label,
      description,
      contentValue: content?.value ?? "",
      contentReferenceId:
        typeof content?.referenceId === "string" ? content.referenceId : "",
      targetCount: String(targetCount ?? ""),
      sourceCount: String(sourceCount ?? ""),
    },
  });

  const handleSubmit = useCallback(
    (values: FormValues) => {
      const sanitizedLabel = sanitizeString(values.label);
      const nextContentValue =
        values.contentValue === "" ? null : values.contentValue;
      const nextContent = data.content ? { ...data.content } : null;

      if (nextContent) {
        nextContent.value = nextContentValue;
        if (node.type === "documentNode") {
          const normalized = values.contentReferenceId?.trim() ?? "";
          nextContent.referenceId = normalized.length > 0 ? normalized : null;
        }
      }

      const nextHandle = data.handle ? { ...data.handle } : null;

      const edges = getEdges();
      let nextEdges = edges;
      let shouldUpdateEdges = false;

      let nextTargetCount = targetCount;
      if (nextHandle && targetCountEditable) {
        nextTargetCount = parseInt(values.targetCount);
        nextHandle.targetCount = nextTargetCount;
        if (nextTargetCount < targetCount) {
          const { shouldUpdate, nextEdges: prunedEdges } =
            pruneEdgesForHandleCount(nextEdges, {
              nodeId: node.id,
              kind: "target",
              nextCount: nextTargetCount,
            });
          shouldUpdateEdges = shouldUpdate;
          nextEdges = prunedEdges;
        }
      }

      let nextSourceCount = sourceCount;
      if (nextHandle && sourceCountEditable) {
        nextSourceCount = parseInt(values.sourceCount);
        nextHandle.sourceCount = nextSourceCount;
        if (nextSourceCount < sourceCount) {
          const { shouldUpdate, nextEdges: prunedEdges } =
            pruneEdgesForHandleCount(nextEdges, {
              nodeId: node.id,
              kind: "source",
              nextCount: nextSourceCount,
            });
          shouldUpdateEdges = shouldUpdate;
          nextEdges = prunedEdges;
        }
      }

      updateNodeData(node.id, {
        label: sanitizedLabel,
        description: values.description,
        content: nextContent,
        handle: nextHandle,
      });

      if (shouldUpdateEdges) {
        setEdges(nextEdges);
      }

      // edge 재졍렬
      updateNodeInternals(node.id);
    },
    [
      data.content,
      data.handle,
      getEdges,
      node.id,
      node.type,
      setEdges,
      sourceCount,
      sourceCountEditable,
      targetCount,
      targetCountEditable,
      updateNodeData,
      updateNodeInternals,
    ],
  );

  return (
    <div className="ml-1 flex h-full flex-col border bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="fixed size-8 self-end text-muted-foreground hover:text-foreground"
        onClick={() => setSelectedNodeId(null)}
      >
        <X className="size-4" />
      </Button>
      <div className="mt-4 flex items-center justify-between px-4">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold">
          <div
            className={`flex size-6 shrink-0 items-center justify-center rounded-md text-white ${data.backgroundColor}`}
          >
            <IconComponent className="size-3.5" />
          </div>
          <span className="truncate">{data.label}</span>
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <section className="flex flex-col gap-6 p-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-6"
            >
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-[12px] font-bold text-muted-foreground">
                      {t("canvas.nodePanel.labels.name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("canvas.nodePanel.placeholders.name")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-[12px] font-bold text-muted-foreground">
                      {t("canvas.nodePanel.labels.description")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          "canvas.nodePanel.placeholders.description",
                        )}
                        className="h-[100px] resize-none overflow-y-auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {data.content ? (
                <ContentContentFormField
                  control={form.control}
                  content={data.content}
                  label={contentLabel ?? ""}
                  creditsLabel={t("canvas.nodePanel.labels.credits")}
                  isDocumentNode={node.type === "documentNode"}
                  isKoreanLocale={locale === "ko"}
                />
              ) : null}

              {node.type === "documentNode" && data.content ? (
                <FormField
                  control={form.control}
                  name="contentReferenceId"
                  render={({ field }) => (
                    <FormItem className="gap-1">
                      <FormLabel className="text-[12px] font-bold text-muted-foreground">
                        {t("canvas.nodePanel.labels.documentReference")}
                      </FormLabel>
                      <FormControl>
                        <DocumentReferenceDialog
                          referenceId={field.value}
                          onChange={(nextReferenceId) =>
                            field.onChange(nextReferenceId ?? "")
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : null}

              {data.handle && (targetCountEditable || sourceCountEditable) ? (
                <FormItem className="gap-1">
                  <FormLabel className="text-[12px] font-bold text-muted-foreground">
                    {t("canvas.nodePanel.labels.handles")}
                  </FormLabel>
                  <div className="grid gap-4 pt-2">
                    <HandleCountFormField
                      control={form.control}
                      name="targetCount"
                      label={t("canvas.nodePanel.labels.targetInputs")}
                      disabled={!targetCountEditable}
                    />
                    <HandleCountFormField
                      control={form.control}
                      name="sourceCount"
                      label={t("canvas.nodePanel.labels.sourceOutputs")}
                      disabled={!sourceCountEditable}
                    />
                  </div>
                </FormItem>
              ) : null}
              <Separator />
              <div>
                <Button type="submit" className="w-full">
                  {t("canvas.nodePanel.save")}
                </Button>
              </div>
            </form>
          </Form>
        </section>
      </ScrollArea>
    </div>
  );
}

function HandleCountFormField({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<FormValues>;
  name: "targetCount" | "sourceCount";
  label: string;
  disabled: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="mb-2 flex items-center justify-between">
            <FormLabel className="text-xs font-normal text-muted-foreground">
              {label}
            </FormLabel>
            <span className="font-mono text-xs text-primary">
              {field.value}
            </span>
          </div>
          <FormControl>
            <Input
              type="range"
              min={1}
              max={5}
              disabled={disabled}
              className="accent-primary"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ContentContentFormField({
  control,
  content,
  label,
  creditsLabel,
  isDocumentNode,
  isKoreanLocale,
}: {
  control: Control<FormValues>;
  content: NonNullable<FlowNodeData["content"]>;
  label: string;
  creditsLabel: string;
  isDocumentNode: boolean;
  isKoreanLocale: boolean;
}) {
  return (
    <FormField
      control={control}
      name="contentValue"
      render={({ field }) => {
        let contentInput: ReactNode;

        switch (content.type) {
          case "select":
            contentInput = (
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder={content.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{content.label}</SelectLabel>
                    {content.options?.map((option) => {
                      const optionLabel =
                        isDocumentNode && !isKoreanLocale
                          ? option.id
                          : option.value;

                      return (
                        <SelectItem value={option.value} key={option.id}>
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="truncate">{optionLabel}</span>
                            {typeof option.price === "number" ? (
                              <span className="text-xs text-muted-foreground">
                                {option.price} {creditsLabel}
                              </span>
                            ) : null}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            );
            break;
          default:
            contentInput = (
              <div>
                <Textarea
                  placeholder={content.dialogDescription ?? undefined}
                  className="h-[300px] resize-none overflow-y-auto"
                  {...field}
                />
                <FormDescription className="mt-2 text-xs">
                  {content.dialogDescription}
                </FormDescription>
              </div>
            );
        }

        return (
          <FormItem>
            <FormLabel className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {label}
            </FormLabel>
            <FormControl>{contentInput}</FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
