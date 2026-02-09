import { z } from "zod";
import { buildInputTree } from "@/app/api/chat/_engines/build-state-graph";
import {
  type ThreadContext,
  createThread,
} from "@/app/api/chat/_engines/handle-connect";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { getWorkflowWithGraphForChat } from "@/features/chats/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import { auth } from "@/lib/auth";

const ChatCreateThreadRequestSchema = z.object({
  workflowId: z.uuid(),
});

export type ChatCreateThreadRequest = z.infer<
  typeof ChatCreateThreadRequestSchema
>;

/**
 * 사용자의 Workflow 아이디를 기반으로 새로운 채팅을 시작한다.
 * 생성한 ThreadContext에 Thread를 생성하기 위한 초기값을 설정한다.
 * src/app/api/chat/temporary/[threadId]/route.ts 에 요청을 보낼 때 사용되는 threadId를 반환한다.
 *
 * @param {Request} request - xyflow nodes와 edges의 배열
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();

    const parsed = ChatCreateThreadRequestSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { workflowId } = parsed.data;

    if (!workflowId) {
      return Response.json(
        { error: "workflowId가 전달되지 않았습니다." },
        { status: 400 },
      );
    }

    const workflowData = await getWorkflowWithGraphForChat(workflowId);
    if (!workflowData) {
      return Response.json(
        { error: "workflowData를 불러오는 데에 실패하였습니다." },
        { status: 400 },
      );
    }

    const session = await auth();
    if (!session?.user || session.user.id !== workflowData.workflow.ownerId) {
      return Response.json(
        { error: "해당 workflow에 접근할 권한이 없습니다." },
        { status: 403 },
      );
    }

    const sidebarNodes = await getSidebarNodesWithOptions();
    const { nodes, edges } = buildFlowGraphFromWorkflow({
      workflowNodes: workflowData.nodes,
      workflowEdges: workflowData.edges,
      sidebarNodes,
    });

    if (!nodes || !edges) {
      return Response.json(
        { error: "workflow로 그래프를 생성하는 데에 실패하였습니다." },
        { status: 400 },
      );
    }

    const graph: ThreadContext["graph"] = { nodes, edges };

    const state: ThreadContext["state"] = {
      messages: [],
      initialInput: "",
      outputMap: {},
      inputTree: buildInputTree(graph),
    };

    const data = await createThread({
      state,
      graph,
    });

    return Response.json({
      data,
    });
  } catch (error) {
    console.error("쓰레드 생성 에러:", error);

    const errorResponse = {
      error: "쓰레드 생성에 실패하였습니다.",
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
