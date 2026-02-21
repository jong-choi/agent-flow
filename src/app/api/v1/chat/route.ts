import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import {
  buildInputTree,
  buildStateGraph,
} from "@/app/api/chat/_engines/build-state-graph";
import {
  isEventName,
  langgraphStreamEventSchema,
} from "@/app/api/chat/_types/chat-events";
import { isValidNodeType } from "@/app/api/chat/_types/nodes";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import {
  getUserIdByCanvasSecret,
  getWorkflowByCanvasId,
} from "@/features/developers/server/queries";
import { getWorkflowWithGraph } from "@/features/workflows/server/queries";

const V1ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-FLOW-SECRET, X-FLOW-ID",
  "Access-Control-Max-Age": "86400",
} as const;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * 외부 서비스용 워크플로우 실행 API
 * - 인증: X-FLOW-SECRET(서비스 키), X-FLOW-ID(워크플로우 ID)
 * - 응답: stream이 아닌 단일 JSON
 */
export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-FLOW-SECRET")?.trim() ?? "";
    const flowId = request.headers.get("X-FLOW-ID")?.trim() ?? "";

    if (!secret || !flowId) {
      return apiErrorResponse(
        {
          status: 401,
          type: "authentication_error",
          code: "auth_required",
          message: "Authentication headers are required.",
        },
        { headers: corsHeaders },
      );
    }

    const userId = await getUserIdByCanvasSecret({ secret });
    if (!userId) {
      return apiErrorResponse(
        {
          status: 401,
          type: "authentication_error",
          code: "auth_required",
          message: "Invalid secret key.",
        },
        { headers: corsHeaders },
      );
    }

    const workflowRef = await getWorkflowByCanvasId({ canvasId: flowId });
    if (!workflowRef) {
      return apiErrorResponse(
        {
          status: 404,
          type: "not_found_error",
          code: "workflow_not_found",
          message: "Invalid flow ID.",
        },
        { headers: corsHeaders },
      );
    }

    if (workflowRef.ownerId !== userId) {
      return apiErrorResponse(
        {
          status: 403,
          type: "authorization_error",
          code: "forbidden",
          message: "You do not have permission to access this workflow.",
        },
        { headers: corsHeaders },
      );
    }

    const json = await request.json();
    const parsed = V1ChatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return apiErrorResponse(
        {
          status: 400,
          type: "invalid_request_error",
          code: "invalid_body",
          message: "Invalid body.",
        },
        { headers: corsHeaders },
      );
    }

    const { message } = parsed.data;

    const workflowData = await getWorkflowWithGraph(workflowRef.workflowId);
    if (!workflowData) {
      return apiErrorResponse(
        {
          status: 404,
          type: "not_found_error",
          code: "workflow_not_found",
          message: "Workflow not found.",
        },
        { headers: corsHeaders },
      );
    }

    const sidebarNodes = await getSidebarNodesWithOptions();
    const { nodes, edges } = buildFlowGraphFromWorkflow({
      workflowNodes: workflowData.nodes,
      workflowEdges: workflowData.edges,
      sidebarNodes,
    });

    if (!nodes || !edges) {
      return apiErrorResponse(
        {
          status: 400,
          type: "invalid_request_error",
          code: "graph_not_found",
          message: "Failed to build graph from workflow.",
        },
        { headers: corsHeaders },
      );
    }

    const state = {
      messages: [new HumanMessage(message)],
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
          flowId,
          workflowId: workflowRef.workflowId,
        },
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("POST /api/v1/chat error:", error);
    return apiErrorResponse(error, { headers: corsHeaders });
  }
}
