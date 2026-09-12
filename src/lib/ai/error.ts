const record = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;

export type ProviderErrorCategory =
  | "authentication"
  | "permission"
  | "not_found"
  | "quota"
  | "invalid_request"
  | "upstream"
  | "cancelled"
  | "timeout"
  | "unknown";

/** Server-only diagnostic metadata: never copy request objects/headers or raw errors to the client. */
export function normalizeProviderError(value: unknown) {
  const error = record(value) ?? {};
  const response = record(error.response);
  const data =
    record(record(error.error)?.error) ??
    record(error.error) ??
    record(record(error.data)?.error);
  const statusValue =
    error.status ??
    error.statusCode ??
    error.status_code ??
    response?.status ??
    data?.code;
  const status = typeof statusValue === "number" ? statusValue : null;
  const codeValue =
    typeof data?.code === "string" ? data.code : (data?.status ?? error.code);
  const code = typeof codeValue === "string" ? codeValue : null;
  const headers = error.headers ?? response?.headers;
  const readHeader = (name: string) => {
    if (headers && typeof (headers as Headers).get === "function")
      return (headers as Headers).get(name);
    const values = record(headers);
    const key = Object.keys(values ?? {}).find(
      (key) => key.toLowerCase() === name,
    );
    return key && typeof values?.[key] === "string"
      ? (values[key] as string)
      : null;
  };
  let category: ProviderErrorCategory = "unknown";
  if (error.name === "AbortError") category = "cancelled";
  else if (
    error.name === "TimeoutError" ||
    error.name === "APIConnectionTimeoutError" ||
    code === "ETIMEDOUT"
  )
    category = "timeout";
  else if (status === 401) category = "authentication";
  else if (status === 403) category = "permission";
  else if (status === 404) category = "not_found";
  else if (status === 429) category = "quota";
  else if (
    (status !== null && status >= 500) ||
    error.name === "APIConnectionError" ||
    ["ECONNRESET", "ENOTFOUND", "EPIPE"].includes(
      String(error.code ?? record(error.cause)?.code),
    )
  )
    category = "upstream";
  else if (status !== null && status >= 400) category = "invalid_request";
  const details = Array.isArray(data?.details) ? data.details : [];
  const retryInfo = details
    .map(record)
    .find(
      (detail) =>
        detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
    );
  const message = String(data?.message ?? error.message ?? "");
  const quotaFailure = details
    .map(record)
    .find(
      (d) => d?.["@type"] === "type.googleapis.com/google.rpc.QuotaFailure",
    );
  // Oversized reservations cannot recover by waiting; the request must be reduced.
  if (
    status === 429 &&
    /request too large for model|expected output tokens exceed/i.test(message)
  )
    category = "invalid_request";
  const modelQuota =
    category === "quota" &&
    (/rate limit reached for model\b|(?:^|[,;]\s*)model\s*:/i.test(message) ||
      (Array.isArray(quotaFailure?.violations) &&
        quotaFailure.violations.some((v: unknown) =>
          Boolean(record(record(v)?.quotaDimensions)?.model),
        )));
  const modelPermission =
    category === "permission" &&
    [
      "model_access_denied",
      "MODEL_ACCESS_DENIED",
      "MODEL_NOT_ENABLED",
    ].includes(code ?? "");
  return {
    scope:
      modelQuota || modelPermission
        ? ("model" as const)
        : ("provider" as const),
    status,
    code,
    category,
    retryAfter: readHeader("retry-after"),
    retryDelay:
      typeof retryInfo?.retryDelay === "string" ? retryInfo.retryDelay : null,
    modelMissing:
      [400, 404, 410].includes(status ?? 0) &&
      ((!/not have access|permission|access denied/i.test(message) &&
        /model.*(not found|does not exist|decommissioned|retired|not available)/i.test(
          message,
        )) ||
        ["model_not_found", "model_decommissioned"].includes(code ?? "")),
    remainingRequests: readHeader("x-ratelimit-remaining-requests"),
    remainingTokens: readHeader("x-ratelimit-remaining-tokens"),
    resetRequests: readHeader("x-ratelimit-reset-requests"),
    resetTokens: readHeader("x-ratelimit-reset-tokens"),
  };
}
