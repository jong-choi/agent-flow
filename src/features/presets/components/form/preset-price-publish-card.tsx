"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const normalizeCreditInput = (value: string) => {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round(parsed));
};

export type PresetPricePublishCardProps = {
  description: string;
  priceDefault?: number;
  referencedPresetPrice: number;
  publishLabel: string;
  publishHint: string;
  isPublishedDefault?: boolean;
};

export function PresetPricePublishCard({
  description,
  priceDefault = 0,
  referencedPresetPrice,
  publishLabel,
  publishHint,
  isPublishedDefault = false,
}: PresetPricePublishCardProps) {
  const [priceInput, setPriceInput] = useState(String(priceDefault));

  const currentPresetPrice = useMemo(
    () => normalizeCreditInput(priceInput),
    [priceInput],
  );
  const referencedPrice = Math.max(0, referencedPresetPrice);
  const totalPrice = currentPresetPrice + referencedPrice;

  return (
    <Card>
      <CardHeader>
        <CardTitle>가격 및 공개 설정</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="price" className="text-sm font-medium">
            가격 (크레딧)
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
          />
        </div>

        <div className="space-y-2 rounded-lg border bg-accent/30 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">예상 프리셋 가격</span>
            <span className="font-semibold">{totalPrice} 크레딧</span>
          </div>
          <div className="space-y-1 pl-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">현재 프리셋</span>
              <span className="font-medium">{currentPresetPrice} 크레딧</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">참조된 프리셋</span>
              <span className="font-medium">{referencedPrice} 크레딧</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            defaultChecked={isPublishedDefault}
            className="mt-1 size-4 rounded border border-input"
          />
          <div className="space-y-1">
            <label htmlFor="isPublished" className="text-sm font-medium">
              {publishLabel}
            </label>
            <p className="text-xs text-muted-foreground">{publishHint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
