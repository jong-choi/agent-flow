import { type NodeType } from "@/features/canvas/constants/flow";

type HandleDataType = { count: number };

type NodeSelectContent = {
  type: "select";
  label: string;
  placeholder: string;
  options: string[];
  value?: string;
};

type NodePromptContent = {
  type: "dialog";
  label: string;
  value?: string;
  dialogTitle?: string;
  dialogDescription?: string;
};

export type SidebarItem = {
  id: string;
  label: string;
  description: string;
  type: NodeType;
  content?: NodeSelectContent | NodePromptContent;
  handle?: {
    target?: HandleDataType;
    source?: HandleDataType;
  };
};

export type SidebarItemData = Omit<SidebarItem, "id" | "type">;
