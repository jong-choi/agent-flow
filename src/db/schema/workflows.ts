import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";
import { sidebarNodeType } from "@/db/schema/sidebar-nodes";

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
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
  nodeId: text("node_id").notNull(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: sidebarNodeType("type").notNull(),
  posX: integer("pos_x").notNull(),
  posY: integer("pos_y").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  value: text("value"),
  contentReferenceId: text("content_reference_id"),
  targetCount: integer("target_count"),
  sourceCount: integer("source_count"),
});

export const workflowEdges = pgTable("workflow_edges", {
  id: text("id").primaryKey(),
  edgeId: text("edge_id").notNull(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  target: text("target").notNull(),
  sourceHandle: text("sourceHandle").notNull(),
  targetHandle: text("targetHandle").notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type WorkflowInsert = typeof workflows.$inferInsert;

export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type WorkflowNodeInsert = typeof workflowNodes.$inferInsert;

export type WorkflowEdge = typeof workflowEdges.$inferSelect;
export type WorkflowEdgeInsert = typeof workflowEdges.$inferInsert;
