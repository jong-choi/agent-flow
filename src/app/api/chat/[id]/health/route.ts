import {
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";

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

    resetIdleTimer(threadId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("GET /api/chat/[id]/health error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
