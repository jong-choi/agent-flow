import { GoogleSignInButton } from "@/features/auth/components/ui/google";
import { signInWithGoogleAction } from "@/features/auth/utils/auth-actions";
import { cn } from "@/lib/utils";

type GoogleLoginFormProps = React.ComponentProps<"form"> & {
  locale: string;
  className?: string;
  label?: React.ReactNode;
  searchParams?: PageProps<"/[locale]/login">["searchParams"];
};

export async function GoogleLoginForm({
  className,
  label = "Continue with Google",
  searchParams,
  ...formProps
}: GoogleLoginFormProps) {
  const resolvedSearchParams = searchParams ? await searchParams : null;
  const rawCallbackUrl = resolvedSearchParams?.callbackUrl;
  const callbackUrl = typeof rawCallbackUrl === "string" ? rawCallbackUrl : "";

  return (
    <form
      action={signInWithGoogleAction}
      className={cn("mt-8", className)}
      {...formProps}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <GoogleSignInButton type="submit" className="w-full">
        {label}
      </GoogleSignInButton>
    </form>
  );
}

export function GoogleLoginFormFallback({
  label = "Continue with Google",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("mt-8", className)}>
      <GoogleSignInButton type="submit" className="w-full">
        {label}
      </GoogleSignInButton>
    </div>
  );
}
