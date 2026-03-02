import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, numeric, jsonb, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
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

export const marketIndexes = pgTable("market_indexes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(),
  date: timestamp("date").notNull(),
  closePrice: numeric("close_price").notNull(),
  openPrice: numeric("open_price"),
  highPrice: numeric("high_price"),
  lowPrice: numeric("low_price"),
  volume: numeric("volume"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  symbols: text("symbols").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const manualHoldings = pgTable("manual_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: varchar("symbol").notNull(),
  name: varchar("name").notNull(),
  quantity: numeric("quantity").notNull(),
  purchasePrice: numeric("purchase_price").notNull(),
  purchaseDate: timestamp("purchase_date"),
  totalValue: numeric("total_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const soldHoldings = pgTable("sold_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  manualHoldingId: varchar("manual_holding_id"),
  symbol: varchar("symbol").notNull(),
  sharesSold: numeric("shares_sold").notNull(),
  sellPrice: numeric("sell_price").notNull(),
  sellValue: numeric("sell_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManualHoldingSchema = createInsertSchema(manualHoldings).omit({
  id: true,
  userId: true,
  createdAt: true,
  totalValue: true,
  purchaseDate: true,
}).extend({
  purchaseDate: z.string().optional(),
});

export const sellHoldingSchema = z.object({
  sharesSold: z.number().positive("Must sell at least 1 share"),
  sellPrice: z.number().positive("Sell price must be positive"),
});

export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type InsertLinkedAccount = typeof linkedAccounts.$inferInsert;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = typeof holdings.$inferInsert;
export type PortfolioHistoryEntry = typeof portfolioHistory.$inferSelect;
export type MarketIndex = typeof marketIndexes.$inferSelect;
export type InsertMarketIndex = typeof marketIndexes.$inferInsert;
export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type ManualHolding = typeof manualHoldings.$inferSelect;
export type InsertManualHolding = z.infer<typeof insertManualHoldingSchema>;
export type SoldHolding = typeof soldHoldings.$inferSelect;
export type SellHoldingData = z.infer<typeof sellHoldingSchema>;
