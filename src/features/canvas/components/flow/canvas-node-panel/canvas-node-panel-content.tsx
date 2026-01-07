"use client";

import { type ReactNode, useCallback, useMemo } from "react";
import { type Control, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Node, useReactFlow, useUpdateNodeInternals } from "@xyflow/react";
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
import { Textarea } from "@/components/ui/textarea";
import { type FlowNodeData } from "@/db/query/sidebar-nodes";
import { useCheckValidGraph } from "@/features/canvas/hooks/use-check-valid-graph";
import {
  handleCountRefine,
  pruneEdgesForHandleCount,
} from "@/features/canvas/utils/canvas-node-panel";

const formSchema = z.object({
  label: z.string().min(1, "이름을 입력해주세요"),
  description: z.string(),
  contentValue: z.string(),
  targetCount: z
    .string()
    .refine(handleCountRefine, "0 이상, 5이하의 정수를 입력해주세요"),
  sourceCount: z
    .string()
    .refine(handleCountRefine, "0 이상, 5이하의 정수를 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

export function CanvasNodePanelContent({ node }: { node: Node<FlowNodeData> }) {
  const { updateNodeData, getEdges, setEdges } =
    useReactFlow<Node<FlowNodeData>>();
  const checkValidGraph = useCheckValidGraph();
  const updateNodeInternals = useUpdateNodeInternals();
  const data = node.data;
  const { label, description, content, handle } = data;
  const { targetCount, sourceCount } =
    handle != null ? handle : { targetCount: null, sourceCount: null };

  const isTargetCount = targetCount != null;
  const isSourceHandle = sourceCount != null;

  const targetCountEditable = isTargetCount && targetCount > 0;
  const sourceCountEditable = isSourceHandle && sourceCount > 0;

  const contentLabel = useMemo(() => {
    if (!data.content) return null;
    return data.content.type === "select" ? "선택 값" : "대화 값";
  }, [data.content]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      label,
      description,
      contentValue: content?.value ?? "",
      targetCount: String(targetCount ?? ""),
      sourceCount: String(sourceCount ?? ""),
    },
  });

  const handleSubmit = useCallback(
    (values: FormValues) => {
      const nextContentValue =
        values.contentValue === "" ? null : values.contentValue;
      const nextContent = data.content
        ? { ...data.content, value: nextContentValue }
        : null;

      const nextHandle = data.handle ? { ...data.handle } : null;

      const edges = getEdges();
      let nextEdges = edges;

      let nextTargetCount = targetCount;
      if (nextHandle && targetCountEditable) {
        nextTargetCount = parseInt(values.targetCount);
        nextHandle.targetCount = nextTargetCount;
        if (nextTargetCount < targetCount) {
          nextEdges = pruneEdgesForHandleCount(nextEdges, {
            nodeId: node.id,
            kind: "target",
            nextCount: nextTargetCount,
          });
        }
      }

      let nextSourceCount = sourceCount;
      if (nextHandle && sourceCountEditable) {
        nextSourceCount = parseInt(values.sourceCount);
        nextHandle.sourceCount = nextSourceCount;
        if (nextSourceCount < sourceCount) {
          nextEdges = pruneEdgesForHandleCount(nextEdges, {
            nodeId: node.id,
            kind: "source",
            nextCount: nextSourceCount,
          });
        }
      }

      updateNodeData(node.id, {
        label: values.label,
        description: values.description,
        content: nextContent,
        handle: nextHandle,
      });

      if (nextEdges.length !== edges.length) {
        setEdges(nextEdges);
        checkValidGraph({ edges: nextEdges });
      }

      // edge 재졍렬
      updateNodeInternals(node.id);
    },
    [
      checkValidGraph,
      data.content,
      data.handle,
      getEdges,
      node.id,
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
    <ScrollArea className="h-full" key={node.id}>
      <section className="flex flex-col gap-4 p-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input placeholder="노드 이름" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea placeholder="노드 설명" {...field} />
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
              />
            ) : null}

            {data.handle && (targetCountEditable || sourceCountEditable) ? (
              <FormItem>
                <FormLabel>핸들 수</FormLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  <HandleCountFormField
                    control={form.control}
                    name="targetCount"
                    label="Target"
                    disabled={!targetCountEditable}
                  />
                  <HandleCountFormField
                    control={form.control}
                    name="sourceCount"
                    label="Source"
                    disabled={!sourceCountEditable}
                  />
                </div>
                <FormDescription>
                  핸들 수를 줄이면 연결이 제거될 수 있습니다.
                </FormDescription>
              </FormItem>
            ) : null}

            <Button type="submit">저장</Button>
          </form>
        </Form>
      </section>
    </ScrollArea>
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
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              max={5}
              disabled={disabled}
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
}: {
  control: Control<FormValues>;
  content: NonNullable<FlowNodeData["content"]>;
  label: string;
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
                      return (
                        <SelectItem value={option.value} key={option.id}>
                          {option.value}
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
                  {...field}
                />
                <FormDescription>{content.dialogDescription}</FormDescription>
              </div>
            );
        }

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>{contentInput}</FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
