"use client";

import { useState, useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ProfileNameInput } from "@/app/[locale]/(app)/profile/_components/profile-name-input";
import { BoringUserAvatar } from "@/components/boring-avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { updateUserAction } from "@/db/query/auth";

type ProfileFormProps = {
  initialDisplayName: string | null;
  initialAvatarHash: string | null;
  email?: string | null;
};

export function ProfileForm({
  initialDisplayName,
  initialAvatarHash,
  email,
}: ProfileFormProps) {
  const { data: session, update } = useSession();

  const [avatarHash, setAvatarHash] = useState(initialAvatarHash ?? "default");
  const [clicked, setClicked] = useState(false);

  const [nameMessage, setNameMessage] = useState("");
  const [validName, setValidName] = useState(true);
  const [checking, setChecking] = useState(false);

  const [isPending, startTransition] = useTransition();

  const hasChanged = avatarHash !== initialAvatarHash || nameMessage;
  const canSubmit = hasChanged && validName && !checking && !isPending;

  const handleAvatarClick = () => {
    setClicked(true);
    setAvatarHash(nanoid(8));
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

          await update({
            user: {
              displayName: nextDisplayName || null,
              avatarHash: nextAvatarHash || null,
            },
          });
          toast.success("닉네임이 변경되었습니다.");
          setNameMessage("");
        } catch (error) {
          console.error(error);
          toast.error("닉네임 변경 중 오류가 발생했습니다.");
        }
      })();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 select-none">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="group relative size-16 cursor-pointer rounded-full"
          onClick={handleAvatarClick}
          data-testid="profile-avatar-trigger"
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
        <ProfileNameInput
          session={session}
          initialDisplayName={initialDisplayName || ""}
          setNameMessage={setNameMessage}
          setValidName={setValidName}
          setChecking={setChecking}
        />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? "저장 중..." : "변경 저장"}
        </Button>
        <div className="text-sm text-muted-foreground">
          {checking ? <Spinner /> : nameMessage}
        </div>
      </div>
    </form>
  );
}
