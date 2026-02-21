import { z } from "zod";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import { buildInputTree } from "@/app/api/chat/_engines/build-state-graph";
import {
  type ThreadContext,
  createThread,
} from "@/app/api/chat/_engines/handle-connect";
import { flowEdgeSchema, flowNodeSchema } from "@/app/api/chat/_types/nodes";

const ChatCreateThreadRequestSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
});

export type ChatCreateThreadRequest = z.infer<
  typeof ChatCreateThreadRequestSchema
>;

/**
 * 사용자의 요청을 받아 ThreadContext를 생성한다
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

    const { nodes, edges } = parsed.data;

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_request",
        message: "nodes and edges are required.",
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
