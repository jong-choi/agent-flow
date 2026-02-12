"use client";

import { useState, useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BoringUserAvatar } from "@/components/boring-avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProfileNameInput } from "@/features/profile/components/profile-name-input";
import {
  type UpdateUserErrorCode,
  updateUserAction,
} from "@/features/profile/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type ProfileFormProps = {
  initialDisplayName: string | null;
  initialAvatarHash: string | null;
  email?: string | null;
  checkDisplayNameTakenAction: (
    displayName: string,
    excludeUserId?: string,
  ) => Promise<boolean>;
};

export function ProfileForm({
  initialDisplayName,
  initialAvatarHash,
  email,
  checkDisplayNameTakenAction,
}: ProfileFormProps) {
  const t = useTranslations<AppMessageKeys>("Profile");
  const { data: session, update } = useSession();

  const [avatarHash, setAvatarHash] = useState(initialAvatarHash ?? "default");
  const [clicked, setClicked] = useState(false);

  const [nameMessage, setNameMessage] = useState("");
  const [validName, setValidName] = useState(true);
  const [checking, setChecking] = useState(false);

  const [isPending, startTransition] = useTransition();

  const hasChanged = avatarHash !== initialAvatarHash || nameMessage;
  const canSubmit = hasChanged && validName && !checking && !isPending;

  const getErrorMessage = (code?: UpdateUserErrorCode) => {
    if (!code) return t("toast.updateFailed");

    switch (code) {
      case "display_name_required":
        return t("errors.displayNameRequired");
      case "display_name_taken":
        return t("errors.displayNameTaken");
      case "avatar_invalid":
        return t("errors.avatarInvalid");
      case "update_failed":
        return t("errors.updateFailed");
      default:
        return t("toast.updateFailed");
    }
  };

  const handleAvatarClick = () => {
    setClicked(true);
    setAvatarHash(nanoid(8));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitProfile = async () => {
      try {
        const result = await updateUserAction(formData);

        if (!result?.ok) {
          toast.error(getErrorMessage(result.code));
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
        toast.success(t("toast.updateSuccess"));
        setNameMessage("");
      } catch (error) {
        console.error(error);
        toast.error(t("toast.updateFailed"));
      }
    };

    startTransition(() => {
      void submitProfile();
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
              {t("form.newAvatar")}
            </div>
          )}
          <div className="absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-sm dark:bg-white/70 dark:text-black">
            <RefreshCcw className="size-3.5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{email ?? t("form.noEmail")}</p>
          <p className="text-xs text-muted-foreground">
            {t("form.avatarHelp")}
          </p>
        </div>
      </div>
      <input type="hidden" name="avatarHash" value={avatarHash} />
      <div className="grid gap-2">
        <label htmlFor="displayName" className="text-sm font-medium">
          {t("form.displayNameLabel")}
        </label>
        <ProfileNameInput
          session={session}
          initialDisplayName={initialDisplayName || ""}
          setNameMessage={setNameMessage}
          setValidName={setValidName}
          setChecking={setChecking}
          checkDisplayNameTakenAction={checkDisplayNameTakenAction}
        />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? t("form.saving") : t("form.save")}
        </Button>
        <div className="text-sm text-muted-foreground">
          {checking ? <Spinner /> : nameMessage}
        </div>
      </div>
    </form>
  );
}
