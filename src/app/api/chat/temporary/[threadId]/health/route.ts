import { apiErrorResponse } from "@/app/api/_errors/api-error";
import {
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";

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

    resetIdleTimer(threadId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("GET /api/chat/temporary/[threadId]/health error:", error);
    return apiErrorResponse(error);
  }
}
