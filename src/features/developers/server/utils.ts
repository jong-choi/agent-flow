import "server-only";

import { nanoid } from "nanoid";

const USER_SECRET_PREFIX = "lc-";
const WORKFLOW_CANVAS_ID_PREFIX = "lc-id-";

const USER_SECRET_NANOID_LENGTH = 22;
const WORKFLOW_CANVAS_ID_NANOID_LENGTH = 19;

export const maskAfterPrefix = (secret: string, visibleChars = 2) => {
  const prefix = secret.startsWith(WORKFLOW_CANVAS_ID_PREFIX)
    ? WORKFLOW_CANVAS_ID_PREFIX
    : secret.startsWith(USER_SECRET_PREFIX)
      ? USER_SECRET_PREFIX
      : "";

  const remainder = secret.slice(prefix.length);
  const exposed = remainder.slice(0, visibleChars);
  const masked = "*".repeat(Math.max(remainder.length - visibleChars, 0));
  return `${prefix}${exposed}${masked}`;
};

export const buildUserSecret = () =>
  `${USER_SECRET_PREFIX}${nanoid(USER_SECRET_NANOID_LENGTH)}`;

export const buildWorkflowCanvasId = () =>
  `${WORKFLOW_CANVAS_ID_PREFIX}${nanoid(WORKFLOW_CANVAS_ID_NANOID_LENGTH)}`;

export const sha256Hex = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
