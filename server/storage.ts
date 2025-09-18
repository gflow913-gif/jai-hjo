import {
  users,
  userBalances,
  transactions,
  chatMessages,
  withdrawalRequests,
  type User,
  type UpsertUser,
  type UserBalance,
  type Transaction,
  type ChatMessage,
  type WithdrawalRequest,
  type InsertUserBalance,
  type InsertTransaction,
  type InsertChatMessage,
  type InsertWithdrawalRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Balance operations
  getUserBalance(userId: string): Promise<UserBalance | undefined>;
  createUserBalance(balance: InsertUserBalance): Promise<UserBalance>;
  updateUserBalance(userId: string, updates: Partial<UserBalance>): Promise<UserBalance>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getRecentChatMessages(limit?: number): Promise<(ChatMessage & { user: User })[]>;
  
  // Withdrawal operations
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]>;
  updateWithdrawalRequest(id: string, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to find existing user by googleId
      if (userData.googleId) {
        const [existingUser] = await db.select().from(users).where(eq(users.googleId, userData.googleId));
        if (existingUser) {
          // Update existing user (NEVER update the ID)
          const updateData = {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            provider: userData.provider,
            updatedAt: new Date(),
          };
          
          const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, existingUser.id))
            .returning();
          return updatedUser;
        }
      }

      // Create new user (let DB generate the ID, don't use Google ID as primary key)
      const newUserData = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        provider: userData.provider,
        googleId: userData.googleId,
      };

      const [user] = await db
        .insert(users)
        .values(newUserData)
        .returning();
      
      // Create initial balance for new user
      await this.createUserBalance({
        userId: user.id,
        totalBalance: '5.00',
        earnedBalance: '0.00',
        bonusBalance: '5.00',
      });
      
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  // Balance operations
  async getUserBalance(userId: string): Promise<UserBalance | undefined> {
    const [balance] = await db.select().from(userBalances).where(eq(userBalances.userId, userId));
    return balance;
  }

  async createUserBalance(balance: InsertUserBalance): Promise<UserBalance> {
    const [newBalance] = await db
      .insert(userBalances)
      .values(balance)
      .returning();
    return newBalance;
  }

  async updateUserBalance(userId: string, updates: Partial<UserBalance>): Promise<UserBalance> {
    const [updatedBalance] = await db
      .update(userBalances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userBalances.userId, userId))
      .returning();
    return updatedBalance;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getRecentChatMessages(limit = 50): Promise<(ChatMessage & { user: User })[]> {
    return await db
      .select({
        id: chatMessages.id,
        userId: chatMessages.userId,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        user: users,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // Withdrawal operations
  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [newRequest] = await db
      .insert(withdrawalRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async updateWithdrawalRequest(id: string, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest> {
    const [updatedRequest] = await db
      .update(withdrawalRequests)
      .set(updates)
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return updatedRequest;
  }
}

export const storage = new DatabaseStorage();
