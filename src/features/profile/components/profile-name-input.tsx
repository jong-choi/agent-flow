import { useCallback } from "react";
import { type Session } from "next-auth";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

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
  const trimmedInitialDisplayName = initialDisplayName?.trim() ?? "";

  const checkDisplayName = useCallback(
    async (value: string) => {
      if (!value) {
        setNameMessage("닉네임을 입력해주세요.");
        setValidName(false);
        setChecking(false);
        return;
      }
      if (value.length > DISPLAY_NAME_MAX_LEN) {
        setNameMessage(`닉네임은 ${DISPLAY_NAME_MAX_LEN}자 이내여야합니다.`);
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
        setNameMessage("중복된 닉네임입니다.");
      } else {
        setValidName(true);
        setNameMessage("사용 가능한 닉네임입니다.");
      }
      setChecking(false);
    },
    [
      session?.user?.id,
      checkDisplayNameTakenAction,
      setChecking,

      setNameMessage,
      setValidName,
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
      placeholder="닉네임을 입력하세요"
      autoComplete="nickname"
      required
    />
  );
}
