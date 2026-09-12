import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
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

    const stream = createChatStream({
      signal: request.signal,
      events: (signal) =>
        app.streamEvents(
          state,
          {
            version: "v2",
            signal,
            configurable: { thread_id: chatId, user_id: chat.userId },
            durability: "exit",
          },
          { excludeTags: ["langsmith:hidden"] },
        ),
      onComplete: async (content) => {
        if (content.trim())
          await insertChatMessage({ chatId, role: "assistant", content });
      },
    });

    return new Response(stream, { headers: CHAT_STREAM_HEADERS });
  } catch (error) {
    console.error("GET /api/chat/persistent/[chatId] error:", error);
    return apiErrorResponse(error);
  }
}
