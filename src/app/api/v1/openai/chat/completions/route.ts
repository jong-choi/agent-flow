import { z } from "zod";
import { mapUnknownToApiTypedError } from "@/app/api/_errors/api-error";
import {
  OpenAiCompatError,
  buildOpenAiId,
  extractLastUserTextFromChatMessages,
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

const chatMessageSchema = z
  .object({
    role: z.string().trim().min(1),
    content: z.unknown(),
  })
  .loose();

const requestSchema = z
  .object({
    model: z.string().trim().min(1),
    messages: z.array(chatMessageSchema).min(1),
    stream: z.boolean().optional().default(false),
  })
  .loose();

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

    const inputText = extractLastUserTextFromChatMessages(parsed.data.messages);
    if (!inputText) {
      throw new OpenAiCompatError({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_messages",
        message: "Unable to find the last user text in messages.",
      });
    }

    const workflowContext = await resolveOpenAiWorkflowContext({
      headers: request.headers,
      model: parsed.data.model,
    });

    const completionId = buildOpenAiId("chatcmpl");
    const created = Math.floor(Date.now() / 1000);
    const model = workflowContext.canvasId;

    if (!parsed.data.stream) {
      const outputText = await runWorkflowForUserMessage({
        workflowId: workflowContext.workflowId,
        userId: workflowContext.userId,
        message: inputText,
      });

      return openAiJsonResponse({
        id: completionId,
        object: "chat.completion",
        created,
        model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: outputText,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      });
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
        let didEmitStart = false;

        const emitStartChunk = () => {
          if (didEmitStart) {
            return;
          }
          didEmitStart = true;
          emitJson({
            id: completionId,
            object: "chat.completion.chunk",
            created,
            model,
            choices: [
              {
                index: 0,
                delta: { role: "assistant" },
                finish_reason: null,
              },
            ],
          });
        };

        try {
          await streamWorkflowForUserMessage({
            workflowId: workflowContext.workflowId,
            userId: workflowContext.userId,
            message: inputText,
            onStart: () => {
              emitStartChunk();
            },
            onDelta: (content) => {
              emitStartChunk();
              emitJson({
                id: completionId,
                object: "chat.completion.chunk",
                created,
                model,
                choices: [
                  {
                    index: 0,
                    delta: { content },
                    finish_reason: null,
                  },
                ],
              });
            },
          });

          emitStartChunk();
          emitJson({
            id: completionId,
            object: "chat.completion.chunk",
            created,
            model,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: "stop",
              },
            ],
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
    return handleOpenAiRouteError(
      "POST /api/v1/openai/chat/completions",
      error,
    );
  }
}
