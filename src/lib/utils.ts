import { type ClassValue, clsx } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYMDT(str: string) {
  return dayjs(str).format("YYYY-MM-DD HH:mm:ss");
}

export function formatHHMM(str: string) {
  return dayjs(str).format("HH:mm");
}
