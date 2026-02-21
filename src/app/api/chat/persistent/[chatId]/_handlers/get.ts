import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  apiErrorResponse,
  mapUnknownToApiTypedError,
} from "@/app/api/_errors/api-error";
import {
  buildInputTree,
  buildStateGraph,
} from "@/app/api/chat/_engines/build-state-graph";
import { persistentCheckpointer } from "@/app/api/chat/_engines/handle-connect";
import {
  type ClientStreamEvent,
  langgraphStreamEventSchema,
} from "@/app/api/chat/_types/chat-events";
import { mapLanggraphEventToClientEvent } from "@/app/api/chat/_utils/map-stream-event-to-client";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import { insertChatMessage } from "@/features/chats/server/mutations";
import {
  getChatById,
  getChatMessagesByChatId,
  getWorkflowWithGraphForChat,
} from "@/features/chats/server/queries";

const toBaseMessage = (role: string, content: string) => {
  if (role === "user") return new HumanMessage(content);
  if (role === "assistant") return new AIMessage(content);
  if (role === "system") return new SystemMessage(content);
  return null;
};

/**
 * 영속 채팅 실행 GET 요청
 *
 * DB에 저장된 메시지를 기반으로 state를 초기화하고,
 * Postgres checkpointer로 그래프를 실행한 뒤 SSE로 반환한다.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/chat/persistent/[chatId]">,
) {
  try {
    const { chatId } = await params;

    const chat = await getChatById(chatId);

    const workflowData = await getWorkflowWithGraphForChat(chat.workflowId);
    if (!workflowData) {
      return apiErrorResponse({
        status: 404,
        type: "not_found_error",
        code: "workflow_not_found",
        message: "Workflow not found.",
      });
    }

    const sidebarNodes = await getSidebarNodesWithOptions();
    const { nodes, edges } = buildFlowGraphFromWorkflow({
      workflowNodes: workflowData.nodes,
      workflowEdges: workflowData.edges,
      sidebarNodes,
    });

    if (!nodes || !edges) {
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "graph_not_found",
        message: "Failed to build graph from workflow.",
      });
    }

    const messages = await getChatMessagesByChatId(chatId);
    const messageList = messages
      .map((message) => toBaseMessage(message.role, message.content))
      .filter((message): message is NonNullable<typeof message> =>
        Boolean(message),
      );

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    const initialInput = lastUserMessage?.content ?? "";

    const state = {
      messages: messageList,
      initialInput,
      outputMap: {},
      inputTree: buildInputTree({ nodes, edges }),
    };

    const graph = buildStateGraph({ nodes, edges });
    const app = graph.compile({ checkpointer: persistentCheckpointer });

    const stream = new ReadableStream({
      async start(controller) {
        const streamingChunkMap = new Map<string, string>();
        const completedMessageMap = new Map<string, string>();
        const emitEvent = (params: ClientStreamEvent) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(params)}\n\n`),
          );
        };
        const encoder = new TextEncoder();

        try {
          for await (const chunk of app.streamEvents(
            state,
            {
              version: "v2",
              configurable: { thread_id: chatId, user_id: chat.userId },
              durability: "exit",
            },
            {
              excludeTags: ["langsmith:hidden"],
            },
          )) {
            const parsed = langgraphStreamEventSchema.safeParse(chunk);
            if (!parsed.success) {
              continue;
            }

            const event = parsed.data.event;
            const { type, langgraph_node } = parsed.data.metadata;

            if (type === "chatNode") {
              const nodeId = langgraph_node;
              if (typeof nodeId !== "string") {
                continue;
              }
              if (event === "on_chat_model_start") {
                if (!streamingChunkMap.has(nodeId)) {
                  streamingChunkMap.set(nodeId, "");
                }
                if (!completedMessageMap.has(nodeId)) {
                  completedMessageMap.set(nodeId, "");
                }
              } else if (event === "on_chat_model_stream") {
                const content = parsed.data.data?.chunk?.content;
                if (typeof content !== "string") {
                  continue;
                }
                const currentContent = streamingChunkMap.get(nodeId) ?? "";
                streamingChunkMap.set(nodeId, currentContent + content);
              } else if (event === "on_chat_model_end") {
                const completedContent = streamingChunkMap.get(nodeId) ?? "";
                if (!completedMessageMap.has(nodeId)) {
                  completedMessageMap.set(nodeId, completedContent);
                } else {
                  completedMessageMap.set(nodeId, completedContent);
                }
              }
            }

            const streamEvent = mapLanggraphEventToClientEvent(parsed.data);
            if (streamEvent) {
              emitEvent(streamEvent);
            }
          }

          const aiMessageContent = Array.from(
            completedMessageMap.values(),
          ).join("\n\n");
          if (aiMessageContent.trim().length > 0) {
            await insertChatMessage({
              chatId,
              role: "assistant",
              content: aiMessageContent,
            });
          }
        } catch (error) {
          console.error("SSE stream error:", error);
          const mappedError = mapUnknownToApiTypedError(error);
          emitEvent({
            type: "endNode",
            event: "on_chain_end",
            error: {
              message: mappedError.message,
              type: mappedError.type,
              code: mappedError.code,
            },
          });
          controller.close();
          return;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("GET /api/chat/persistent/[chatId] error:", error);
    return apiErrorResponse(error);
  }
}
