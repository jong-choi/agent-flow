import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "next-intl/server";
import { GoogleSignInButton } from "@/features/auth/components/ui/google";
import { signInWithGoogleAction } from "@/features/auth/utils/auth-actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

type GoogleLoginFormProps = React.ComponentProps<"form"> & {
  className?: string;
  label?: React.ReactNode;
  searchParams?: PageProps<"/[locale]/login">["searchParams"];
};

export async function GoogleLoginForm({
  className,
  label,
  searchParams,
  ...formProps
}: GoogleLoginFormProps) {
  const t = await getTranslations<AppMessageKeys>("Auth");
  const resolvedSearchParams = searchParams ? await searchParams : null;
  const rawCallbackUrl = resolvedSearchParams?.callbackUrl;
  const callbackUrl = typeof rawCallbackUrl === "string" ? rawCallbackUrl : "";
  const resolvedLabel = label ?? t("login.googleContinue");

  return (
    <form
      action={signInWithGoogleAction}
      className={cn("mt-8", className)}
      {...formProps}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <GoogleSignInButton type="submit" className="w-full">
        {resolvedLabel}
      </GoogleSignInButton>
    </form>
  );
}

export function GoogleLoginFormFallback() {
  return (
    <div className="mt-0 space-y-2">
      <Skeleton className="h-11 w-full rounded-md" />
      <Skeleton className="mx-auto h-3 w-40" />
    </div>
  );
}
