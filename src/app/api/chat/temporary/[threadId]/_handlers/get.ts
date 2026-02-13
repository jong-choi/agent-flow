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
      return Response.json(
        { error: "세션을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (!threadContext.graph) {
      return Response.json(
        { error: "그래프 정보가 없습니다." },
        { status: 400 },
      );
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
          for await (const chunk of app.streamEvents(state, {
            version: "v2",
            configurable: { thread_id: threadId, user_id: userId },
            durability: "exit", // 랭그래프 종료 시점에만 상태 업데이트
          })) {
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
          emitEvent({
            type: "endNode",
            event: "on_chain_end",
            error: "stream_error",
          });
          controller.close();
          return Response.json(
            { error: "Internal Server Error" },
            { status: 500 },
          );
        }
      },
    });

    resetIdleTimer(threadId);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "사용자 정보가 없습니다.") {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    console.error("GET /api/chat/temporary/[threadId] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
