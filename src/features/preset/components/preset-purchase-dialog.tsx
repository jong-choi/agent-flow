"use client";

import {
  type ComponentProps,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getCreditBalance } from "@/db/query/credit";
import {
  type PresetPurchaseResult,
  purchasePresetAction,
} from "@/db/query/presets";

const formatCredit = (value: number) => `${value.toLocaleString()} 크레딧`;

type PresetPurchaseDialogProps = {
  presetId: string;
  totalPrice: number;
  currentPresetPrice: number;
  referencedPresetPrice: number;
  isOwned?: boolean;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
};

const resolveActionLabel = (price: number, isOwned: boolean) => {
  if (isOwned) {
    return "이미 보유함";
  }

  return price === 0 ? "무료로 받기" : "구매하기";
};

const resolveVariant = (
  price: number,
  isOwned: boolean,
  variant?: PresetPurchaseDialogProps["variant"],
) => {
  if (variant) {
    return variant;
  }

  if (isOwned) {
    return "secondary";
  }

  return "default";
};

const resolveSuccessMessage = (result: PresetPurchaseResult) => {
  if (result.status === "already_purchased") {
    return "이미 보유한 프리셋입니다.";
  }

  return result.totalPrice === 0
    ? "무료로 받았습니다."
    : "구매가 완료되었습니다.";
};

export function PresetPurchaseDialog({
  presetId,
  totalPrice,
  currentPresetPrice,
  referencedPresetPrice,
  isOwned = false,
  className,
  size,
  variant,
}: PresetPurchaseDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const label = resolveActionLabel(totalPrice, isOwned);
  const resolvedVariant = resolveVariant(totalPrice, isOwned, variant);

  const nextBalance = useMemo(() => {
    if (balance == null) {
      return null;
    }

    return balance - totalPrice;
  }, [balance, totalPrice]);

  const isInsufficient =
    balance != null && totalPrice > 0 && balance < totalPrice;

  useEffect(() => {
    if (!open || isOwned) {
      return;
    }

    let isActive = true;

    const fetchBalance = async () => {
      try {
        setIsLoadingBalance(true);
        setBalanceError(null);
        const current = await getCreditBalance();
        if (isActive) {
          setBalance(current);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "크레딧 정보를 불러오지 못했습니다.";
        setBalanceError(
          message.includes("사용자 정보가 없습니다")
            ? "로그인이 필요합니다."
            : message,
        );
      } finally {
        if (isActive) {
          setIsLoadingBalance(false);
        }
      }
    };

    fetchBalance();

    return () => {
      isActive = false;
    };
  }, [open, isOwned]);

  const handlePurchase = () => {
    if (isOwned || isPending || isInsufficient || balanceError) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await purchasePresetAction(presetId);

        if (
          result.status === "success" ||
          result.status === "already_purchased"
        ) {
          toast.success(resolveSuccessMessage(result));
          setOpen(false);
          router.refresh();
          return;
        }

        if (result.status === "insufficient_credit") {
          toast.error("크레딧이 부족합니다.");
          return;
        }

        if (result.status === "owned") {
          toast.error("내 프리셋은 구매할 수 없습니다.");
          return;
        }

        if (result.status === "not_available") {
          toast.error("구매할 수 없는 프리셋입니다.");
          return;
        }

        toast.error("구매에 실패했습니다.");
      } catch (error) {
        console.error("프리셋 구매 중 오류:", error);
        const message =
          error instanceof Error ? error.message : "구매에 실패했습니다.";
        const normalizedMessage = message.includes("사용자 정보가 없습니다")
          ? "로그인이 필요합니다."
          : message;
        toast.error(normalizedMessage);
      }
    });
  };

  if (isOwned) {
    return (
      <Button
        type="button"
        size={size}
        variant={resolvedVariant}
        className={className}
        disabled
      >
        {label}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size={size}
          variant={resolvedVariant}
          className={className}
          disabled={isPending}
        >
          {isPending ? <Spinner className="size-4" /> : null}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent ariaDescribedby="preset purchase dialog">
        <DialogHeader>
          <DialogTitle>프리셋 구매</DialogTitle>
          <DialogDescription>
            구매 전 크레딧 잔액을 확인하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">현재 보유 크레딧</span>
            <span className="font-medium">
              {isLoadingBalance
                ? "불러오는 중..."
                : balanceError
                  ? "-"
                  : balance == null
                    ? "-"
                    : formatCredit(balance)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">프리셋 가격</span>
            <span className="font-medium">{formatCredit(totalPrice)}</span>
          </div>
          {referencedPresetPrice > 0 ? (
            <div className="space-y-1 pl-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>현재 프리셋</span>
                <span className="font-medium text-foreground">
                  {formatCredit(currentPresetPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>참조된 프리셋</span>
                <span className="font-medium text-foreground">
                  {formatCredit(referencedPresetPrice)}
                </span>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">구매 후 크레딧</span>
            <span className="font-medium">
              {isLoadingBalance
                ? "불러오는 중..."
                : balanceError
                  ? "-"
                  : nextBalance == null
                    ? "-"
                    : formatCredit(nextBalance)}
            </span>
          </div>
          {balanceError ? (
            <p className="text-xs text-destructive">{balanceError}</p>
          ) : null}
          {isInsufficient ? (
            <p className="text-xs text-destructive">
              크레딧이 부족하여 구매할 수 없습니다.
            </p>
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              취소
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handlePurchase}
            disabled={
              isPending ||
              isLoadingBalance ||
              Boolean(balanceError) ||
              isInsufficient
            }
          >
            {isPending ? <Spinner className="size-4" /> : null}
            구매
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
