import { type NodeType } from "@/features/canvas/utils/flow";

export type SidebarItem = {
  id: string;
  label: string;
  description: string;
  type: NodeType;
};

export type SidebarItemData = Omit<SidebarItem, "id" | "type">;
