import { type AuthCallbacks } from "@/lib/auth/types/next-auth";

export const jwtCallback: AuthCallbacks["jwt"] = async ({
  token,
  account,
  user,
  trigger,
  session,
}) => {
  // 최초 로그인 : Google에서 제공하는 정보를 반환
  if (account) {
    return {
      ...token,
      access_token: account.access_token,
      expires_at: account.expires_at,
      refresh_token: account.refresh_token,
      displayName: user?.displayName ?? token.displayName ?? null,
      avatarHash: user?.avatarHash ?? token.avatarHash ?? null,
    };
  }

  if (trigger === "update") {
    return {
      ...token,
      displayName: session?.user?.displayName ?? token.displayName ?? null,
      avatarHash: session?.user?.avatarHash ?? token.avatarHash ?? null,
    };
  }

  // 리프레시 토큰이 없으면 에러 발생
  if (!token.refresh_token) {
    token.error = "RefreshTokenError";
    return token;
  }

  if (token.expires_at && Date.now() < token.expires_at * 1000) {
    return token;
  }

  try {
    // 리프레시 토큰이 만료되었으면 재발급
    // https://accounts.google.com/.well-known/openid-configuration
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refresh_token as string,
      }),
    });

    const tokensOrError = await response.json();

    if (!response.ok) {
      // 응답이 200대가 아니면 에러로 간주
      throw tokensOrError;
    }

    const newTokens = tokensOrError as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    // 토큰 기간 연장
    const expiresAt = Math.floor(Date.now() / 1000 + newTokens.expires_in);

    // 경우에 따라 새 토큰번호 없이 기한만 연장되는 프로바이더도 있음
    const refreshToken = newTokens.refresh_token ?? token.refresh_token;

    return {
      ...token,
      access_token: newTokens.access_token,
      expires_at: expiresAt,
      refresh_token: refreshToken,
    };
  } catch (error) {
    // 토큰 재발급 실패 에러
    console.error("Error refreshing access_token", error);
    token.error = "RefreshTokenError";
    return token;
  }
};
