import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  text,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  username: varchar("username").unique(), // Casino display name chosen by user
  profileImageUrl: varchar("profile_image_url"),
  provider: varchar("provider").default('google'),
  googleId: varchar("google_id").unique(),
  discordId: varchar("discord_id").unique(),
  isUsernameSet: boolean("is_username_set").default(false), // Track if user has chosen username
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User balance and earnings tracking
export const userBalances = pgTable("user_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalBalance: decimal("total_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  earnedBalance: decimal("earned_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  bonusBalance: decimal("bonus_balance", { precision: 12, scale: 2 }).notNull().default('5.00'), // 5 SX joining bonus
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game types enum
export const gameTypeEnum = pgEnum('game_type', ['coin_flip', 'dice_roll', 'roulette']);

// Transaction types enum
export const transactionTypeEnum = pgEnum('transaction_type', ['bet', 'win', 'loss', 'withdrawal', 'bonus']);

// Transactions table for tracking all balance changes
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum("type").notNull(),
  gameType: gameTypeEnum("game_type"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  gameData: jsonb("game_data"), // Store game-specific data like chosen side, result, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawal requests
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").notNull().default('pending'), // pending, approved, rejected
  discordMessageId: varchar("discord_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  balance: one(userBalances, {
    fields: [users.id],
    references: [userBalances.userId],
  }),
  transactions: many(transactions),
  chatMessages: many(chatMessages),
  withdrawalRequests: many(withdrawalRequests),
}));

export const userBalancesRelations = relations(userBalances, ({ one }) => ({
  user: one(users, {
    fields: [userBalances.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserBalanceSchema = createInsertSchema(userBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserBalance = typeof userBalances.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertUserBalance = z.infer<typeof insertUserBalanceSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
