import { z } from "zod";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import { buildInputTree } from "@/app/api/chat/_engines/build-state-graph";
import {
  type ThreadContext,
  createThread,
} from "@/app/api/chat/_engines/handle-connect";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import { getWorkflowWithGraphForChat } from "@/features/chats/server/queries";
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
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_body",
        message: "Invalid body.",
      });
    }

    const { workflowId } = parsed.data;

    if (!workflowId) {
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_request",
        message: "workflowId is required.",
      });
    }

    const workflowData = await getWorkflowWithGraphForChat(workflowId);
    if (!workflowData) {
      return apiErrorResponse({
        status: 404,
        type: "not_found_error",
        code: "workflow_not_found",
        message: "Workflow not found.",
      });
    }

    const session = await auth();
    if (!session?.user || session.user.id !== workflowData.workflow.ownerId) {
      return apiErrorResponse({
        status: 403,
        type: "authorization_error",
        code: "forbidden",
        message: "You do not have permission to access this workflow.",
      });
    }

    const sidebarNodes = await getSidebarNodesWithOptions();
    const { nodes, edges } = buildFlowGraphFromWorkflow({
      workflowNodes: workflowData.nodes,
      workflowEdges: workflowData.edges,
      sidebarNodes,
    });

    if (!nodes || !edges) {
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "graph_not_found",
        message: "Failed to build graph from workflow.",
      });
    }

    const graph: ThreadContext["graph"] = { nodes, edges };

    const state: ThreadContext["state"] = {
      messages: [],
      initialInput: "",
      startNodeId: null,
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
    return apiErrorResponse(error);
  }
}
