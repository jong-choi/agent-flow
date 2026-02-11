"use client";

import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function PresetCreateSubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel?: string;
}) {
  const t = useTranslations<AppMessageKeys>("Presets");
  const { pending } = useFormStatus();
  const resolvedPendingLabel = pendingLabel ?? t("forms.createSubmitPending");

  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? (
        <>
          <Spinner className="size-4" />
          {resolvedPendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
