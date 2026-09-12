"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlowNodeData } from "@/db/types/sidebar-nodes";
import type { AppMessageKeys } from "@/lib/i18n/messages";

type ModelOption = NonNullable<
  NonNullable<FlowNodeData["content"]>["options"]
>[number];
export function ModelSelect({
  value,
  options = [],
  onChange,
  placeholder,
  onReplaceAll,
}: {
  value?: string | null;
  options?: ModelOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  onReplaceAll?: (target: string) => void;
}) {
  const t = useTranslations<AppMessageKeys>("Workflows");
  const [replacement, setReplacement] = useState("");
  const selected = options.find(
    (option) =>
      option.id === value ||
      option.value === value ||
      option.legacyValue === value,
  );
  const selectedValue = selected?.value ?? value ?? undefined;
  const choices = options.filter(
    (option) => option.selectable || option.id === selected?.id,
  );
  const status = !selected
    ? t("modelRegistry.unknown")
    : selected.lifecycle === "retired"
      ? t("modelRegistry.retired")
      : selected.lifecycle === "candidate"
        ? t("modelRegistry.candidate")
        : !selected.selectable
          ? t("modelRegistry.unavailable")
          : selected.lifecycle === "deprecated"
            ? t("modelRegistry.deprecated")
            : t("modelRegistry.active");
  const target = options.find(
    (o) =>
      o.value === (replacement || selected?.replacementModelId) &&
      o.selectable &&
      o.value !== selectedValue,
  );
  return (
    <div className="min-w-0 space-y-2" data-testid="model-selector">
      <Select value={selectedValue} onValueChange={onChange}>
        <SelectTrigger
          className="w-full"
          aria-label={t("modelRegistry.choose")}
        >
          <SelectValue placeholder={placeholder ?? t("modelRegistry.choose")}>
            {selected
              ? `${selected.label ?? selected.upstreamModelId} · ${selected.provider}`
              : value || undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {value && !selected ? (
            <SelectItem value={value} disabled>
              {value} · {t("modelRegistry.unknown")}
            </SelectItem>
          ) : null}
          {choices.map((option) => (
            <SelectItem
              key={option.id}
              value={option.value}
              disabled={!option.selectable}
            >
              {option.label ?? option.upstreamModelId} · {option.provider} ·{" "}
              {option.price === null || option.price === undefined
                ? t("modelRegistry.priceUnknown")
                : t("modelRegistry.credits", { count: option.price })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value ? (
        <div
          className="space-y-1 rounded-md border p-2 text-xs"
          data-testid="model-card"
        >
          <div className="font-medium">{status}</div>
          {selected?.retirementReason ? (
            <p>{selected.retirementReason}</p>
          ) : null}
          {selected?.nextProbeAt ? (
            <p>
              {t("modelRegistry.retryAt", {
                time:
                  new Date(selected.nextProbeAt)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 16) + " UTC",
              })}
            </p>
          ) : null}
          {selected?.availabilityReason === "free_access_unverified" ? (
            <p>{t("modelRegistry.freeVerificationRequired")}</p>
          ) : null}
          {!selected?.selectable && onReplaceAll ? (
            <div className="space-y-2" data-testid="model-replacement">
              <Select value={target?.value} onValueChange={setReplacement}>
                <SelectTrigger
                  aria-label={t("modelRegistry.chooseReplacement")}
                >
                  <SelectValue
                    placeholder={t("modelRegistry.chooseReplacement")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {options
                    .filter((o) => o.selectable && o.value !== selectedValue)
                    .map((o) => (
                      <SelectItem key={o.id} value={o.value}>
                        {o.label ?? o.value} · {o.provider} · {o.price}{" "}
                        {t("modelRegistry.creditUnit")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={!target}
                onClick={() => target && onReplaceAll(target.value)}
              >
                {t("modelRegistry.replaceAll")}
              </Button>
            </div>
          ) : null}

          {selected?.thinkingLevel ? (
            <div>
              {t("modelRegistry.thinking", {
                level: t(
                  `modelRegistry.thinkingLevels.${selected.thinkingLevel}`,
                ),
              })}
            </div>
          ) : null}
          {selected?.description ? (
            <p className="text-muted-foreground">{selected.description}</p>
          ) : null}
          <div>
            {selected?.price == null
              ? t("modelRegistry.priceUnknown")
              : t("modelRegistry.credits", { count: selected.price })}
          </div>
          {selected?.inputLimit != null && selected.outputLimit != null ? (
            <div className="text-muted-foreground">
              {t("modelRegistry.appLimits", {
                input: selected.inputLimit.toLocaleString(),
                output: selected.outputLimit.toLocaleString(),
              })}
            </div>
          ) : null}
          {selected?.contextWindow != null ? (
            <div className="text-muted-foreground">
              {t("modelRegistry.providerContext", {
                count: selected.contextWindow.toLocaleString(),
              })}
            </div>
          ) : null}
          {selected && (
            <div className="break-all text-muted-foreground">
              {selected.upstreamModelId}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
