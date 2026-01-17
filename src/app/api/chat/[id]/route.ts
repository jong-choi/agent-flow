import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import {
  checkpointer,
  resetIdleTimer,
  threadContextManager,
} from "@/app/api/chat/_engines/handle-connect";

const serializeDrawableGraph = (drawable: {
  nodes: Record<
    string,
    { id: string; name: string; metadata?: Record<string, unknown> }
  >;
  edges: Array<{
    source: string;
    target: string;
    data?: string;
    conditional?: boolean;
  }>;
}) => ({
  nodes: Object.values(drawable.nodes).map((node) => ({
    id: node.id,
    name: node.name,
    metadata: node.metadata ?? null,
  })),
  edges: drawable.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    data: edge.data,
    conditional: edge.conditional,
  })),
});

const chatSessionRunSchema = z.object({
  message: z.string(),
});

/**
 * 채팅 실행 엔드포인드
 *
 * threadId를 params로, 사용자 메시지를 request로 받는다.
 * threadContextManager에서 threadContext를 받아 thread를 초기화한다.
 * 받은 사용자 메시지는 initialInput에 저장한다 => src/app/api/chat/_nodes/start-node.ts 에서 사용됨
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/chat/[id]">,
) {
  const { id: threadId } = await params;

  const json = await request.json();
  const parsed = chatSessionRunSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { message: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { message } = parsed.data;
  const threadContext = threadContextManager.get(threadId);

  if (!threadContext) {
    return Response.json(
      { error: "세션을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (!threadContext.graph) {
    return Response.json({ error: "그래프 정보가 없습니다." }, { status: 400 });
  }

  const graph = buildStateGraph(threadContext.graph);

  const state = threadContext.state;

  const compiled = graph.compile({ checkpointer });

  const result = await compiled.invoke({
    ...state,
    messages: [...state.messages, new HumanMessage(message)],
    initialInput: message,
  });

  resetIdleTimer(threadId);

  const drawable = await compiled.getGraphAsync();

  return Response.json({
    result,
    graph: serializeDrawableGraph(drawable),
  });
}
