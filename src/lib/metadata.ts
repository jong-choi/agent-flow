import { type Locale } from "@/lib/i18n/routing";

export type LocalizedTitleMap = Record<Locale, string>;

export const resolveMetadataLocale = (requestedLocale: string): Locale =>
  requestedLocale === "ko" ? "ko" : "en";

export const resolveMetadataTitle = ({
  title,
  locale,
  localizedFallbacks,
}: {
  title: string | null | undefined;
  locale: Locale;
  localizedFallbacks: LocalizedTitleMap;
}) => {
  const normalizedTitle = title?.trim();
  return normalizedTitle || localizedFallbacks[locale];
};

export const withMetadataSuffix = (title: string, suffix: string) =>
  `${title} | ${suffix.toUpperCase()}`;
