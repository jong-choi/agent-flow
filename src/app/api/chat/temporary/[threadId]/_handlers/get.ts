import {
  apiErrorResponse,
  mapUnknownToApiTypedError,
} from "@/app/api/_errors/api-error";
import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import {
  checkpointer,
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";
import {
  type ClientStreamEvent,
  langgraphStreamEventSchema,
} from "@/app/api/chat/_types/chat-events";
import { mapLanggraphEventToClientEvent } from "@/app/api/chat/_utils/map-stream-event-to-client";
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

    const stream = new ReadableStream({
      async start(controller) {
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
              configurable: { thread_id: threadId, user_id: userId },
              durability: "exit", // 랭그래프 종료 시점에만 상태 업데이트
            },
            {
              excludeTags: ["langsmith:hidden"],
            },
          )) {
            const parsed = langgraphStreamEventSchema.safeParse(chunk);
            if (!parsed.success) {
              continue;
            }
            const streamEvent = mapLanggraphEventToClientEvent(parsed.data);
            if (streamEvent) {
              emitEvent(streamEvent);
            }
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

    resetIdleTimer(threadId);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("GET /api/chat/temporary/[threadId] error:", error);
    return apiErrorResponse(error);
  }
}
