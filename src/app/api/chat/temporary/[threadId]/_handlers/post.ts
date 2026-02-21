import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import {
  type ThreadContext,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";

const chatSessionRunSchema = z.object({
  message: z.string(),
});

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/chat/temporary/[threadId]">,
) {
  try {
    const { threadId } = await params;

    const json = await request.json();
    const parsed = chatSessionRunSchema.safeParse(json);

    if (!parsed.success) {
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_body",
        message: "Invalid body.",
      });
    }

    const { message } = parsed.data;
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

    const state: ThreadContext["state"] = {
      ...threadContext.state,
      messages: [...threadContext.state.messages, new HumanMessage(message)],
      initialInput: message,
    };

    threadContextManager.set({ ...threadContext, state });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/chat/temporary/[threadId] error:", error);
    return apiErrorResponse(error);
  }
}
