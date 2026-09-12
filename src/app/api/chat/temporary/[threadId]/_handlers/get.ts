import { apiErrorResponse } from "@/app/api/_errors/api-error";
import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import {
  checkpointer,
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";
import {
  CHAT_STREAM_HEADERS,
  createChatStream,
} from "@/app/api/chat/_utils/create-chat-stream";
import { getUserId } from "@/features/auth/server/queries";

/**
 * 채팅 실행 GET 요청
 *
 * threadContext를 이용해 저장된 값을 확인한다.
 * 그래프를 컴파일하여 실행 후 SSE 방식으로 반환한다.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/chat/temporary/[threadId]">,
) {
  try {
    const { threadId } = await params;

    const threadContext = threadContextManager.get(threadId);

    if (!threadContext) {
      return apiErrorResponse({
        status: 404,
        type: "not_found_error",
        code: "thread_not_found",
        message: "Session not found.",
      });
    }

    if (!threadContext.graph) {
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "graph_not_found",
        message: "Graph information is missing.",
      });
    }

    const userId = await getUserId();
    const state = threadContext.state;

    const graph = buildStateGraph(threadContext.graph);
    const app = graph.compile({ checkpointer });

    const stream = createChatStream({
      signal: request.signal,
      events: (signal) =>
        app.streamEvents(
          state,
          {
            version: "v2",
            signal,
            configurable: { thread_id: threadId, user_id: userId },
            durability: "exit",
          },
          { excludeTags: ["langsmith:hidden"] },
        ),
    });
    resetIdleTimer(threadId);

    return new Response(stream, { headers: CHAT_STREAM_HEADERS });
  } catch (error) {
    console.error("GET /api/chat/temporary/[threadId] error:", error);
    return apiErrorResponse(error);
  }
}
