"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutForm({ children }: { children?: React.ReactNode }) {
  // 클라이언트 호출로 즉시 상태 반영
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await signOut({ redirectTo: "/" });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {children ? (
        <button
          type="submit"
          className="w-full"
          data-testid="user-signout-button"
        >
          {children}
        </button>
      ) : (
        <Button type="submit" data-testid="user-signout-button">
          로그아웃
        </Button>
      )}
    </form>
  );
}
