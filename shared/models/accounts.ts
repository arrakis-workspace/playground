import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, numeric, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const linkedAccounts = pgTable("linked_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  institutionName: varchar("institution_name").notNull(),
  accountId: varchar("account_id"),
  accountName: varchar("account_name"),
  accountType: varchar("account_type"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  linkedAccountId: varchar("linked_account_id").notNull().references(() => linkedAccounts.id),
  symbol: varchar("symbol").notNull(),
  name: varchar("name").notNull(),
  quantity: numeric("quantity").notNull(),
  currentPrice: numeric("current_price").notNull(),
  totalValue: numeric("total_value").notNull(),
  costBasis: numeric("cost_basis"),
  currency: varchar("currency").default("USD"),
  securityType: varchar("security_type"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const portfolioHistory = pgTable("portfolio_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  totalValue: numeric("total_value").notNull(),
});

export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type InsertLinkedAccount = typeof linkedAccounts.$inferInsert;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = typeof holdings.$inferInsert;
export type PortfolioHistoryEntry = typeof portfolioHistory.$inferSelect;
