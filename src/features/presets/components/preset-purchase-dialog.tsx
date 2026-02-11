"use client";

import {
  type ComponentProps,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
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
import { getCreditBalanceAction } from "@/features/credits/server/actions";
import {
  type PresetPurchaseResult,
  purchasePresetAction,
} from "@/features/presets/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

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

const isLoginRequiredMessage = (message: string) =>
  message.includes("사용자 정보가 없습니다");

const resolveActionLabel = (
  t: ReturnType<typeof useTranslations<AppMessageKeys>>,
  price: number,
  isOwned: boolean,
) => {
  if (isOwned) {
    return t("purchaseDialog.owned");
  }

  return price === 0 ? t("purchaseDialog.freeGet") : t("purchaseDialog.buy");
};

const resolveVariant = (
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

const resolveSuccessMessage = (
  t: ReturnType<typeof useTranslations<AppMessageKeys>>,
  result: PresetPurchaseResult,
) => {
  if (result.status === "already_purchased") {
    return t("purchaseDialog.successAlreadyOwned");
  }

  return result.totalPrice === 0
    ? t("purchaseDialog.successFree")
    : t("purchaseDialog.successPaid");
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
  const t = useTranslations<AppMessageKeys>("Presets");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const label = resolveActionLabel(t, totalPrice, isOwned);
  const resolvedVariant = resolveVariant(isOwned, variant);

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
        const current = await getCreditBalanceAction();
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
            : t("purchaseDialog.loadCreditFailed");
        setBalanceError(
          isLoginRequiredMessage(message)
            ? t("purchaseDialog.loginRequired")
            : t("purchaseDialog.loadCreditFailed"),
        );
      } finally {
        if (isActive) {
          setIsLoadingBalance(false);
        }
      }
    };

    void fetchBalance();

    return () => {
      isActive = false;
    };
  }, [open, isOwned, t]);

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
          toast.success(resolveSuccessMessage(t, result));
          setOpen(false);
          router.refresh();
          return;
        }

        if (result.status === "insufficient_credit") {
          toast.error(t("purchaseDialog.insufficientCredit"));
          return;
        }

        if (result.status === "owned") {
          toast.error(t("purchaseDialog.cannotBuyOwn"));
          return;
        }

        if (result.status === "not_available") {
          toast.error(t("purchaseDialog.notAvailable"));
          return;
        }

        toast.error(t("purchaseDialog.purchaseFailed"));
      } catch (error) {
        console.error("프리셋 구매 중 오류:", error);
        const message = error instanceof Error ? error.message : "";
        toast.error(
          isLoginRequiredMessage(message)
            ? t("purchaseDialog.loginRequired")
            : t("purchaseDialog.purchaseFailed"),
        );
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
          <DialogTitle>{t("purchaseDialog.title")}</DialogTitle>
          <DialogDescription>{t("purchaseDialog.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t("purchaseDialog.currentBalance")}
            </span>
            <span className="font-medium">
              {isLoadingBalance
                ? t("purchaseDialog.loadingBalance")
                : balanceError
                  ? "-"
                  : balance == null
                    ? "-"
                    : t("common.priceCredits", { count: balance })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t("purchaseDialog.presetPrice")}
            </span>
            <span className="font-medium">
              {t("common.priceCredits", { count: totalPrice })}
            </span>
          </div>
          {referencedPresetPrice > 0 ? (
            <div className="space-y-1 pl-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{t("purchaseDialog.priceBreakdownCurrentPreset")}</span>
                <span className="font-medium text-foreground">
                  {t("common.priceCredits", { count: currentPresetPrice })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("purchaseDialog.priceBreakdownReferencedPreset")}</span>
                <span className="font-medium text-foreground">
                  {t("common.priceCredits", { count: referencedPresetPrice })}
                </span>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t("purchaseDialog.afterPurchase")}
            </span>
            <span className="font-medium">
              {isLoadingBalance
                ? t("purchaseDialog.loadingBalance")
                : balanceError
                  ? "-"
                  : nextBalance == null
                    ? "-"
                    : t("common.priceCredits", { count: nextBalance })}
            </span>
          </div>
          {balanceError ? (
            <p className="text-xs text-destructive">{balanceError}</p>
          ) : null}
          {isInsufficient ? (
            <p className="text-xs text-destructive">
              {t("purchaseDialog.insufficientBalanceMessage")}
            </p>
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("purchaseDialog.cancel")}
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
            {t("purchaseDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
