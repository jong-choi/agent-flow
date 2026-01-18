import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import {
  type ThreadContext,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";

const chatSessionRunSchema = z.object({
  message: z.string(),
});

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

    const state: ThreadContext["state"] = {
      ...threadContext.state,
      messages: [...threadContext.state.messages, new HumanMessage(message)],
      initialInput: message,
    };

    threadContextManager.set({ ...threadContext, state });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/chat/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
