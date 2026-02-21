import { z } from "zod";

const apiErrorTypeSchema = z.enum([
  "invalid_request_error",
  "authentication_error",
  "authorization_error",
  "not_found_error",
  "tokens",
  "credits",
  "provider_error",
  "server_error",
]);

const apiErrorCodeSchema = z.enum([
  "invalid_api_key",
  "invalid_body",
  "invalid_messages",
  "invalid_input",
  "invalid_request",
  "invalid_model",
  "missing_chat_id",
  "missing_thread_id",
  "auth_required",
  "forbidden",
  "workflow_not_found",
  "chat_not_found",
  "thread_not_found",
  "graph_not_found",
  "insufficient_credit",
  "rate_limit_exceeded",
  "provider_error",
  "stream_error",
  "internal_error",
]);

export const apiErrorPayloadSchema = z.object({
  message: z.string(),
  type: apiErrorTypeSchema,
  code: apiErrorCodeSchema,
});

export type ApiErrorType = z.infer<typeof apiErrorTypeSchema>;
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiErrorPayload = z.infer<typeof apiErrorPayloadSchema>;
