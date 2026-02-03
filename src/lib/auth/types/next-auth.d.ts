// next-auth.d.ts
import "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      displayName?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    displayName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    expires_at?: number; // epoch seconds
    refresh_token?: string;
    error?: "RefreshTokenError";
    displayName?: string | null;
  }
}

export type AuthCallbacks = NonNullable<NextAuthConfig["callbacks"]>;
