import {
  Circle,
  FileText,
  GitFork,
  GitMerge,
  MessageSquare,
  Play,
  Search,
  Square,
  Terminal,
} from "lucide-react";

export const Icons = {
  Circle,
  MessageSquare,
  Search,
  FileText,
  GitMerge,
  GitFork,
  Play,
  Square,
  Terminal,
} as const;

export type IconName = keyof typeof Icons;

export function isIconName(value: string): value is IconName {
  return value in Icons;
}
