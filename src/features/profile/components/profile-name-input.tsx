import { useCallback } from "react";
import { type Session } from "next-auth";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const DISPLAY_NAME_MAX_LEN = 30;

export function ProfileNameInput({
  initialDisplayName,
  session,
  setNameMessage,
  setValidName,
  setChecking,
  checkDisplayNameTakenAction,
}: {
  initialDisplayName: string;
  session: Session | null;
  setNameMessage: (value: string) => void;
  setValidName: (value: boolean) => void;
  setChecking: (value: boolean) => void;
  checkDisplayNameTakenAction: (
    displayName: string,
    excludeUserId?: string,
  ) => Promise<boolean>;
}) {
  const t = useTranslations<AppMessageKeys>("Profile");
  const trimmedInitialDisplayName = initialDisplayName?.trim() ?? "";

  const checkDisplayName = useCallback(
    async (value: string) => {
      if (!value) {
        setNameMessage(t("validation.displayNameRequired"));
        setValidName(false);
        setChecking(false);
        return;
      }
      if (value.length > DISPLAY_NAME_MAX_LEN) {
        setNameMessage(
          t("validation.displayNameTooLong", { max: DISPLAY_NAME_MAX_LEN }),
        );
        setValidName(false);
        setChecking(false);
        return;
      }
      if (value === trimmedInitialDisplayName) {
        setNameMessage("");
        setValidName(true);
        setChecking(false);
        return;
      }
      const isTaken = await checkDisplayNameTakenAction(value, session?.user?.id);
      if (isTaken) {
        setValidName(false);
        setNameMessage(t("validation.displayNameTaken"));
      } else {
        setValidName(true);
        setNameMessage(t("validation.displayNameAvailable"));
      }
      setChecking(false);
    },
    [
      session?.user?.id,
      checkDisplayNameTakenAction,
      setChecking,

      setNameMessage,
      setValidName,
      t,
      trimmedInitialDisplayName,
    ],
  );
  const debouncedCheck = useDebounce(checkDisplayName, 1000);
  return (
    <Input
      id="displayName"
      name="displayName"
      maxLength={DISPLAY_NAME_MAX_LEN}
      defaultValue={initialDisplayName}
      onChange={(event) => {
        if (event.target.value.length > DISPLAY_NAME_MAX_LEN) {
          event.preventDefault();
        }
        const value = event.target.value;
        const trimmedValue = value.trim();
        setChecking(true);
        debouncedCheck(trimmedValue);
      }}
      placeholder={t("form.displayNamePlaceholder")}
      autoComplete="nickname"
      required
    />
  );
}
