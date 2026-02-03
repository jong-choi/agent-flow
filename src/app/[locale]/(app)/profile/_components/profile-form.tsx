"use client";

import { useState, useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { BoringUserAvatar } from "@/components/boring-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserAction } from "@/db/query/auth";

type ProfileFormProps = {
  initialDisplayName: string | null;
  initialAvatarHash: string | null;
  email?: string | null;
};

const createAvatarHash = () => {
  if (typeof window === "undefined") {
    return "default";
  }

  if (typeof window.crypto?.getRandomValues !== "function") {
    return Math.random().toString(36).slice(2, 10);
  }

  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return base64 || "default";
};

export function ProfileForm({
  initialDisplayName,
  initialAvatarHash,
  email,
}: ProfileFormProps) {
  const { update } = useSession();
  const [clicked, setClicked] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [avatarHash, setAvatarHash] = useState(initialAvatarHash ?? "default");

  const [isPending, startTransition] = useTransition();

  const handleAvatarClick = () => {
    setClicked(true);
    setAvatarHash(createAvatarHash());
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      (async () => {
        try {
          const result = await updateUserAction(formData);

          if (!result?.ok) {
            toast.error(result.error || "닉네임 변경 중 오류가 발생했습니다.");
            return;
          }

          const nextDisplayName = result.data?.displayName ?? "";
          const nextAvatarHash = result.data?.avatarHash ?? avatarHash;
          setDisplayName(nextDisplayName);
          setAvatarHash(nextAvatarHash);
          await update({
            user: {
              displayName: nextDisplayName || null,
              avatarHash: nextAvatarHash || null,
            },
          });
          toast.success("닉네임이 변경되었습니다.");
        } catch (error) {
          console.error(error);
          toast.error("닉네임 변경 중 오류가 발생했습니다.");
        }
      })();
    });
  };

  const isInvalid = displayName.trim().length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 select-none">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="group relative size-16 cursor-pointer rounded-full"
          onClick={handleAvatarClick}
        >
          <div className="overflow-hidden rounded-full">
            <BoringUserAvatar seed={avatarHash} size={64} className="size-16" />
          </div>
          {!clicked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/35 text-xs font-medium text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100 dark:bg-white/25 dark:text-black">
              새 아바타
            </div>
          )}
          <div className="absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-sm dark:bg-white/70 dark:text-black">
            <RefreshCcw className="size-3.5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{email ?? "이메일 정보 없음"}</p>
          <p className="text-xs text-muted-foreground">
            아바타를 클릭하여 새로운 아바타를 만들 수 있습니다
          </p>
        </div>
      </div>
      <input type="hidden" name="avatarHash" value={avatarHash} />
      <div className="grid gap-2">
        <label htmlFor="displayName" className="text-sm font-medium">
          닉네임
        </label>
        <Input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="닉네임을 입력하세요"
          autoComplete="nickname"
          required
        />
      </div>
      <Button type="submit" disabled={isPending || isInvalid}>
        {isPending ? "저장 중..." : "변경 저장"}
      </Button>
    </form>
  );
}
