// next-auth.d.ts
import "next-auth";
import type { NextAuthConfig } from "next-auth";
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    expires_at?: number; // epoch seconds
    refresh_token?: string;
    error?: "RefreshTokenError";
  }
}

type AuthCallbacks = NonNullable<NextAuthConfig["callbacks"]>;
