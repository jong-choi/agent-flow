export const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};
