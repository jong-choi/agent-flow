import { RemoveMessage } from "@langchain/core/messages";
import { REMOVE_ALL_MESSAGES } from "@langchain/langgraph";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import {
  buildInputTree,
  buildStateGraph,
} from "@/app/api/chat/_engines/build-state-graph";
import { persistentCheckpointer } from "@/app/api/chat/_engines/handle-connect";
import {
  CHAT_STREAM_HEADERS,
  createChatStream,
} from "@/app/api/chat/_utils/create-chat-stream";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import { insertChatMessage } from "@/features/chats/server/mutations";
import {
  getChatById,
  getChatExecutionMessages,
  getWorkflowWithGraphForChat,
} from "@/features/chats/server/queries";
import { acquireChatSession, replayChatAnswer } from "@/lib/ai/chat-session";
import { restoreChatMessage } from "@/lib/ai/history";

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
  let release: (() => Promise<void>) | undefined;
  try {
    const { chatId } = await params;

    const chat = await getChatById(chatId);
    release = await acquireChatSession(chatId);
    const messages = await getChatExecutionMessages(chatId);
    const last = messages.at(-1);
    if (last?.role === "assistant") {
      await release();
      return replayChatAnswer(last.content);
    }
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    if (!lastUserMessage) throw new Error("No user message to execute");

    const workflowData = await getWorkflowWithGraphForChat(chat.workflowId);
    if (!workflowData) {
      await release();
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
      await release();
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "graph_not_found",
        message: "Failed to build graph from workflow.",
      });
    }

    const messageList = messages.flatMap(restoreChatMessage);

    const initialInput = lastUserMessage?.content ?? "";

    const state = {
      messages: [
        new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
        ...messageList,
      ],
      initialInput,
      outputMap: {},
      inputTree: buildInputTree({ nodes, edges }),
    };

    const graph = buildStateGraph({ nodes, edges });
    const app = graph.compile({ checkpointer: persistentCheckpointer });

    const stream = createChatStream({
      signal: request.signal,
      onFinally: release,
      events: (signal) =>
        app.streamEvents(
          state,
          {
            version: "v2",
            signal,
            configurable: {
              thread_id: chatId,
              user_id: chat.userId,
              model_execution_turn: lastUserMessage.id,
            },
            durability: "exit",
          },
          { excludeTags: ["langsmith:hidden"] },
        ),
      onComplete: async (content, modelMessages) => {
        if (content.trim())
          await insertChatMessage({
            chatId,
            role: "assistant",
            content,
            modelMessages,
          });
      },
    });

    return new Response(stream, { headers: CHAT_STREAM_HEADERS });
  } catch (error) {
    await release?.();
    console.error("GET /api/chat/persistent/[chatId] error:", error);
    return apiErrorResponse(error);
  }
}
