import { GoogleSignInButton } from "@/features/auth/components/ui/google";
import { continueWithGoogle } from "@/features/auth/utils/google-login-actions";
import { cn } from "@/lib/utils";

type GoogleLoginFormProps = React.ComponentProps<"form"> & {
  className?: string;
  label?: React.ReactNode;
};

export function GoogleLoginForm({
  className,
  label = "Google 계정으로 계속",
  ...formProps
}: GoogleLoginFormProps) {
  return (
    <form
      action={continueWithGoogle}
      className={cn("mt-8", className)}
      {...formProps}
    >
      <GoogleSignInButton type="submit" className="w-full">
        {label}
      </GoogleSignInButton>
    </form>
  );
}
