import { eq } from "drizzle-orm";
import { workflowSaveSchema } from "@/app/api/workflows/_types";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { updateWorkflowGraph } from "@/db/query/workflows";
import { auth } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/workflows/[id]">,
) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: workflowId } = await params;

    const json = await request.json();
    const parsed = workflowSaveSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { nodes, edges } = parsed.data;
    const title = parsed.data.title.trim();
    const description = parsed.data.description?.trim() || null;

    if (!title) {
      return Response.json(
        { error: "워크플로우 이름이 필요합니다." },
        { status: 400 },
      );
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return Response.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 401 },
      );
    }

    const workflow = await updateWorkflowGraph({
      ownerId: user.id,
      workflowId,
      title,
      description,
      nodes,
      edges,
    });

    if (!workflow) {
      return Response.json(
        { error: "워크플로우를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return Response.json({ data: workflow });
  } catch (error) {
    console.error("PUT /api/workflows/[id] error:", error);
    return Response.json(
      { error: "워크플로우 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
