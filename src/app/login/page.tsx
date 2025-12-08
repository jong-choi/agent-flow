"use client";

import { signIn, signOut } from "next-auth/react";
import { GoogleSignInButton } from "@/features/auth/components/ui/google";

export default function LoginPage() {
  return (
    <div>
      <GoogleSignInButton onClick={() => signIn("google")} />
      <button onClick={() => signOut({ callbackUrl: "/" })}>로그아웃</button>
    </div>
  );
}
