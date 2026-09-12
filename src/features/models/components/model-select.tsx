"use client";
import { useTranslations } from "next-intl";
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
}: {
  value?: string | null;
  options?: ModelOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const t = useTranslations<AppMessageKeys>("Workflows");
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
  return (
    <div className="min-w-0 space-y-2" data-testid="model-selector">
      <Select value={selectedValue} onValueChange={onChange}>
        <SelectTrigger className="w-full">
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
