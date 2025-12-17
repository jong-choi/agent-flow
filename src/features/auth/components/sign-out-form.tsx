import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/utils/auth-actions";

export function SignOutForm({ children }: { children?: React.ReactNode }) {
  return (
    <form action={signOutAction} className="w-full">
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
