const categories = [
  { label: "영업", value: "영업" },
  { label: "고객지원", value: "고객지원" },
  { label: "마케팅", value: "마케팅" },
  { label: "데이터", value: "데이터" },
  { label: "운영", value: "운영" },
  { label: "개발", value: "개발" },
];

export const categoryOptions = [
  { label: "선택 안함", value: "" },
  ...categories,
];

export const categoryFilters = [{ label: "전체", value: "all" }, ...categories];
