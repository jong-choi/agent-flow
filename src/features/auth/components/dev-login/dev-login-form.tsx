import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEST_PASSWORD, signIn } from "@/lib/auth";

const DEV_SIGNIN_ERROR_URL = "/login?error=dev-password";

export function DevLoginForm() {
  async function devPasswordSignIn(formData: FormData) {
    "use server";

    try {
      await signIn(TEST_PASSWORD, formData);
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect(`${DEV_SIGNIN_ERROR_URL}&code=${error.type}`);
      }
      throw error;
    }
  }

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
