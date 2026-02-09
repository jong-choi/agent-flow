import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nodeTypes } from "@/features/canvas/constants/node-types";

export const sidebarContentType = pgEnum("sidebar_content_type", [
  "select",
  "dialog",
]);

export const sidebarNodeType = pgEnum("sidebar_node_type", nodeTypes);

export const sidebarSelectSource = pgEnum("sidebar_options_source", [
  "ai_models",
]);

export const sidebarNodes = pgTable("sidebar_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull().unique(),
  description: text("description").notNull(),
  type: sidebarNodeType("type").notNull(),
  icon: text("icon").notNull().default("circle"),
  backgroundColor: text("background_color").notNull().default("bg-neutral-800"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sidebarNodeInformation = pgTable("sidebar_node_information", {
  id: uuid("id").defaultRandom().primaryKey(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => sidebarNodes.id, { onDelete: "cascade" })
    .unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  guides: text("guides").array().notNull(),
});

export const sidebarNodeContents = pgTable("sidebar_node_contents", {
  id: uuid("id").defaultRandom().primaryKey(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => sidebarNodes.id, { onDelete: "cascade" })
    .unique(),
  type: sidebarContentType("type").notNull(),
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  value: text("value"),
  optionsSource: sidebarSelectSource("options_source"),
  dialogTitle: text("dialog_title"),
  dialogDescription: text("dialog_description"),
});

export const sidebarNodeHandles = pgTable("sidebar_node_handles", {
  id: uuid("id").defaultRandom().primaryKey(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => sidebarNodes.id, { onDelete: "cascade" })
    .unique(),
  targetCount: integer("target_count"),
  sourceCount: integer("source_count"),
});

export type SidebarNode = typeof sidebarNodes.$inferSelect;
export type SidebarNodeInsert = typeof sidebarNodes.$inferInsert;

export type SidebarNodeInformation = typeof sidebarNodeInformation.$inferSelect;
export type SidebarNodeInformationInsert =
  typeof sidebarNodeInformation.$inferInsert;

export type SidebarNodeContent = typeof sidebarNodeContents.$inferSelect;
export type SidebarNodeContentInsert = typeof sidebarNodeContents.$inferInsert;

export type SidebarNodeHandle = typeof sidebarNodeHandles.$inferSelect;
export type SidebarNodeHandleInsert = typeof sidebarNodeHandles.$inferInsert;

const sidebarNodesSelectSchema = createSelectSchema(sidebarNodes);
const sidebarNodeInformationSelectSchema = createSelectSchema(
  sidebarNodeInformation,
);
const sidebarNodeContentsSelectSchema = createSelectSchema(
  sidebarNodeContents,
).extend({
  options: z
    .array(
      z.object({
        id: z.string(),
        value: z.string(),
        price: z.number().int().nonnegative().optional(),
      }),
    )
    .optional(),
  referenceId: z.string().nullable().optional(),
});
const sidebarNodeHandlesSelectSchema = createSelectSchema(sidebarNodeHandles);

export const sidebarNodesQuerySchema = sidebarNodesSelectSchema
  .pick({
    id: true,
    label: true,
    description: true,
    type: true,
    icon: true,
    backgroundColor: true,
    order: true,
    createdAt: true,
  })
  .extend({
    content: sidebarNodeContentsSelectSchema.nullable(),
    handle: sidebarNodeHandlesSelectSchema.nullable(),
    information: sidebarNodeInformationSelectSchema.nullable(),
  });
