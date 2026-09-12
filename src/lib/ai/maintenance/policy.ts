import type { normalizeProviderError } from "../error";

export type ProviderFailure = ReturnType<typeof normalizeProviderError>;
export type Observation = {
  ok: boolean;
  source: "runtime" | "probe";
  at: number;
  error?: ProviderFailure;
};
export interface HealthState {
  status: "healthy" | "cooldown" | "probing" | "suspended" | "blocked";
  reason: string | null;
  probeModelId: string | null;
  failures: number;
  failureWindowAt: number | null;
  cooldownStep: number;
  firstFailureAt: number | null;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  lastProbeAt: number | null;
  failedProbes: number;
  recoverySuccesses: number;
  nextProbeAt: number | null;
  missingSince: number | null;
  missingCount: number;
  lastMissingAt: number | null;
  modelNotFoundAt: number | null;
}
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const initialHealth = (): HealthState => ({
  status: "healthy",
  reason: null,
  probeModelId: null,
  failures: 0,
  failureWindowAt: null,
  cooldownStep: 0,
  firstFailureAt: null,
  lastFailureAt: null,
  lastSuccessAt: null,
  lastProbeAt: null,
  failedProbes: 0,
  recoverySuccesses: 0,
  nextProbeAt: null,
  missingSince: null,
  missingCount: 0,
  lastMissingAt: null,
  modelNotFoundAt: null,
});
export const readHealth = (
  value?: Partial<HealthState> | null,
): HealthState => ({ ...initialHealth(), ...value });
export function durationMs(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+(\.\d+)?$/.test(value)) return Number(value) * 1000;
  const parts = [...value.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d)/g)];
  if (parts.map((x) => x[0]).join("") !== value || !parts.length) return null;
  return parts.reduce(
    (sum, m) =>
      sum +
      Number(m[1]) *
        ({ ms: 1, s: 1000, m: MINUTE, h: HOUR, d: DAY }[m[2]] ?? 0),
    0,
  );
}
export function retryAt(
  error: ProviderFailure,
  now: number,
  step: number,
): number {
  const explicit = durationMs(error.retryAfter) ?? durationMs(error.retryDelay);
  let due =
    explicit !== null
      ? now + explicit
      : error.retryAfter
        ? Date.parse(error.retryAfter)
        : NaN;
  const resets = [
    error.remainingRequests === "0" ? durationMs(error.resetRequests) : null,
    error.remainingTokens === "0" ? durationMs(error.resetTokens) : null,
  ].filter((x): x is number => x !== null);
  if (resets.length)
    due = Math.max(Number.isFinite(due) ? due : now, now + Math.max(...resets));
  return Number.isFinite(due) && due > now
    ? due
    : now +
        [MINUTE, 5 * MINUTE, 15 * MINUTE, HOUR, 4 * HOUR][Math.min(step, 4)];
}
export function transitionModel(
  previous: HealthState,
  event: Observation,
  providerBlocked = false,
): HealthState {
  const s = { ...previous };
  const now = event.at;
  if (providerBlocked) return s; // A provider outage is not evidence of model retirement.
  if (event.ok) {
    const wasHealthy = s.status === "healthy";
    const spaced =
      event.source === "runtime" ||
      s.lastSuccessAt === null ||
      now - s.lastSuccessAt >= 5 * MINUTE;
    if (!wasHealthy && spaced) s.recoverySuccesses++;
    s.lastSuccessAt = now;
    s.failures = 0;
    s.failureWindowAt = null;
    s.firstFailureAt = null;
    s.failedProbes = 0;
    s.modelNotFoundAt = null;
    if (wasHealthy || s.recoverySuccesses >= 2) {
      s.status = "healthy";
      s.reason = null;
      s.cooldownStep = 0;
      s.nextProbeAt = now + DAY;
      s.recoverySuccesses = 0;
    } else {
      s.status = "probing";
      s.nextProbeAt = now + 5 * MINUTE;
    }
    return s;
  }
  const error = event.error!;
  if (error.modelMissing) {
    s.status = "suspended";
    s.reason = "model_missing";
    s.modelNotFoundAt = now;
    s.nextProbeAt = now + DAY;
    return s;
  }
  if (
    error.scope === "model" &&
    ["quota", "permission"].includes(error.category)
  )
    return {
      ...s,
      status: error.category === "quota" ? "cooldown" : "suspended",
      reason: error.category,
      firstFailureAt: null,
      failedProbes: 0,
      failures: 0,
      failureWindowAt: null,
      nextProbeAt:
        error.category === "quota"
          ? retryAt(error, now, s.cooldownStep)
          : now + 4 * HOUR,
      cooldownStep: Math.min(s.cooldownStep + 1, 4),
    };
  if (!["upstream", "timeout"].includes(error.category)) return s;
  const sameWindow =
    s.failureWindowAt !== null && now - s.failureWindowAt <= 10 * MINUTE;
  s.failures = sameWindow ? s.failures + 1 : 1;
  if (!sameWindow) s.failureWindowAt = now;
  s.lastFailureAt = now;
  s.firstFailureAt ??= now;
  s.recoverySuccesses = 0;
  if (
    event.source === "probe" &&
    (s.lastProbeAt === null || now - s.lastProbeAt >= 5 * MINUTE)
  ) {
    s.failedProbes++;
    s.lastProbeAt = now;
  }
  if (now - s.firstFailureAt >= 2 * DAY && s.failedProbes >= 3) {
    s.status = "suspended";
    s.reason = "persistent_failure";
    s.nextProbeAt = now + DAY;
    return s;
  }
  if (s.status !== "healthy" || s.failures >= 3 || event.source === "probe") {
    if (s.status !== "healthy")
      s.cooldownStep = Math.min(s.cooldownStep + 1, 2);
    s.status = "cooldown";
    s.reason = error.category;
    s.nextProbeAt = now + [15 * MINUTE, HOUR, 4 * HOUR][s.cooldownStep];
  } else s.nextProbeAt = now + 15 * MINUTE;
  return s;
}
export function transitionProvider(
  previous: HealthState,
  event: Observation,
  broadOutage = false,
): HealthState {
  if (event.ok)
    return {
      ...initialHealth(),
      lastSuccessAt: event.at,
      nextProbeAt: event.at + DAY,
    };
  const error = event.error!;
  if (error.scope === "model" && error.category !== "authentication")
    return previous;
  if (["authentication", "permission", "quota"].includes(error.category))
    return {
      ...previous,
      status: error.category === "quota" ? "cooldown" : "blocked",
      reason: error.category,
      firstFailureAt: null,
      failedProbes: 0,
      lastFailureAt: event.at,
      cooldownStep: previous.cooldownStep + 1,
      nextProbeAt:
        error.category === "quota"
          ? retryAt(error, event.at, previous.cooldownStep)
          : event.at + 4 * HOUR,
    };
  if (broadOutage)
    return {
      ...previous,
      status: "cooldown",
      reason: "provider_outage",
      firstFailureAt: null,
      lastFailureAt: event.at,
      nextProbeAt: event.at + 15 * MINUTE,
    };
  return previous;
}
export function observePresence(
  previous: HealthState,
  present: boolean,
  at: number,
): HealthState {
  if (present)
    return {
      ...previous,
      missingSince: null,
      missingCount: 0,
      lastMissingAt: null,
    };
  // Repeated retries of one catalog run must not accelerate the retirement clock.
  if (
    previous.lastMissingAt !== null &&
    at - previous.lastMissingAt < 20 * HOUR
  )
    return previous;
  return {
    ...previous,
    missingSince: previous.missingSince ?? at,
    missingCount: previous.missingCount + 1,
    lastMissingAt: at,
  };
}
export function hasRetirementEvidence(
  state: HealthState,
  now: number,
  providerHealthy: boolean,
): boolean {
  return (
    providerHealthy &&
    state.missingSince !== null &&
    now - state.missingSince >= 2 * DAY &&
    state.missingCount >= 3 &&
    state.modelNotFoundAt !== null &&
    state.modelNotFoundAt >= state.missingSince
  );
}
export function catalogGuard(
  previousCount: number,
  nextCount: number,
): string | null {
  if (nextCount === 0) return "empty_catalog";
  if (previousCount >= 4 && nextCount < previousCount * 0.7)
    return "large_catalog_drop";
  return null;
}
