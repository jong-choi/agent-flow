import {
  getUserIdByCanvasSecret,
  getWorkflowByCanvasId,
} from "@/features/developers/server/queries";

type OpenAiErrorType =
  | "invalid_request_error"
  | "authentication_error"
  | "not_found_error"
  | "server_error";

type OpenAiErrorCode =
  | "invalid_api_key"
  | "invalid_model"
  | "invalid_body"
  | "invalid_messages"
  | "invalid_input"
  | "internal_error";

export const openAiCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-CANVAS-SECRET, OpenAI-Beta",
  "Access-Control-Max-Age": "86400",
} as const;

export const openAiSseHeaders = {
  ...openAiCorsHeaders,
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

export class OpenAiCompatError extends Error {
  readonly status: number;
  readonly type: OpenAiErrorType;
  readonly code?: OpenAiErrorCode;

  constructor({
    status,
    type,
    code,
    message,
  }: {
    status: number;
    type: OpenAiErrorType;
    code?: OpenAiErrorCode;
    message: string;
  }) {
    super(message);
    this.name = "OpenAiCompatError";
    this.status = status;
    this.type = type;
    this.code = code;
  }
}

const mergeHeaders = (headers?: HeadersInit) => ({
  ...openAiCorsHeaders,
  ...(headers ?? {}),
});

export const openAiErrorResponse = ({
  status,
  type,
  code,
  message,
  headers,
}: {
  status: number;
  type: OpenAiErrorType;
  code?: OpenAiErrorCode;
  message: string;
  headers?: HeadersInit;
}) =>
  Response.json(
    {
      error: {
        message,
        type,
        ...(code ? { code } : {}),
      },
    },
    {
      status,
      headers: mergeHeaders(headers),
    },
  );

export const openAiJsonResponse = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    status: init?.status ?? 200,
    headers: mergeHeaders(init?.headers),
  });

export const handleOpenAiRouteError = (routeLabel: string, error: unknown) => {
  if (error instanceof OpenAiCompatError) {
    return openAiErrorResponse({
      status: error.status,
      type: error.type,
      code: error.code,
      message: error.message,
    });
  }

  console.error(`${routeLabel} error:`, error);
  return openAiErrorResponse({
    status: 500,
    type: "server_error",
    code: "internal_error",
    message: "Internal Server Error",
  });
};

export const getOpenAiSecretFromHeaders = (headers: Headers) => {
  const authHeader = headers.get("Authorization")?.trim() ?? "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) {
    return bearerMatch[1].trim();
  }

  return headers.get("X-CANVAS-SECRET")?.trim() ?? "";
};

export const resolveOpenAiWorkflowContext = async ({
  headers,
  model,
}: {
  headers: Headers;
  model: string;
}) => {
  const canvasId = model.trim();
  if (!canvasId) {
    throw new OpenAiCompatError({
      status: 400,
      type: "invalid_request_error",
      code: "invalid_model",
      message: "model(X-CANVAS-ID)은 필수입니다.",
    });
  }

  const secret = getOpenAiSecretFromHeaders(headers);
  if (!secret) {
    throw new OpenAiCompatError({
      status: 401,
      type: "authentication_error",
      code: "invalid_api_key",
      message: "Authorization: Bearer <key> 또는 X-CANVAS-SECRET이 필요합니다.",
    });
  }

  const userId = await getUserIdByCanvasSecret({ secret });
  if (!userId) {
    throw new OpenAiCompatError({
      status: 401,
      type: "authentication_error",
      code: "invalid_api_key",
      message: "유효하지 않은 API Key입니다.",
    });
  }

  const workflowRef = await getWorkflowByCanvasId({ canvasId });
  if (!workflowRef || workflowRef.ownerId !== userId) {
    throw new OpenAiCompatError({
      status: 404,
      type: "invalid_request_error",
      code: "invalid_model",
      message: "유효하지 않은 model(X-CANVAS-ID)입니다.",
    });
  }

  return {
    userId,
    workflowId: workflowRef.workflowId,
    canvasId,
  };
};

const collectTextParts = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectTextParts(entry));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const texts: string[] = [];

  if (typeof record.text === "string") {
    texts.push(record.text);
  }
  if (typeof record.input_text === "string") {
    texts.push(record.input_text);
  }
  if (typeof record.value === "string") {
    texts.push(record.value);
  }
  if ("content" in record) {
    texts.push(...collectTextParts(record.content));
  }
  if ("input" in record) {
    texts.push(...collectTextParts(record.input));
  }

  return texts;
};

const normalizeText = (parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join("\n\n")
    .trim();

export const extractLastUserTextFromChatMessages = (
  messages: Array<{ role: string; content: unknown }>,
) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || message.role !== "user") {
      continue;
    }

    const text = normalizeText(collectTextParts(message.content));
    if (text) {
      return text;
    }
  }

  return null;
};

export const extractLastUserTextFromResponsesInput = (
  input: unknown,
): string | null => {
  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(input)) {
    for (let index = input.length - 1; index >= 0; index -= 1) {
      const item = input[index];

      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
        continue;
      }

      if (!item || typeof item !== "object") {
        continue;
      }

      const record = item as Record<string, unknown>;
      if (typeof record.role === "string" && record.role !== "user") {
        continue;
      }

      const text = normalizeText(collectTextParts(record.content ?? record));
      if (text) {
        return text;
      }
    }

    return null;
  }

  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    if ("input" in record) {
      return extractLastUserTextFromResponsesInput(record.input);
    }

    if (typeof record.role === "string" && record.role !== "user") {
      return null;
    }

    const text = normalizeText(collectTextParts(record.content ?? record));
    return text || null;
  }

  return null;
};

export const splitTextForStreaming = (text: string, chunkSize = 120) => {
  if (!text) {
    return [];
  }

  const safeSize = Math.max(1, Math.floor(chunkSize));
  const chars = Array.from(text);
  const chunks: string[] = [];

  for (let index = 0; index < chars.length; index += safeSize) {
    chunks.push(chars.slice(index, index + safeSize).join(""));
  }

  return chunks;
};

export const buildOpenAiId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
