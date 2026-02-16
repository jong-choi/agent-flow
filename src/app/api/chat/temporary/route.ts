import { z } from "zod";
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
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { nodes, edges } = parsed.data;

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return Response.json(
        { error: "nodes와 edges가 필요합니다." },
        { status: 400 },
      );
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

    const errorResponse = {
      error: "쓰레드 생성에 실패하였습니다.",
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
