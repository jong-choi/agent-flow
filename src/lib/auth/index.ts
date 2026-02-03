import { randomBytes } from "crypto";
import NextAuth, { type User } from "next-auth";
import { type Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import { accounts, users } from "@/db/schema";
import { jwtCallback } from "@/lib/auth/callbacks/jwt";
import { getRandomName } from "@/lib/unique-name";

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
            id: "5cf2324c-1bbc-4f9c-b30e-071513cefcee",
            email: "bob@alice.com",
            name: "Bob Tester",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
            displayName: "TestingTester3221",
            avatarHash: "IgV-JD03",
          } satisfies User;
        } else {
          return null;
        }
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
    }),
    async createUser(user) {
      const displayName = getRandomName();
      const avatarHash = randomBytes(6).toString("base64url");
      await db
        .insert(users)
        .values({
          ...user,
          displayName,
          avatarHash,
        })
        .returning();

      return {
        ...user,
        displayName,
        avatarHash,
      };
    },
  },
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
      session.user.displayName = token.displayName ?? null;
      session.user.avatarHash = token.avatarHash ?? null;
      return session;
    },
  },
});
