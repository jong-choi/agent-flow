import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { type StreamEvent } from "@langchain/core/tracers/log_stream";
import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import {
  type ThreadContext,
  checkpointer,
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";

const chatSessionRunSchema = z.object({
  message: z.string(),
});

type EmitEventPrams = {
  name: string;
  event: string;
  message?: string;
  chunk?: Partial<StreamEvent["data"]["chunk"]>;
};

/**
 * 채팅 실행 엔드포인드
 *
 * threadId를 params로, 사용자 메시지를 request로 받는다.
 * threadContextManager에서 threadContext를 받아 thread를 초기화한다.
 * 받은 사용자 메시지는 initialInput에 저장한다 => src/app/api/chat/_nodes/start-node.ts 에서 사용됨
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/chat/[id]">,
) {
  try {
    const { id: threadId } = await params;

    const json = await request.json();
    const parsed = chatSessionRunSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { message } = parsed.data;
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

    const graph = buildStateGraph(threadContext.graph);

    const state = threadContext.state;

    const app = graph.compile({ checkpointer });

    const inputs: ThreadContext["state"] = {
      ...state,
      messages: [...state.messages, new HumanMessage(message)],
      initialInput: message,
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of app.streamEvents(inputs, {
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
    console.error("POST /api/chat/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
