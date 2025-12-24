import { type Account } from "next-auth";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { jwtCallback } from "@/lib/auth/callbacks/jwt";

describe("JWT Callback", () => {
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
    process.env = originalEnv;
    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  it("최초 로그인은 account 값으로 토큰을 구성한다", async () => {
    const token = {};

    const account = {
      access_token: "google-access",
      refresh_token: "google-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    } as Account;

    const result = await jwtCallback!({
      token,
      user: {},
      account,
    });

    expect(result?.access_token).toBe("google-access");
    expect(result?.refresh_token).toBe("google-refresh");
    expect(result?.expires_at).toBe(account.expires_at);
  });

  it("refresh_token 이 없으면 RefreshTokenError 를 설정하고 fetch 를 호출하지 않는다", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const token = {
      access_token: "only-access",
      expires_at: Math.floor(Date.now() / 1000) - 10,
    };

    const result = await jwtCallback!({
      token,
      user: {},
      account: undefined,
    });

    expect(result?.error).toBe("RefreshTokenError");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("만료 시간이 지나지 않은 토큰이면 fetch 를 호출하지 않고 그대로 반환한다", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const notExpired = Math.floor(Date.now() / 1000) + 60;
    const token = {
      access_token: "old-access",
      refresh_token: "old-refresh",
      expires_at: notExpired,
    };

    const result = await jwtCallback!({
      token,
      user: {},
      account: undefined,
    });

    expect(mockFetch).not.toHaveBeenCalled();
    // 그대로 반환하는지까지 체크
    expect(result).toBe(token);
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
      token,
      user: {},
      account: undefined,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      }),
    );

    const body = mockFetch.mock.calls[0][1].body as URLSearchParams;

    expect(body.get("client_id")).toBe("test-client-id");
    expect(body.get("client_secret")).toBe("test-client-secret");
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("old-refresh");

    expect(result?.access_token).toBe("new-access");
    expect(result?.refresh_token).toBe("new-refresh");
    expect(result?.expires_at).toBeGreaterThan(expired);
  });

  it("토큰 재발급 응답에 새 refresh_token 이 없으면 기존 refresh_token 을 유지한다", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      access_token: "new-access",
      expires_in: 100,
      // refresh_token 없음
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    vi.stubGlobal("fetch", mockFetch);

    const expired = Math.floor(Date.now() / 1000) - 10;
    const token = {
      access_token: "old-access",
      refresh_token: "old-refresh",
      expires_at: expired,
    };

    const result = await jwtCallback!({
      token,
      user: {},
      account: undefined,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result?.access_token).toBe("new-access");
    // 새 refresh_token 이 없으니 기존 값 유지
    expect(result?.refresh_token).toBe("old-refresh");
  });

  it("Google 토큰 엔드포인트가 에러를 응답하면 RefreshTokenError 를 설정한다", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      error: "invalid_grant",
      error_description: "Some error from Google",
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: mockJson,
    });

    vi.stubGlobal("fetch", mockFetch);

    const expired = Math.floor(Date.now() / 1000) - 10;
    const token = {
      access_token: "old-access",
      refresh_token: "old-refresh",
      expires_at: expired,
    };

    const result = await jwtCallback!({
      token,
      user: {},
      account: undefined,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    // 기존 토큰은 그대로 두고
    expect(result?.access_token).toBe("old-access");
    expect(result?.refresh_token).toBe("old-refresh");
    // 에러 플래그만 세팅
    expect(result?.error).toBe("RefreshTokenError");
  });

  it("expires_at 이 없으면 만료된 것으로 간주하고 리프레시를 시도한다", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      access_token: "new-access",
      expires_in: 3600,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    vi.stubGlobal("fetch", mockFetch);

    const token = {
      access_token: "old-access",
      refresh_token: "old-refresh",
      // expires_at 없음
    };

    const result = await jwtCallback!({
      token,
      user: {},
      account: undefined,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result?.access_token).toBe("new-access");
    expect(result?.refresh_token).toBe("old-refresh");
    expect(result?.expires_at).toBeDefined();
  });
});
