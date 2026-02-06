export type QueryParams = Record<string, string | undefined>;
export type QueryDefaults = Record<string, string>;

const shouldOmitParam = (
  key: string,
  value: string | undefined,
  defaults?: QueryDefaults,
) => {
  if (!value) return true;
  if (key === "page" && value === "1") return true;
  if (key === "q" && value.trim() === "") return true;
  if (defaults && defaults[key] === value) return true;
  return false;
};

export const buildQueryString = (
  base: QueryParams,
  overrides: QueryParams,
  defaults?: QueryDefaults,
) => {
  const params = new URLSearchParams();
  const next = { ...base, ...overrides };

  Object.entries(next).forEach(([key, value]) => {
    if (shouldOmitParam(key, value, defaults)) return;
    params.set(key, value ?? "");
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};
