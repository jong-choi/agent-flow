import { z } from "zod";
import { mapUnknownToApiTypedError } from "@/app/api/_errors/api-error";
import {
  OpenAiCompatError,
  buildOpenAiId,
  extractLastUserTextFromResponsesInput,
  handleOpenAiRouteError,
  openAiCorsHeaders,
  openAiJsonResponse,
  openAiSseHeaders,
  resolveOpenAiWorkflowContext,
} from "@/app/api/v1/openai/_lib/openai-compat";
import {
  runWorkflowForUserMessage,
  streamWorkflowForUserMessage,
} from "@/app/api/v1/openai/_lib/workflow-runner";

const requestSchema = z
  .object({
    model: z.string().trim().min(1),
    input: z.unknown(),
    stream: z.boolean().optional().default(false),
  })
  .loose();

const buildCompletedResponsePayload = ({
  responseId,
  messageId,
  createdAt,
  model,
  text,
}: {
  responseId: string;
  messageId: string;
  createdAt: number;
  model: string;
  text: string;
}) => ({
  id: responseId,
  object: "response",
  created_at: createdAt,
  status: "completed",
  model,
  output: [
    {
      id: messageId,
      type: "message",
      status: "completed",
      role: "assistant",
      content: [
        {
          type: "output_text",
          text,
          annotations: [],
        },
      ],
    },
  ],
  usage: {
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
  },
});

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: openAiCorsHeaders });
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new OpenAiCompatError({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_body",
        message: "Request body must be valid JSON.",
      });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new OpenAiCompatError({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_body",
        message: "Invalid request body format.",
      });
    }

    const inputText = extractLastUserTextFromResponsesInput(parsed.data.input);
    if (!inputText) {
      throw new OpenAiCompatError({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_input",
        message: "Unable to find user text in input.",
      });
    }

    const workflowContext = await resolveOpenAiWorkflowContext({
      headers: request.headers,
      model: parsed.data.model,
    });

    const responseId = buildOpenAiId("resp");
    const messageId = buildOpenAiId("msg");
    const createdAt = Math.floor(Date.now() / 1000);
    const model = workflowContext.canvasId;

    if (!parsed.data.stream) {
      const outputText = await runWorkflowForUserMessage({
        workflowId: workflowContext.workflowId,
        userId: workflowContext.userId,
        message: inputText,
      });

      return openAiJsonResponse(
        buildCompletedResponsePayload({
          responseId,
          messageId,
          createdAt,
          model,
          text: outputText,
        }),
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const emit = (payload: string) => {
          controller.enqueue(encoder.encode(payload));
        };
        const emitJson = (payload: unknown) => {
          emit(`data: ${JSON.stringify(payload)}\n\n`);
        };
        let didEmitCreated = false;

        const emitCreated = () => {
          if (didEmitCreated) {
            return;
          }
          didEmitCreated = true;
          emitJson({
            type: "response.created",
            response: {
              id: responseId,
              object: "response",
              created_at: createdAt,
              status: "in_progress",
              model,
            },
          });
        };

        try {
          const outputText = await streamWorkflowForUserMessage({
            workflowId: workflowContext.workflowId,
            userId: workflowContext.userId,
            message: inputText,
            onStart: () => {
              emitCreated();
            },
            onDelta: (delta) => {
              emitCreated();
              emitJson({
                type: "response.output_text.delta",
                response_id: responseId,
                output_index: 0,
                content_index: 0,
                delta,
              });
            },
          });

          emitCreated();
          const completedPayload = buildCompletedResponsePayload({
            responseId,
            messageId,
            createdAt,
            model,
            text: outputText,
          });

          emitJson({
            type: "response.output_text.done",
            response_id: responseId,
            output_index: 0,
            content_index: 0,
            text: outputText,
          });
          emitJson({
            type: "response.completed",
            response: completedPayload,
          });
          emit("data: [DONE]\n\n");
          controller.close();
        } catch (error) {
          const mappedError = mapUnknownToApiTypedError(error);
          emitJson({
            error: {
              message: mappedError.message,
              type: mappedError.type,
              code: mappedError.code,
            },
          });
          emit("data: [DONE]\n\n");
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: openAiSseHeaders });
  } catch (error) {
    return handleOpenAiRouteError("POST /api/v1/openai/responses", error);
  }
}
