import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import {
  checkpointer,
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";
import {
  type ClientStreamEvent,
  isEventName,
  langgraphStreamEventSchema,
} from "@/app/api/chat/_types/chat-events";
import { isValidNodeType } from "@/app/api/chat/_types/nodes";

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
            configurable: { thread_id: threadId },
            durability: "exit", // 랭그래프 종료 시점에만 상태 업데이트
          })) {
            if (
              !isEventName(chunk.event) ||
              typeof chunk.metadata.type !== "string" ||
              !isValidNodeType(chunk.metadata.type)
            ) {
              continue;
            }

            const parsed = langgraphStreamEventSchema.safeParse(chunk);
            if (!parsed.success) {
              continue;
            }

            const event = parsed.data.event;
            const { type, langgraph_node } = parsed.data.metadata;

            if (type === "startNode") {
              if (event === "on_chain_start") {
                emitEvent({ type, event, langgraph_node });
              }
            }
            if (type === "chatNode") {
              if (event === "on_chat_model_start") {
                emitEvent({ type, event, langgraph_node });
              } else if (event === "on_chat_model_stream") {
                const content = parsed.data.data?.chunk?.content;
                if (typeof content !== "string") {
                  continue;
                }
                emitEvent({
                  type,
                  event,
                  langgraph_node,
                  chunk: { content },
                });
              } else if (event === "on_chat_model_end") {
                emitEvent({ type, event, langgraph_node });
              }
            }
            if (type === "endNode") {
              if (event === "on_chain_end") {
                emitEvent({ type, event, langgraph_node });
              }
            }
          }
        } catch (error) {
          console.error("SSE stream error:", error);
          emitEvent({
            type: "endNode",
            event: "on_chain_end",
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
    console.error("GET /api/chat/temporary/[threadId] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
