import { workflowSaveSchema } from "@/app/api/workflows/_types";
import { createWorkflowGraph } from "@/features/workflows/server/actions";

export async function POST(request: Request) {
  try {
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

    const workflow = await createWorkflowGraph({
      title,
      description,
      nodes,
      edges,
      presetIds,
    });

    return Response.json({ data: workflow });
  } catch (error) {
    if (error instanceof Error && error.message === "사용자 정보가 없습니다.") {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    console.error("POST /api/workflows error:", error);
    return Response.json(
      { error: "워크플로우 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
