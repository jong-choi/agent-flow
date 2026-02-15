"use client";

import { type CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import canvasEnDark from "@/assets/canvas-en-dark.png";
import canvasEnLight from "@/assets/canvas-en-light.png";
import canvasKoDark from "@/assets/canvas-ko-dark.png";
import canvasKoLight from "@/assets/canvas-ko-light.png";
import chatsEnDark from "@/assets/chats-en-dark.png";
import chatsEnLight from "@/assets/chats-en-light.png";
import chatsKoDark from "@/assets/chats-ko-dark.png";
import chatsKoLight from "@/assets/chats-ko-light.png";
import presetsEnDark from "@/assets/presets-en-dark.png";
import presetsEnLight from "@/assets/presets-en-light.png";
import presetsKoDark from "@/assets/presets-ko-dark.png";
import presetsKoLight from "@/assets/presets-ko-light.png";
import { cn } from "@/lib/utils";

type ShowcaseVariant = "canvas" | "chats" | "presets";
type ShowcaseLocale = "en" | "ko";
type ShowcaseTheme = "light" | "dark";
type ShowcaseThemeMode = ShowcaseTheme | "auto" | "inverse";
type FadeDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
type FadeMode = FadeDirection | "none";

type ShowcaseImageSet = {
  light: StaticImageData;
  dark: StaticImageData;
  alt: string;
};

function scaleImageSizes(sizes: string, multiplier: number) {
  if (multiplier <= 1) {
    return sizes;
  }

  return sizes
    .split(",")
    .map((entry) => {
      const trimmedEntry = entry.trim();
      const match = trimmedEntry.match(
        /^(.*\)\s*)?(\d*\.?\d+)(vw|px)$/i,
      );

      if (!match) {
        return trimmedEntry;
      }

      const [, media = "", value, unit] = match;
      const nextValue = Number.parseFloat(value) * multiplier;
      return `${media}${nextValue}${unit}`;
    })
    .join(", ");
}

const showcaseImages: Record<
  ShowcaseVariant,
  Record<ShowcaseLocale, ShowcaseImageSet>
> = {
  canvas: {
    en: {
      light: canvasEnLight,
      dark: canvasEnDark,
      alt: "Canvas editor preview",
    },
    ko: {
      light: canvasKoLight,
      dark: canvasKoDark,
      alt: "캔버스 에디터 미리보기",
    },
  },
  chats: {
    en: {
      light: chatsEnLight,
      dark: chatsEnDark,
      alt: "Chat workspace preview",
    },
    ko: {
      light: chatsKoLight,
      dark: chatsKoDark,
      alt: "채팅 워크스페이스 미리보기",
    },
  },
  presets: {
    en: {
      light: presetsEnLight,
      dark: presetsEnDark,
      alt: "Preset market preview",
    },
    ko: {
      light: presetsKoLight,
      dark: presetsKoDark,
      alt: "프리셋 마켓 미리보기",
    },
  },
};

const fadeMasks: Record<FadeDirection, string> = {
  left: "linear-gradient(to right, transparent 0%, black 22%, black 100%)",
  right: "linear-gradient(to left, transparent 0%, black 22%, black 100%)",
  top: "linear-gradient(to bottom, transparent 0%, black 24%, black 100%)",
  bottom: "linear-gradient(to top, transparent 0%, black 24%, black 100%)",
  "top-left":
    "linear-gradient(to bottom right, transparent 0%, black 32%, black 100%)",
  "top-right":
    "linear-gradient(to bottom left, transparent 0%, black 32%, black 100%)",
  "bottom-left":
    "linear-gradient(to top right, transparent 0%, black 32%, black 100%)",
  "bottom-right":
    "linear-gradient(to top left, transparent 0%, black 32%, black 100%)",
};

export type LandingShowcaseImageProps = {
  variant: ShowcaseVariant;
  locale?: ShowcaseLocale;
  theme?: ShowcaseThemeMode;
  fadeDirection?: FadeMode;
  resolutionMultiplier?: number;
  objectPosition?: CSSProperties["objectPosition"];
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  className?: string;
  imageClassName?: string;
};

export function LandingShowcaseImage({
  variant,
  locale = "ko",
  theme = "auto",
  fadeDirection,
  resolutionMultiplier = 1,
  objectPosition = "center top",
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  alt,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  quality,
  className,
  imageClassName,
}: LandingShowcaseImageProps) {
  const imageSet = showcaseImages[variant][locale];
  const resolvedFadeDirection: FadeMode = fadeDirection ?? "none";
  const maskImage =
    resolvedFadeDirection === "none"
      ? undefined
      : fadeMasks[resolvedFadeDirection];
  const sharedStyle: CSSProperties = {
    objectPosition,
    transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`,
    WebkitMaskImage: maskImage,
    maskImage,
    WebkitMaskRepeat: maskImage ? "no-repeat" : undefined,
    maskRepeat: maskImage ? "no-repeat" : undefined,
    WebkitMaskSize: maskImage ? "100% 100%" : undefined,
    maskSize: maskImage ? "100% 100%" : undefined,
  };
  const sharedClassName = cn(
    "object-cover will-change-transform",
    imageClassName,
  );
  const resolvedAlt = alt ?? imageSet.alt;
  const resolvedSizes = scaleImageSizes(sizes, resolutionMultiplier);
  const renderImage = (resolvedTheme: ShowcaseTheme, themeClassName = "") => (
    <Image
      key={resolvedTheme}
      src={imageSet[resolvedTheme]}
      alt={resolvedAlt}
      fill
      priority={priority}
      sizes={resolvedSizes}
      quality={quality}
      className={cn(sharedClassName, themeClassName)}
      style={sharedStyle}
      draggable={false}
    />
  );

  return (
    <div
      className={cn(
        "relative isolate h-[22rem] w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/20",
        className,
      )}
    >
      {theme === "light" && renderImage("light")}
      {theme === "dark" && renderImage("dark")}
      {theme === "auto" && (
        <>
          {renderImage("light", "dark:hidden")}
          {renderImage("dark", "hidden dark:block")}
        </>
      )}
      {theme === "inverse" && (
        <>
          {renderImage("dark", "dark:hidden")}
          {renderImage("light", "hidden dark:block")}
        </>
      )}
    </div>
  );
}
