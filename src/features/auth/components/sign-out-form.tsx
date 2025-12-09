import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export function SignOutForm() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit">로그아웃</Button>
    </form>
  );
}
