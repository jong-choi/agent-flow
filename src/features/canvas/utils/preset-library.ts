export const filterPresetLibrary = <
  T extends { title: string; workflowId: string },
>(
  presets: T[],
  {
    query,
    excludeWorkflowId,
  }: {
    query: string;
    excludeWorkflowId?: string;
  },
): T[] => {
  const trimmed = query.trim().toLowerCase();

  return presets
    .filter((preset) =>
      excludeWorkflowId ? preset.workflowId !== excludeWorkflowId : true,
    )
    .filter((preset) =>
      trimmed ? preset.title.toLowerCase().includes(trimmed) : true,
    );
};
