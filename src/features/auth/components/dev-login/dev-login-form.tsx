import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { devPasswordSignIn } from "@/features/auth/utils/auth-actions";

export function DevLoginForm() {
  return (
    <form
      action={devPasswordSignIn}
      className="flex w-full flex-col items-center gap-3"
    >
      <Input
        id="dev-password"
        name="password"
        autoComplete="off"
        type="password"
        placeholder="password"
        className="w-full text-center"
      />
      <Button type="submit" className="w-full">
        Dev password로 로그인
      </Button>
    </form>
  );
}
