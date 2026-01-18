"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type NodeContentOption = {
  id: string;
  value: string;
};

type NodeContent = {
  id: string;
  nodeId: string;
  type: "select" | "dialog";
  label: string;
  placeholder: string | null;
  value: string | null;
  optionsSource: "ai_models" | null;
  dialogTitle: string | null;
  dialogDescription: string | null;
  options?: NodeContentOption[];
};

type FlowNodeData = {
  label: string;
  description: string;
  createdAt: string;
  content: NodeContent | null;
  handle: null;
  information: null;
};

type FlowNodePayload = {
  id: string;
  type: "startNode" | "chatNode" | "endNode";
  position: { x: number; y: number };
  data: FlowNodeData;
};

type FlowEdgePayload = {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

type GraphPayload = {
  nodes: FlowNodePayload[];
  edges: FlowEdgePayload[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "streaming";
};

const MODEL_ID = "gemma-3-1b-it";

const createUuid = () => {
  return crypto.randomUUID();
};

const buildTestGraph = (): GraphPayload => {
  const createdAt = new Date().toISOString();
  const startId = createUuid();
  const chatId = createUuid();
  const endId = createUuid();

  const chatContent: NodeContent = {
    id: createUuid(),
    nodeId: createUuid(),
    type: "select",
    label: "Agent",
    placeholder: "Select agent",
    value: MODEL_ID,
    optionsSource: "ai_models",
    dialogTitle: null,
    dialogDescription: null,
    options: [
      { id: "option-1", value: "gemma-3-1b-it" },
      { id: "option-2", value: "gemma-3-4b-it" },
      { id: "option-3", value: "gemma-3-12b-it" },
      { id: "option-4", value: "gemma-3-27b-it" },
    ],
  };

  return {
    nodes: [
      {
        id: startId,
        type: "startNode",
        position: { x: 0, y: 0 },
        data: {
          label: "Start",
          description: "Start node",
          createdAt,
          content: null,
          handle: null,
          information: null,
        },
      },
      {
        id: chatId,
        type: "chatNode",
        position: { x: 240, y: 0 },
        data: {
          label: "Chat",
          description: "Response node",
          createdAt,
          content: chatContent,
          handle: null,
          information: null,
        },
      },
      {
        id: endId,
        type: "endNode",
        position: { x: 480, y: 0 },
        data: {
          label: "End",
          description: "End node",
          createdAt,
          content: null,
          handle: null,
          information: null,
        },
      },
    ],
    edges: [
      {
        id: "edge-start-chat",
        source: startId,
        target: chatId,
        sourceHandle: "source",
        targetHandle: "target",
      },
      {
        id: "edge-chat-end",
        source: chatId,
        target: endId,
        sourceHandle: "source",
        targetHandle: "target",
      },
    ],
  };
};

const createMessageId = () => createUuid();

const extractChunkText = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "text" in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }
  return "";
};

export default function Page() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const streamAbortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const graphPayload = useMemo(() => buildTestGraph(), []);

  const handleCreateThread = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
      setIsStreaming(false);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graphPayload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "Failed to create thread.";
        throw new Error(message);
      }

      const payload = (await response.json()) as {
        data?: { thread_id?: string };
      };
      const nextThreadId = payload?.data?.thread_id;

      if (!nextThreadId) {
        throw new Error("thread_id was not returned.");
      }

      setThreadId(nextThreadId);
      setMessages([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      setThreadId(null);
    } finally {
      setIsCreating(false);
    }
  }, [graphPayload]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !threadId || isStreaming) return;

    setInput("");
    setError(null);

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };
    const assistantMessageId = createMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    try {
      const response = await fetch(`/api/chat/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "Failed to fetch response.";
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("Response stream is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedEnd = false;
      const appendDelta = (delta: string) => {
        if (!delta) return;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: `${message.content}${delta}`,
                }
              : message,
          ),
        );
      };
      const markStreamDone = () => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? { ...message, status: undefined }
              : message,
          ),
        );
        setIsStreaming(false);
      };
      const handleSseLine = (line: string) => {
        if (!line.startsWith("data:")) return;
        const jsonText = line.replace(/^data:\s*/, "");
        if (!jsonText) return;
        try {
          const eventPayload = JSON.parse(jsonText) as {
            event?: string;
            chunk?: { content?: unknown };
          };

          if (eventPayload.event === "on_chat_model_stream") {
            appendDelta(extractChunkText(eventPayload.chunk?.content));
          } else if (eventPayload.event === "on_chat_model_end") {
            receivedEnd = true;
            markStreamDone();
          }
        } catch (parseError) {
          console.error("Failed to parse SSE payload:", parseError);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        console.log(JSON.stringify(value, null, 2));
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            handleSseLine(line);
          }
          if (receivedEnd) {
            break;
          }
        }
        if (receivedEnd) {
          await reader.cancel();
          break;
        }
      }

      if (buffer.trim().length > 0) {
        const lines = buffer.split("\n");
        for (const line of lines) {
          handleSseLine(line);
          if (receivedEnd) {
            break;
          }
        }
      }

      if (!receivedEnd) {
        markStreamDone();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: message.content || "Failed to generate response.",
                status: undefined,
              }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
      streamAbortRef.current = null;
    }
  }, [input, isStreaming, threadId]);

  useEffect(() => {
    void handleCreateThread();
  }, [handleCreateThread]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    listEl.scrollTop = listEl.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Chat Flow Test
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              Multi-turn Chat Test
            </h1>
            <p className="text-sm text-muted-foreground">
              start - chat - end | model: {MODEL_ID}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateThread}
              disabled={isCreating}
              className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating thread..." : "New thread"}
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Thread ID</span>
            <span className="font-mono text-xs text-foreground">
              {threadId ?? "Idle"}
            </span>
          </div>
          {error ? (
            <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
          ) : null}
        </section>

        <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur">
          <div
            ref={listRef}
            className="scrollbar-slim flex-1 space-y-4 overflow-y-auto p-5"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <p>Send a message to start the conversation.</p>
                <p>
                  Once the thread is ready, you can test multi-turn replies.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.status === "streaming" ? (
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/60" />
                        Generating response
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            className="flex flex-col gap-3 border-t border-border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={
                threadId
                  ? "Type a message... (Enter to send, Shift+Enter for newline)"
                  : "Create a thread first."
              }
              disabled={!threadId || isCreating}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {threadId
                  ? isStreaming
                    ? "Streaming response"
                    : "Idle"
                  : "Thread required"}
              </span>
              <button
                type="submit"
                disabled={
                  !threadId || isStreaming || isCreating || !input.trim()
                }
                className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
