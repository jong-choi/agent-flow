export type SidebarItem = {
  id: string;
  label: string;
  description: string;
};

export type SidebarItemData = Omit<SidebarItem, "id">;
