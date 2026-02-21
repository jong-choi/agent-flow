import { HumanMessage } from "@langchain/core/messages";
import { createApiError } from "@/app/api/_errors/api-error";
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
import { getWorkflowWithGraph } from "@/features/workflows/server/queries";

type RunWorkflowParams = {
  workflowId: string;
  userId: string;
  message: string;
};

type WorkflowStreamCallbacks = {
  onStart?: () => void;
  onDelta?: (delta: string) => void;
  onEnd?: () => void;
};

const createWorkflowRuntime = async ({
  workflowId,
  message,
}: RunWorkflowParams) => {
  const workflowData = await getWorkflowWithGraph(workflowId);
  if (!workflowData) {
    throw createApiError("workflowNotFound", {
      message: "Workflow not found.",
    });
  }

  const sidebarNodes = await getSidebarNodesWithOptions();
  const { nodes, edges } = buildFlowGraphFromWorkflow({
    workflowNodes: workflowData.nodes,
    workflowEdges: workflowData.edges,
    sidebarNodes,
  });

  if (!nodes || !edges) {
    throw createApiError("graphNotFound", {
      message: "Failed to build graph from workflow.",
    });
  }

  const state = {
    messages: [new HumanMessage(message)],
    initialInput: message,
    outputMap: {},
    inputTree: buildInputTree({ nodes, edges }),
  };

  const graph = buildStateGraph({ nodes, edges });
  const app = graph.compile({});

  return { app, state };
};

export const streamWorkflowForUserMessage = async ({
  workflowId,
  userId,
  message,
  onStart,
  onDelta,
  onEnd,
}: RunWorkflowParams & WorkflowStreamCallbacks) => {
  const { app, state } = await createWorkflowRuntime({
    workflowId,
    userId,
    message,
  });

  const threadId = crypto.randomUUID();
  const streamingChunkMap = new Map<string, string>();
  const completedMessageMap = new Map<string, string>();
  const nodeOrder: string[] = [];
  const nodeStartedSet = new Set<string>();
  const nodeCompletedSet = new Set<string>();
  const emittedLengthMap = new Map<string, number>();
  let emitCursor = 0;
  let hasAnyVisibleOutput = false;
  let pendingBoundaryCount = 0;
  let didEmitStart = false;

  const flushBufferedOutput = () => {
    while (emitCursor < nodeOrder.length) {
      const nodeId = nodeOrder[emitCursor];
      const fullContent = streamingChunkMap.get(nodeId) ?? "";
      let emittedLength = emittedLengthMap.get(nodeId) ?? 0;

      if (fullContent.length > emittedLength) {
        if (emittedLength === 0) {
          if (hasAnyVisibleOutput && pendingBoundaryCount > 0) {
            onDelta?.("\n\n".repeat(pendingBoundaryCount));
          }
          pendingBoundaryCount = 0;
        }

        const delta = fullContent.slice(emittedLength);
        if (delta.length > 0) {
          onDelta?.(delta);
          hasAnyVisibleOutput = true;
        }
        emittedLength = fullContent.length;
        emittedLengthMap.set(nodeId, emittedLength);
      }

      if (!nodeCompletedSet.has(nodeId)) {
        break;
      }

      if (hasAnyVisibleOutput) {
        pendingBoundaryCount += 1;
      }
      emitCursor += 1;
    }
  };

  for await (const chunk of app.streamEvents(state, {
    version: "v2",
    configurable: { thread_id: threadId, user_id: userId },
    durability: "exit",
  })) {
    if (
      !isEventName(chunk.event) ||
      typeof chunk.metadata?.type !== "string" ||
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
      if (!didEmitStart) {
        onStart?.();
        didEmitStart = true;
      }

      if (!nodeStartedSet.has(nodeId)) {
        nodeOrder.push(nodeId);
        nodeStartedSet.add(nodeId);
      }

      if (!streamingChunkMap.has(nodeId)) {
        streamingChunkMap.set(nodeId, "");
      }
      if (!completedMessageMap.has(nodeId)) {
        completedMessageMap.set(nodeId, "");
      }
      flushBufferedOutput();
    } else if (event === "on_chat_model_stream") {
      const content = parsedChunk.data.data?.chunk?.content;
      if (typeof content !== "string") {
        continue;
      }
      const current = streamingChunkMap.get(nodeId) ?? "";
      streamingChunkMap.set(nodeId, current + content);
      flushBufferedOutput();
    } else if (event === "on_chat_model_end") {
      const completed = streamingChunkMap.get(nodeId) ?? "";
      completedMessageMap.set(nodeId, completed);
      nodeCompletedSet.add(nodeId);
      flushBufferedOutput();
    }
  }

  onEnd?.();

  return Array.from(completedMessageMap.values()).join("\n\n").trim();
};

export const runWorkflowForUserMessage = async ({
  workflowId,
  userId,
  message,
}: RunWorkflowParams) =>
  streamWorkflowForUserMessage({
    workflowId,
    userId,
    message,
  });
