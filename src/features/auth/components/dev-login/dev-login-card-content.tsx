import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DevLoginForm } from "@/features/auth/components/dev-login/dev-login-form";

export function DevLoginCardContent() {
  return (
    <CardContent className="flex w-full flex-col items-center gap-2">
      <Separator className="my-4" />
      <p className="text-muted-foreground">개발 / 테스트용 로그인</p>
      <DevLoginForm />
    </CardContent>
  );
}
