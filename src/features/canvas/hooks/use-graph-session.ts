"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { type Edge } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";

export const GRAPH_SESSION_STORAGE_PREFIX = "canvas-graph-session";

const getStorageKey = (workflowId?: string | null) =>
  `${GRAPH_SESSION_STORAGE_PREFIX}:${workflowId || "new"}`;

export function useGraphSession() {
  const saveGraphSession = useCallback(
    ({
      workflowId,
      nodes,
      edges,
    }: {
      workflowId?: string | null;
      nodes: FlowCanvasNode[];
      edges: Edge[];
    }) => {
      if (typeof window === "undefined") {
        return;
      }

      const storageKey = getStorageKey(workflowId);

      const payload: {
        nodes: FlowCanvasNode[];
        edges: Edge[];
        savedAt: string;
      } = {
        nodes,
        edges,
        savedAt: new Date().toISOString(),
      };

      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (error) {
        console.error("Failed to save graph session:", error);
      }
    },
    [],
  );

  const getGraphSession = useCallback(
    ({ workflowId }: { workflowId?: string | null } = {}) => {
      if (typeof window === "undefined") {
        return null;
      }

      const storageKey = getStorageKey(workflowId);

      try {
        const raw = window.sessionStorage.getItem(storageKey);
        if (!raw) {
          return null;
        }

        const parsed = JSON.parse(raw) as {
          nodes: FlowCanvasNode[];
          edges: Edge[];
          savedAt: string;
        };
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          return null;
        }

        return {
          nodes: parsed.nodes,
          edges: parsed.edges,
          savedAt: parsed.savedAt,
        } satisfies {
          nodes: FlowCanvasNode[];
          edges: Edge[];
          savedAt: string;
        };
      } catch (error) {
        console.error("Failed to read graph session:", error);
        return null;
      }
    },
    [],
  );

  const deleteGraphSession = useCallback(
    ({ workflowId }: { workflowId?: string | null } = {}) => {
      if (typeof window === "undefined") {
        return;
      }

      const storageKey = getStorageKey(workflowId);
      window.sessionStorage.removeItem(storageKey);
    },
    [],
  );

  return { saveGraphSession, getGraphSession, deleteGraphSession };
}

const clearAllGraphSessions = () => {
  if (typeof window === "undefined") {
    return;
  }

  const keys: string[] = [];
  const prefix = `${GRAPH_SESSION_STORAGE_PREFIX}:`;

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }

  for (const key of keys) {
    window.sessionStorage.removeItem(key);
  }
};

export function useResetGraphSession() {
  const session = useSession();
  const previousUserIdRef = useRef<string | null>(null);
  const currentUserId = session.data?.user?.id ?? null;

  useEffect(() => {
    if (session.status === "loading") {
      return;
    }

    if (!currentUserId) {
      clearAllGraphSessions();
    } else if (
      previousUserIdRef.current &&
      previousUserIdRef.current !== currentUserId
    ) {
      clearAllGraphSessions();
    }

    previousUserIdRef.current = currentUserId;
  }, [currentUserId, session.status]);
}
