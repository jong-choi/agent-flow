import { type StreamEvent } from "@langchain/core/tracers/log_stream";
import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import {
  checkpointer,
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";

type EmitEventPrams = {
  name: string;
  event: string;
  message?: string;
  chunk?: Partial<StreamEvent["data"]["chunk"]>;
};

/**
 * 채팅 실행 GET 요청
 *
 * threadContext를 이용해 저장된 값을 확인한다.
 * 그래프를 컴파일하여 실행 후 SSE 방식으로 반환한다.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/chat/[id]">,
) {
  try {
    const { id: threadId } = await params;

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

    const state = threadContext.state;

    const graph = buildStateGraph(threadContext.graph);
    const app = graph.compile({ checkpointer });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of app.streamEvents(state, {
          version: "v2",
          configurable: { thread_id: threadId },
          durability: "exit", // 랭그래프 종료 시점에만 상태 업데이트
        })) {
          const emitEvent = (data: EmitEventPrams) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
            );
          };

          const event = chunk.event;
          if (event === "on_chat_model_start") {
            const data = { name: "chatNode", event };
            emitEvent(data);
          } else if (event === "on_chat_model_stream") {
            const data = {
              name: "chatNode",
              event,
              chunk: { content: chunk.data.chunk.content },
            };
            emitEvent(data);
          } else if (event === "on_chat_model_end") {
            const data = { name: "chatNode", event };
            emitEvent(data);
          }
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
    console.error("GET /api/chat/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
