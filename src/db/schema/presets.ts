import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";
import { workflows } from "@/db/schema/workflows";

export const presets = pgTable("presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  summary: text("summary"),
  category: text("category"),
  price: integer("price").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const presetPurchases = pgTable(
  "preset_purchases",
  {
    presetId: uuid("preset_id")
      .notNull()
      .references(() => presets.id, { onDelete: "cascade" }),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    price: integer("price").notNull(),
    purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  },
  (table) => [
    {
      pk: primaryKey({
        columns: [table.presetId, table.buyerId],
      }),
    },
  ],
);

export type Preset = typeof presets.$inferSelect;
export type PresetInsert = typeof presets.$inferInsert;

export type PresetPurchase = typeof presetPurchases.$inferSelect;
export type PresetPurchaseInsert = typeof presetPurchases.$inferInsert;
