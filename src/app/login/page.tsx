import { redirect } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DevLoginCardContent } from "@/features/auth/components/dev-login/dev-login-card-content";
import { GoogleLoginForm } from "@/features/auth/components/google-login-form";
import { ENABLE_DEV_LOGIN, auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex grow items-center justify-center">
      <Card className="flex w-120 items-center gap-2">
        <CardTitle>Google로 로그인</CardTitle>
        <CardContent>
          <p className="text-muted-foreground">
            Google 계정으로 로그인할 수 있다.
          </p>
          <GoogleLoginForm />
        </CardContent>
        {ENABLE_DEV_LOGIN && <DevLoginCardContent />}
      </Card>
    </div>
  );
}
