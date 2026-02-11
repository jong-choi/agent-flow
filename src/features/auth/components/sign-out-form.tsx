"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function SignOutForm({ children }: { children?: React.ReactNode }) {
  const t = useTranslations<AppMessageKeys>("Auth");
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
          {t("menu.logout")}
        </Button>
      )}
    </form>
  );
}
