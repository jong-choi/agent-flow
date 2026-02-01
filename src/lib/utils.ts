import { type ClassValue, clsx } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYMDT(str: string) {
  return dayjs(str).format("YYYY-MM-DD HH:mm:ss");
}

export function formatYMD(str: string) {
  return dayjs(str).format("YYYY.MM.DD");
}

export function formatHHMM(str: string) {
  return dayjs(str).format("HH:mm");
}

export function formatKoreanDate(
  value: Date | string | null | undefined,
  fallback = "-",
) {
  if (!value) {
    return fallback;
  }

  const parsed = dayjs(value);

  if (!parsed.isValid()) {
    return fallback;
  }

  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
    parsed.toDate(),
  );
}
