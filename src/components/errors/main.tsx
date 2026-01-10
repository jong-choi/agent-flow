import Link from "next/link";
import { type FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

export function MainErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const { message } = error;
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center"
      role="alert"
    >
      {message ? (
        <>
          <h2 className="text-lg font-semibold">에러가 발생하였습니다.</h2>
          <div className="text-sm text-muted-foreground">{message}</div>
        </>
      ) : (
        <h2 className="text-lg font-semibold">
          알 수 없는 에러가 발생하였습니다.
        </h2>
      )}
      <div className="flex gap-4">
        <Button variant="default" className="mt-4" onClick={resetErrorBoundary}>
          재시도
        </Button>
        <Link href={"/"}>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={resetErrorBoundary}
          >
            Home 화면으로 이동
          </Button>
        </Link>
      </div>
    </div>
  );
}
