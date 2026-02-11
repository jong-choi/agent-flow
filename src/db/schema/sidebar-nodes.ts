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
  type: sidebarNodeType("type").notNull().unique(),
  icon: text("icon").notNull().default("circle"),
  backgroundColor: text("background_color").notNull().default("bg-neutral-800"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sidebarNodeContents = pgTable("sidebar_node_contents", {
  id: uuid("id").defaultRandom().primaryKey(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => sidebarNodes.id, { onDelete: "cascade" })
    .unique(),
  type: sidebarContentType("type").notNull(),
  value: text("value"),
  optionsSource: sidebarSelectSource("options_source"),
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

export type SidebarNodeContent = typeof sidebarNodeContents.$inferSelect;
export type SidebarNodeContentInsert = typeof sidebarNodeContents.$inferInsert;

export type SidebarNodeHandle = typeof sidebarNodeHandles.$inferSelect;
export type SidebarNodeHandleInsert = typeof sidebarNodeHandles.$inferInsert;

const sidebarNodesSelectSchema = createSelectSchema(sidebarNodes);
const sidebarNodeContentsBaseSelectSchema = createSelectSchema(sidebarNodeContents);
const sidebarNodeContentsSelectSchema = sidebarNodeContentsBaseSelectSchema.extend({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  dialogTitle: z.string().optional(),
  dialogDescription: z.string().optional(),
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

export const sidebarNodeInformationQuerySchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  guides: z.array(z.string()),
});

export const sidebarNodesRawQuerySchema = sidebarNodesSelectSchema
  .pick({
    id: true,
    type: true,
    icon: true,
    backgroundColor: true,
    order: true,
    createdAt: true,
  })
  .extend({
    content: sidebarNodeContentsBaseSelectSchema.nullable(),
    handle: sidebarNodeHandlesSelectSchema.nullable(),
  });

export const sidebarNodesQuerySchema = sidebarNodesRawQuerySchema.extend({
  label: z.string(),
  description: z.string(),
  content: sidebarNodeContentsSelectSchema.nullable(),
  information: sidebarNodeInformationQuerySchema.nullable(),
});
