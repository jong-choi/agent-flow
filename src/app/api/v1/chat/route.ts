import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { buildInputTree, buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import {
  isEventName,
  langgraphStreamEventSchema,
} from "@/app/api/chat/_types/chat-events";
import { isValidNodeType } from "@/app/api/chat/_types/nodes";
import { getSidebarNodesWithOptions } from "@/db/query/sidebar-nodes";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import {
  getUserIdByCanvasSecret,
  getWorkflowByCanvasId,
} from "@/features/developers/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";

const LOCALES = ["ko", "en"] as const;
type Locale = (typeof LOCALES)[number];

const SYSTEM_MESSAGES: Record<Locale, string> = {
  ko: "사용자 선호 언어 : 한국어",
  en: "User preferred language: English",
};

const V1ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  locale: z.enum(LOCALES).optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-CANVAS-SECRET, X-CANVAS-ID",
  "Access-Control-Max-Age": "86400",
} as const;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * 외부 서비스용 워크플로우 실행 API
 * - 인증: X-CANVAS-SECRET(서비스 키), X-CANVAS-ID(워크플로우 ID)
 * - 응답: stream이 아닌 단일 JSON
 */
export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-CANVAS-SECRET")?.trim() ?? "";
    const canvasId = request.headers.get("X-CANVAS-ID")?.trim() ?? "";

    if (!secret || !canvasId) {
      return Response.json(
        { error: "인증 헤더가 필요합니다." },
        { status: 401, headers: corsHeaders },
      );
    }

    const userId = await getUserIdByCanvasSecret({ secret });
    if (!userId) {
      return Response.json(
        { error: "유효하지 않은 시크릿 키입니다." },
        { status: 401, headers: corsHeaders },
      );
    }

    const workflowRef = await getWorkflowByCanvasId({ canvasId });
    if (!workflowRef) {
      return Response.json(
        { error: "유효하지 않은 Canvas ID입니다." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (workflowRef.ownerId !== userId) {
      return Response.json(
        { error: "워크플로우에 대한 접근 권한이 없습니다." },
        { status: 403, headers: corsHeaders },
      );
    }

    const json = await request.json();
    const parsed = V1ChatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400, headers: corsHeaders },
      );
    }

    const { message, locale = "ko" } = parsed.data;

    const workflowData = await getWorkflowWithGraph(workflowRef.workflowId);
    if (!workflowData) {
      return Response.json(
        { error: "워크플로우를 찾을 수 없습니다." },
        { status: 404, headers: corsHeaders },
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
        { status: 400, headers: corsHeaders },
      );
    }

    const state = {
      messages: [
        new SystemMessage(SYSTEM_MESSAGES[locale]),
        new HumanMessage(message),
      ],
      initialInput: message,
      outputMap: {},
      inputTree: buildInputTree({ nodes, edges }),
    };

    const graph = buildStateGraph({ nodes, edges });
    const app = graph.compile({});

    const threadId = crypto.randomUUID();
    const streamingChunkMap = new Map<string, string>();
    const completedMessageMap = new Map<string, string>();

    for await (const chunk of app.streamEvents(state, {
      version: "v2",
      configurable: { thread_id: threadId, user_id: userId },
      durability: "exit",
    })) {
      if (
        !isEventName(chunk.event) ||
        typeof chunk.metadata.type !== "string" ||
        !isValidNodeType(chunk.metadata.type)
      ) {
        continue;
      }

      const parsedChunk = langgraphStreamEventSchema.safeParse(chunk);
      if (!parsedChunk.success) {
        continue;
      }

      const event = parsedChunk.data.event;
      const { type, langgraph_node } = parsedChunk.data.metadata;

      if (type !== "chatNode") {
        continue;
      }

      const nodeId = langgraph_node;
      if (typeof nodeId !== "string") {
        continue;
      }

      if (event === "on_chat_model_start") {
        if (!streamingChunkMap.has(nodeId)) {
          streamingChunkMap.set(nodeId, "");
        }
        if (!completedMessageMap.has(nodeId)) {
          completedMessageMap.set(nodeId, "");
        }
      } else if (event === "on_chat_model_stream") {
        const content = parsedChunk.data.data?.chunk?.content;
        if (typeof content !== "string") {
          continue;
        }
        const current = streamingChunkMap.get(nodeId) ?? "";
        streamingChunkMap.set(nodeId, current + content);
      } else if (event === "on_chat_model_end") {
        const completed = streamingChunkMap.get(nodeId) ?? "";
        completedMessageMap.set(nodeId, completed);
      }
    }

    const responseText = Array.from(completedMessageMap.values())
      .join("\n\n")
      .trim();

    return Response.json(
      {
        data: {
          response: responseText,
          canvasId,
          workflowId: workflowRef.workflowId,
        },
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("POST /api/v1/chat error:", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
