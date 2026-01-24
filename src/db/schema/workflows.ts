import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";
import { sidebarNodeType } from "@/db/schema/sidebar-nodes";

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("source").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const workflowNodes = pgTable("workflow_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  type: sidebarNodeType("type").notNull(),
  posX: integer("pos_x").notNull(),
  posY: integer("pos_y").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  value: text("value"),
  targetCount: integer("target_count"),
  sourceCount: integer("source_count"),
});

export const workflowEdges = pgTable("workflow_edges", {
  id: text("id").primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  target: text("target").notNull(),
  sourceHandle: text("sourceHandle").notNull(),
  targetHandle: text("targetHandle").notNull(),
});
