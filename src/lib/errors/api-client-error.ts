import {
  type ApiErrorCode,
  type ApiErrorPayload,
  apiErrorPayloadSchema,
} from "@/app/api/_types/api-error";

export class ApiClientError extends Error {
  readonly payload: ApiErrorPayload;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiClientError";
    this.payload = payload;
  }
}

export const isApiClientError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError;

export const parseApiErrorPayload = (
  value: unknown,
): ApiErrorPayload | null => {
  const candidate =
    value && typeof value === "object" && "error" in value
      ? (value as { error?: unknown }).error
      : value;
  const parsed = apiErrorPayloadSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

export const apiToastKeyMaps: Partial<Record<ApiErrorCode, string>> = {
  invalid_body: "toast.invalidBody",
  invalid_request: "toast.invalidRequest",
  invalid_model: "toast.invalidModel",
  missing_thread_id: "toast.missingThreadId",
  workflow_not_found: "toast.workflowNotFound",
  insufficient_credit: "toast.insufficientCredit",
  rate_limit_exceeded: "toast.contextTooLarge",
  auth_required: "toast.authRequired",
  forbidden: "toast.forbidden",
  chat_not_found: "toast.chatNotFound",
  thread_not_found: "toast.startSessionNotFound",
  graph_not_found: "toast.startGraphNotFound",
  internal_error: "toast.fallback",
};

export const resolveApiToastMessage = ({
  t,
  code,
  fallbackKey,
}: {
  t: (key: string) => string;
  code?: ApiErrorCode | string;
  fallbackKey: string;
}) => {
  const mappedKey = code ? apiToastKeyMaps[code as ApiErrorCode] : undefined;
  return t(mappedKey ?? fallbackKey);
};
