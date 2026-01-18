import { randomUUID } from "crypto";
import { MemorySaver } from "@langchain/langgraph";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import { type FlowEdge, type FlowNode } from "@/app/api/chat/_types/nodes";

const THREAD_IDLE_TIMEOUT_MS = 1000 * 60 * 5; // 5분
export const checkpointer = new MemorySaver();

export type ThreadContext = {
  id: string;
  graph: {
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
  state: typeof FlowStateAnnotation.State;
  idleTimer?: ReturnType<typeof setTimeout>;
};

// idle 타이머를 이용해 checkpointer에 있는 메모리를 휘발시킨다.
class ThreadContextManager {
  private threadContexts = new Map<string, ThreadContext>();

  get(id: string) {
    return this.threadContexts.get(id);
  }

  set(threadContext: ThreadContext) {
    this.threadContexts.set(threadContext.id, threadContext);
  }

  has(id: string) {
    return this.threadContexts.has(id);
  }

  delete(id: string) {
    const threadContext = this.threadContexts.get(id);
    if (threadContext?.idleTimer) {
      clearTimeout(threadContext.idleTimer);
      threadContext.idleTimer = undefined;
    }
    this.threadContexts.delete(id);
  }

  clearIdleTimer(id: string) {
    const threadContext = this.threadContexts.get(id);
    if (threadContext?.idleTimer) {
      clearTimeout(threadContext.idleTimer);
      threadContext.idleTimer = undefined;
    }
  }

  setIdleTimer(id: string, ms: number, onTimeout: () => void) {
    const threadContext = this.threadContexts.get(id);
    if (!threadContext) return;
    if (threadContext.idleTimer) {
      clearTimeout(threadContext.idleTimer);
    }
    threadContext.idleTimer = setTimeout(onTimeout, ms);
  }
}

export const threadContextManager = new ThreadContextManager();

export const resetIdleTimer = (threadId: string) => {
  try {
    threadContextManager.setIdleTimer(threadId, THREAD_IDLE_TIMEOUT_MS, () => {
      checkpointer.deleteThread(threadId);
      threadContextManager.delete(threadId);
    });
  } catch (error) {
    console.error("Reset idle timer error:", error); //디버깅
  }
};

export const createThread = async ({
  state,
  graph,
}: {
  state: ThreadContext["state"];
  graph: ThreadContext["graph"];
}) => {
  const threadId = randomUUID();
  threadContextManager.set({ id: threadId, state, graph });
  threadContextManager.setIdleTimer(threadId, THREAD_IDLE_TIMEOUT_MS, () => {
    checkpointer.deleteThread(threadId);
    threadContextManager.delete(threadId);
  });
  return { thread_id: threadId };
};
