import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  date,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";

export const creditTransactionTypes = ["earn", "spend"] as const;
export const creditTransactionCategories = [
  "attendance",
  "workflow",
  "preset_sale",
  "preset_purchase",
  "manual_adjustment",
] as const;

export const creditTransactionType = pgEnum(
  "credit_transaction_type",
  creditTransactionTypes,
);

export const creditTransactionCategory = pgEnum(
  "credit_transaction_category",
  creditTransactionCategories,
);

export const creditAccounts = pgTable("credit_accounts", {
  userId: text("user_id")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: creditTransactionType("type").notNull(),
  category: creditTransactionCategory("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
});

export const creditDailyEvents = pgTable(
  "credit_daily_events",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    reward: integer("reward").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    {
      pk: primaryKey({
        columns: [table.userId, table.eventDate],
      }),
    },
  ],
);

export type CreditAccount = typeof creditAccounts.$inferSelect;
export type CreditAccountInsert = typeof creditAccounts.$inferInsert;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type CreditTransactionInsert = typeof creditTransactions.$inferInsert;

export type CreditDailyEvent = typeof creditDailyEvents.$inferSelect;
export type CreditDailyEventInsert = typeof creditDailyEvents.$inferInsert;
