import { z } from "zod";
import { apiErrorPayloadSchema } from "@/app/api/_types/api-error";
import { nodeTypes } from "@/features/canvas/constants/node-types";

type RunnableType = "llm" | "chat_model" | "prompt" | "tool" | "chain";
type Phase = "start" | "stream" | "end";
type EventName = `on_${RunnableType}_${Phase}`;

const EVENT_NAME_RE =
  /^on_(llm|chat_model|prompt|tool|chain)_(start|stream|end)$/;

export const isEventName = (value: unknown): value is EventName => {
  return typeof value === "string" && EVENT_NAME_RE.test(value);
};

export const clientStreamEventSchema = z
  .object({
    type: z.enum(nodeTypes),
    event: z.custom<EventName>(isEventName, "Invalid event name"),
    message: z.string().optional(),
    error: apiErrorPayloadSchema.optional(),
    langgraph_node: z.string().optional(),
    chunk: z
      .object({
        content: z.string().optional(),
        referenceId: z.string().optional(),
      })
      .optional(),
  })
  .loose();

export const langgraphStreamEventSchema = z
  .object({
    event: z.custom<EventName>(isEventName, "Invalid event name"),
    metadata: z
      .object({
        type: z.enum(nodeTypes),
        langgraph_node: z.string().optional(),
      })
      .loose(),
    data: z
      .object({
        chunk: z
          .object({
            content: z.unknown().optional(),
          })
          .loose()
          .optional(),
      })
      .optional(),
  })
  .loose();

export type LanggraphStreamEvent = z.infer<typeof langgraphStreamEventSchema>;
export type ClientStreamEvent = z.infer<typeof clientStreamEventSchema>;
