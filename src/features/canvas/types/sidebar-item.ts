import { type NodeType } from "@/features/canvas/constants/flow";

export type SidebarItem = {
  id: string;
  label: string;
  description: string;
  type: NodeType;
  content?: NodeSelectContent;
  handle?: {
    target?: HandleDataType;
    source?: HandleDataType;
  };
};

type HandleDataType = { count: number };

type NodeSelectContent = {
  type: "select";
  label: string;
  placeholder: string;
  options: string[];
};

export type SidebarItemData = Omit<SidebarItem, "id" | "type">;
