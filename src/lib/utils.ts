import { type ClassValue, clsx } from "clsx";
import dayjs, { type ConfigType } from "dayjs";
import { twMerge } from "tailwind-merge";

export const SHORT_TEXT_MAX_LENGTH = 140;
export const SHORT_TEXT_MAX_LENGTH_WITH_IME_BUFFER =
  SHORT_TEXT_MAX_LENGTH + 5;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYMD(value: ConfigType, fallback = "-") {
  const day = dayjs(value);
  if (!value || !day.isValid()) {
    return fallback;
  }
  return day.format("YYYY.MM.DD");
}

function formatYMDT(value: ConfigType, fallback = "-") {
  const day = dayjs(value);
  if (!value || !day.isValid()) {
    return fallback;
  }
  return day.format("YYYY-MM-DD HH:mm:ss");
}

function formatHMS(value: ConfigType, fallback = "-") {
  const day = dayjs(value);
  if (!value || !day.isValid()) {
    return fallback;
  }
  return day.format("HH:mm:ss");
}

export function formatTimeToday(value: ConfigType, fallback = "-") {
  const day = dayjs(value);
  if (!value || !day.isValid()) {
    return fallback;
  }

  const isToday = day.isSame(dayjs(), "day");
  return isToday ? formatHMS(value, fallback) : formatYMDT(value, fallback);
}

export function sanitizeString(v: string) {
  return v.replace(/[^\p{L}\p{N} :()\[\]{}_^_\-]+/gu, "?").trim();
}
