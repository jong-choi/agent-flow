import { workflowSaveSchema } from "@/app/api/workflows/_types";
import { updateWorkflowGraph } from "@/db/query/workflows";

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/workflows/[id]">,
) {
  try {
    const { id: workflowId } = await params;

    const json = await request.json();
    const parsed = workflowSaveSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { nodes, edges, presetIds } = parsed.data;
    const title = parsed.data.title.trim();
    const description = parsed.data.description?.trim() || null;

    if (!title) {
      return Response.json(
        { error: "워크플로우 이름이 필요합니다." },
        { status: 400 },
      );
    }

    const workflow = await updateWorkflowGraph({
      workflowId,
      title,
      description,
      nodes,
      edges,
      presetIds,
    });

    if (!workflow) {
      return Response.json(
        { error: "워크플로우를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return Response.json({ data: workflow });
  } catch (error) {
    if (error instanceof Error && error.message === "사용자 정보가 없습니다.") {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    console.error("PUT /api/workflows/[id] error:", error);
    return Response.json(
      { error: "워크플로우 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
