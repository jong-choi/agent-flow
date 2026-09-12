import { expect, it } from "vitest";
import { normalizeProviderError } from "../../error";
import {
  DAY,
  HOUR,
  MINUTE,
  catalogGuard,
  hasRetirementEvidence,
  initialHealth,
  observePresence,
  retryAt,
  transitionModel,
  transitionProvider,
} from "../policy";

it("treats Groq oversized output reservations as invalid requests without a provider ban", () => {
  const error = normalizeProviderError({
    status: 429,
    error: {
      error: {
        code: "rate_limit_exceeded",
        message:
          "Request too large for model `example` on output tokens per minute (OTPM). The request's expected output tokens exceed the enforced limit.",
      },
    },
  });
  expect(error).toMatchObject({
    category: "invalid_request",
    code: "rate_limit_exceeded",
    modelMissing: false,
  });
  expect(
    transitionProvider(initialHealth(), {
      ok: false,
      source: "runtime",
      at: 1000,
      error,
    }).status,
  ).toBe("healthy");
});

const failure = (
  at: number,
  source: "runtime" | "probe" = "runtime",
  status = 503,
) => ({ ok: false, at, source, error: normalizeProviderError({ status }) });
it("opens on repeated runtime failures, backs off, and suspends only with 48h evidence", () => {
  let s = initialHealth();
  s = transitionModel(s, failure(0));
  expect(s.status).toBe("healthy");
  s = transitionModel(s, failure(MINUTE));
  s = transitionModel(s, failure(2 * MINUTE));
  expect(s.status).toBe("cooldown");
  expect(s.nextProbeAt).toBe(17 * MINUTE);
  s = transitionModel(s, failure(17 * MINUTE, "probe"));
  expect(s.nextProbeAt).toBe(17 * MINUTE + HOUR);
  s = transitionModel(s, failure(17 * MINUTE + HOUR, "probe"));
  expect(s.nextProbeAt).toBe(17 * MINUTE + 5 * HOUR);
  s = transitionModel(s, failure(2 * DAY, "probe"));
  expect(s.status).toBe("suspended");
  expect(hasRetirementEvidence(s, 2 * DAY, true)).toBe(false);
});
it("never treats quota, auth, invalid input, cancellation or lack of traffic as model retirement", () => {
  for (const error of [
    { status: 429 },
    { status: 401 },
    { status: 403 },
    { status: 400 },
    { name: "AbortError" },
    {},
  ]) {
    let s = initialHealth();
    for (let n = 0; n < 5; n++)
      s = transitionModel(s, {
        ok: false,
        source: "probe",
        at: n * DAY,
        error: normalizeProviderError(error),
      });
    expect(s.status).toBe("healthy");
    expect(s.failedProbes).toBe(0);
  }
  expect(initialHealth().status).toBe("healthy");
});
it("requires two recovery successes, spacing probes, and stops the failure clock during provider outage", () => {
  let s = transitionModel(initialHealth(), failure(0, "probe"));
  s = transitionModel(s, { ok: true, source: "probe", at: HOUR });
  expect(s.status).toBe("probing");
  s = transitionModel(s, { ok: true, source: "probe", at: HOUR + 5 * MINUTE });
  expect(s.status).toBe("healthy");
  expect(s.firstFailureAt).toBeNull();
  const before = transitionModel(initialHealth(), failure(0, "probe"));
  expect(transitionModel(before, failure(3 * DAY, "probe"), true)).toEqual(
    before,
  );
});
it("uses quota reset metadata, not an arbitrary four hour ban", () => {
  const error = normalizeProviderError({
    status: 429,
    headers: {
      "retry-after": "30",
      "x-ratelimit-remaining-requests": "0",
      "x-ratelimit-reset-requests": "2h",
    },
  });
  expect(retryAt(error, 100, 0)).toBe(100 + 2 * HOUR);
  expect(
    transitionProvider(initialHealth(), {
      ok: false,
      source: "runtime",
      at: 100,
      error,
    }).reason,
  ).toBe("quota");
});
it("requires valid repeated missing catalogs plus model-specific failure and healthy provider", () => {
  let s = observePresence(initialHealth(), false, 0);
  s = observePresence(s, false, MINUTE);
  expect(s.missingCount).toBe(1);
  s = observePresence(s, false, DAY);
  s = observePresence(s, false, 2 * DAY);
  expect(hasRetirementEvidence(s, 2 * DAY, true)).toBe(false);
  s = transitionModel(s, {
    ok: false,
    source: "probe",
    at: 2 * DAY,
    error: normalizeProviderError({
      status: 404,
      message: "model example not found",
    }),
  });
  expect(hasRetirementEvidence(s, 2 * DAY, true)).toBe(true);
  expect(hasRetirementEvidence(s, 2 * DAY, false)).toBe(false);
  expect(
    hasRetirementEvidence(observePresence(s, true, 2 * DAY), 2 * DAY, true),
  ).toBe(false);
  expect(
    normalizeProviderError({ status: 404, message: "endpoint missing" })
      .modelMissing,
  ).toBe(false);
  expect(catalogGuard(20, 0)).toBe("empty_catalog");
  expect(catalogGuard(20, 10)).toBe("large_catalog_drop");
});
it("isolates explicitly model-scoped quota without banning the whole provider", () => {
  const error = normalizeProviderError({
    status: 429,
    message: "Rate limit reached for model example",
    headers: { "retry-after": "30" },
  });
  expect(error.scope).toBe("model");
  const event = { ok: false, source: "runtime" as const, at: 100, error };
  expect(transitionProvider(initialHealth(), event).status).toBe("healthy");
  const model = transitionModel(initialHealth(), event);
  expect(model.status).toBe("cooldown");
  expect(model.nextProbeAt).toBe(30100);
  expect(model.firstFailureAt).toBeNull();
});
it("does not count failures spanning more than ten minutes as one failure window", () => {
  let state = initialHealth();
  for (const at of [0, 9 * MINUTE, 18 * MINUTE])
    state = transitionModel(state, failure(at));
  expect(state.status).toBe("healthy");
});
