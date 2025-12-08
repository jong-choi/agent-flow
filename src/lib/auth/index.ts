// auth.ts (혹은 현재 NextAuth 설정 파일)
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import { accounts, users } from "@/db/schema";
import { jwtCallback } from "@/lib/auth/callbacks/jwt";
import { signInCallback } from "@/lib/auth/callbacks/sign-in";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      authorization: {
        // refresh_token을 항상 받으려면 access_type: "offline" 필요
        params: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn: signInCallback,
    jwt: jwtCallback,
  },
});
