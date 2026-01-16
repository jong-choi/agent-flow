import { randomUUID } from "crypto";
import { MemorySaver } from "@langchain/langgraph";
import { type FlowStateAnnotation } from "@/app/api/chat/flow-state";

const SESSION_IDLE_TIMEOUT_MS = 1000 * 60 * 5; // 5분
export const checkpointer = new MemorySaver();

export type Session = {
  id: string;
  state?: Partial<typeof FlowStateAnnotation.State>;
  idleTimer?: ReturnType<typeof setTimeout>;
  count?: number;
};

class SessionStore {
  private sessions = new Map<string, Session>();

  get(id: string) {
    return this.sessions.get(id);
  }

  set(session: Session) {
    this.sessions.set(session.id, session);
  }

  has(id: string) {
    return this.sessions.has(id);
  }

  delete(id: string) {
    const s = this.sessions.get(id);
    if (s?.idleTimer) {
      clearTimeout(s.idleTimer);
      s.idleTimer = undefined;
    }
    this.sessions.delete(id);
  }

  clearIdleTimer(id: string) {
    const s = this.sessions.get(id);
    if (s?.idleTimer) {
      clearTimeout(s.idleTimer);
      s.idleTimer = undefined;
    }
  }

  setIdleTimer(id: string, ms: number, onTimeout: () => void) {
    const s = this.sessions.get(id);
    if (!s) return;
    if (s.idleTimer) {
      clearTimeout(s.idleTimer);
    }
    s.idleTimer = setTimeout(onTimeout, ms);
  }
}

export const sessionStore = new SessionStore();

export const resetIdleTimer = (id: string) => {
  try {
    sessionStore.setIdleTimer(id, SESSION_IDLE_TIMEOUT_MS, () => {
      checkpointer.deleteThread(id);
      sessionStore.delete(id);
    });
  } catch (error) {
    console.error("Reset idle timer error:", error); //디버깅
  }
};

export const handleConnect = async () => {
  const id = randomUUID();
  sessionStore.set({ id });
  sessionStore.setIdleTimer(id, SESSION_IDLE_TIMEOUT_MS, () => {
    checkpointer.deleteThread(id);
    sessionStore.delete(id);
  });
  return { sessionId: id };
};
