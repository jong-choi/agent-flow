import NextAuth, { type User } from "next-auth";
import { type Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import { accounts, users } from "@/db/schema";
import { jwtCallback } from "@/lib/auth/callbacks/jwt";

export const ENABLE_DEV_LOGIN =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";

export const TEST_PASSWORD = process.env.TEST_PASSWORD!;

const providers: Provider[] = [
  Google({
    authorization: {
      params: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  }),
];

if (ENABLE_DEV_LOGIN) {
  providers.push(
    Credentials({
      id: "password",
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) => {
        if (credentials.password === TEST_PASSWORD) {
          return {
            email: "bob@alice.com",
            name: "Bob Alice",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
          } satisfies User;
        } else {
          return null;
        }
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  session: {
    strategy: "jwt",
  },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: jwtCallback,
    session: ({ session, token }) => {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
