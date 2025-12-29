import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const sidebarNodes = pgTable("sidebar_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  content: jsonb("content").$type<{
    type: "select" | "dialog";
    label: string;
    placeholder?: string;
    options?: string[];
    value?: string;
    dialogTitle?: string;
    dialogDescription?: string;
  }>(),
  handle: jsonb("handle").$type<{
    target?: { count: number };
    source?: { count: number };
  }>(),
});

export type SidebarNode = typeof sidebarNodes.$inferSelect;
export type SidebarNodeInsert = typeof sidebarNodes.$inferInsert;
export type SidebarNodeData = Omit<SidebarNode, "id" | "type">;
