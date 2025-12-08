import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { jwtCallback } from "@/lib/auth/callbacks/jwt";

describe("jwtCallback (global.fetch mock)", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      AUTH_GOOGLE_ID: "test-client-id",
      AUTH_GOOGLE_SECRET: "test-client-secret",
    };
  });

  afterAll(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  it("만료된 토큰이면 fetch 로 새 토큰을 요청한다", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      access_token: "new-access",
      expires_in: 3600,
      refresh_token: "new-refresh",
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    // Vitest 전용: 전역 fetch stub
    vi.stubGlobal("fetch", mockFetch);

    const expired = Math.floor(Date.now() / 1000) - 10;
    const token = {
      access_token: "old-access",
      refresh_token: "old-refresh",
      expires_at: expired,
    };

    const result = await jwtCallback!({
      token: token,
      user: {},
      account: undefined,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result?.access_token).toBe("new-access");
    expect(result?.refresh_token).toBe("new-refresh");
  });
});
