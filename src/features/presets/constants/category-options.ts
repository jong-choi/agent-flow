const categories = [
  { key: "sales", value: "영업" },
  { key: "customerSupport", value: "고객지원" },
  { key: "marketing", value: "마케팅" },
  { key: "data", value: "데이터" },
  { key: "operations", value: "운영" },
  { key: "development", value: "개발" },
] as const;

export const categoryOptions = [{ key: "none", value: "" }, ...categories] as const;

export const categoryFilters = [{ key: "all", value: "all" }, ...categories] as const;

export type PresetCategoryValue = (typeof categories)[number]["value"];
export type PresetCategoryTranslationKey = (typeof categories)[number]["key"];

export function resolvePresetCategoryKey(
  value: string | null | undefined,
): PresetCategoryTranslationKey | null {
  switch (value) {
    case "영업":
      return "sales";
    case "고객지원":
      return "customerSupport";
    case "마케팅":
      return "marketing";
    case "데이터":
      return "data";
    case "운영":
      return "operations";
    case "개발":
      return "development";
    default:
      return null;
  }
}
