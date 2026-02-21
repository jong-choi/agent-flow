import {
  type ApiErrorCode,
  type ApiErrorType,
  apiErrorPayloadSchema,
} from "@/app/api/_types/api-error";

class ApiTypedError extends Error {
  readonly status: number;
  readonly type: ApiErrorType;
  readonly code: ApiErrorCode;

  constructor({
    status,
    type,
    code,
    message,
  }: {
    status: number;
    type: ApiErrorType;
    code: ApiErrorCode;
    message: string;
  }) {
    super(message);
    this.name = "ApiTypedError";
    this.status = status;
    this.type = type;
    this.code = code;
  }
}

const createApiTypedError = ({
  status,
  type,
  code,
  message,
}: {
  status: number;
  type: ApiErrorType;
  code: ApiErrorCode;
  message: string;
}) => new ApiTypedError({ status, type, code, message });

type ApiErrorTemplate = {
  status: number;
  type: ApiErrorType;
  code: ApiErrorCode;
  message: string;
};

const apiErrorTemplates = {
  invalidRequest: {
    status: 400,
    type: "invalid_request_error",
    code: "invalid_request",
    message: "Invalid request.",
  },
  invalidBody: {
    status: 400,
    type: "invalid_request_error",
    code: "invalid_body",
    message: "Invalid body.",
  },
  invalidModel: {
    status: 400,
    type: "invalid_request_error",
    code: "invalid_model",
    message: "Invalid model.",
  },
  authRequired: {
    status: 401,
    type: "authentication_error",
    code: "auth_required",
    message: "Authentication required.",
  },
  forbidden: {
    status: 403,
    type: "authorization_error",
    code: "forbidden",
    message: "You do not have permission to access this resource.",
  },
  workflowNotFound: {
    status: 404,
    type: "not_found_error",
    code: "workflow_not_found",
    message: "Workflow not found.",
  },
  chatNotFound: {
    status: 404,
    type: "not_found_error",
    code: "chat_not_found",
    message: "Chat not found.",
  },
  threadNotFound: {
    status: 404,
    type: "not_found_error",
    code: "thread_not_found",
    message: "Session not found.",
  },
  graphNotFound: {
    status: 400,
    type: "invalid_request_error",
    code: "graph_not_found",
    message: "Graph information is missing.",
  },
  insufficientCredit: {
    status: 402,
    type: "credits",
    code: "insufficient_credit",
    message: "Insufficient credit.",
  },
  rateLimitExceeded: {
    status: 413,
    type: "tokens",
    code: "rate_limit_exceeded",
    message:
      "Request too large for the model limits. Try a shorter message or start a new chat.",
  },
  providerError: {
    status: 502,
    type: "provider_error",
    code: "provider_error",
    message: "Provider rejected the request.",
  },
  internalError: {
    status: 500,
    type: "server_error",
    code: "internal_error",
    message: "Internal Server Error",
  },
  attendanceAlreadyClaimed: {
    status: 409,
    type: "invalid_request_error",
    code: "invalid_request",
    message: "Daily attendance has already been claimed.",
  },
} as const satisfies Record<string, ApiErrorTemplate>;

type ApiErrorTemplateKey = keyof typeof apiErrorTemplates;

export const createApiError = (
  key: ApiErrorTemplateKey,
  overrides?: Partial<ApiErrorTemplate>,
) =>
  createApiTypedError({
    ...apiErrorTemplates[key],
    ...overrides,
    message: overrides?.message ?? apiErrorTemplates[key].message,
  });

const isApiTypedError = (error: unknown): error is ApiTypedError =>
  error instanceof ApiTypedError;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";

export const mapUnknownToApiTypedError = (error: unknown): ApiTypedError => {
  if (isApiTypedError(error)) {
    return error;
  }

  if (isRecord(error)) {
    const candidate = "error" in error ? error.error : error;
    const parsed = apiErrorPayloadSchema.safeParse(candidate);
    if (parsed.success) {
      return createApiTypedError({ ...parsed.data, status: 500 });
    }
  }

  console.error("Unmapped API error:", error);
  return createApiError("internalError");
};

export const apiErrorResponse = (
  error: unknown,
  init?: {
    status?: number;
    headers?: HeadersInit;
  },
) => {
  const mapped = mapUnknownToApiTypedError(error);
  const status = init?.status ?? mapped.status;

  return Response.json(
    {
      error: {
        message: mapped.message,
        type: mapped.type,
        code: mapped.code,
      },
    },
    {
      status,
      headers: init?.headers,
    },
  );
};
