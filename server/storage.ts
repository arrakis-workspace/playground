import { type User, type UpsertUser, type LinkedAccount, type InsertLinkedAccount, type Holding, type InsertHolding, type PortfolioHistoryEntry, type Connection, type InsertConnection, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { users, linkedAccounts, holdings, portfolioHistory, connections, messages } from "@shared/schema";
import { eq, or, and, ilike, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: { firstName: string; lastName: string; contactNumber: string; country: string }): Promise<User>;
  updateUserHandle(id: string, handle: string): Promise<User>;
  getUserByHandle(handle: string): Promise<User | undefined>;
  checkHandleAvailable(handle: string): Promise<boolean>;
  updateSnaptradeSecret(id: string, secret: string): Promise<void>;

  createLinkedAccount(data: InsertLinkedAccount): Promise<LinkedAccount>;
  getLinkedAccounts(userId: string): Promise<LinkedAccount[]>;
  deleteLinkedAccount(id: string, userId: string): Promise<void>;

  upsertHoldings(userId: string, linkedAccountId: string, holdingsData: InsertHolding[]): Promise<void>;
  getHoldings(userId: string): Promise<Holding[]>;

  addPortfolioHistory(userId: string, totalValue: string): Promise<void>;
  getPortfolioHistory(userId: string, since?: Date): Promise<PortfolioHistoryEntry[]>;

  createConnection(requesterId: string, receiverId: string): Promise<Connection>;
  getConnection(userId1: string, userId2: string): Promise<Connection | undefined>;
  getConnectionById(id: string): Promise<Connection | undefined>;
  getPendingConnectionRequests(userId: string): Promise<(Connection & { requester: User })[]>;
  getConnections(userId: string): Promise<User[]>;
  updateConnectionStatus(id: string, status: string): Promise<Connection>;

  createMessage(data: InsertMessage): Promise<Message>;
  getMessages(userId1: string, userId2: string, limit?: number): Promise<Message[]>;
  getConversations(userId: string): Promise<{ user: User; lastMessage: Message }[]>;

  searchUsers(query: string, excludeUserId: string): Promise<User[]>;
}

class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: { firstName: string; lastName: string; contactNumber: string; country: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        country: data.country,
        profileCompleted: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserHandle(id: string, handle: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ handle, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByHandle(handle: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.handle, handle));
    return user;
  }

  async checkHandleAvailable(handle: string): Promise<boolean> {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle));
    return !existing;
  }

  async updateSnaptradeSecret(id: string, secret: string): Promise<void> {
    await db.update(users).set({ snaptradeUserSecret: secret, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async createLinkedAccount(data: InsertLinkedAccount): Promise<LinkedAccount> {
    const [account] = await db.insert(linkedAccounts).values(data).returning();
    return account;
  }

  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    return db.select().from(linkedAccounts).where(eq(linkedAccounts.userId, userId));
  }

  async deleteLinkedAccount(id: string, userId: string): Promise<void> {
    await db.delete(holdings).where(and(eq(holdings.linkedAccountId, id), eq(holdings.userId, userId)));
    await db.delete(linkedAccounts).where(and(eq(linkedAccounts.id, id), eq(linkedAccounts.userId, userId)));
  }

  async upsertHoldings(userId: string, linkedAccountId: string, holdingsData: InsertHolding[]): Promise<void> {
    await db.delete(holdings).where(and(eq(holdings.userId, userId), eq(holdings.linkedAccountId, linkedAccountId)));
    if (holdingsData.length > 0) {
      await db.insert(holdings).values(holdingsData);
    }
  }

  async getHoldings(userId: string): Promise<Holding[]> {
    return db.select().from(holdings).where(eq(holdings.userId, userId));
  }

  async addPortfolioHistory(userId: string, totalValue: string): Promise<void> {
    await db.insert(portfolioHistory).values({ userId, date: new Date(), totalValue });
  }

  async getPortfolioHistory(userId: string, since?: Date): Promise<PortfolioHistoryEntry[]> {
    if (since) {
      return db.select().from(portfolioHistory)
        .where(and(eq(portfolioHistory.userId, userId), sql`${portfolioHistory.date} >= ${since}`))
        .orderBy(asc(portfolioHistory.date));
    }
    return db.select().from(portfolioHistory).where(eq(portfolioHistory.userId, userId)).orderBy(asc(portfolioHistory.date));
  }

  async createConnection(requesterId: string, receiverId: string): Promise<Connection> {
    const [conn] = await db.insert(connections).values({ requesterId, receiverId, status: "pending" }).returning();
    return conn;
  }

  async getConnection(userId1: string, userId2: string): Promise<Connection | undefined> {
    const [conn] = await db.select().from(connections).where(
      or(
        and(eq(connections.requesterId, userId1), eq(connections.receiverId, userId2)),
        and(eq(connections.requesterId, userId2), eq(connections.receiverId, userId1))
      )
    );
    return conn;
  }

  async getConnectionById(id: string): Promise<Connection | undefined> {
    const [conn] = await db.select().from(connections).where(eq(connections.id, id));
    return conn;
  }

  async getPendingConnectionRequests(userId: string): Promise<(Connection & { requester: User })[]> {
    const rows = await db
      .select({ connection: connections, requester: users })
      .from(connections)
      .innerJoin(users, eq(connections.requesterId, users.id))
      .where(and(eq(connections.receiverId, userId), eq(connections.status, "pending")));
    return rows.map(r => ({ ...r.connection, requester: r.requester }));
  }

  async getConnections(userId: string): Promise<User[]> {
    const rows = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.status, "accepted"),
          or(eq(connections.requesterId, userId), eq(connections.receiverId, userId))
        )
      );
    const connectedIds = rows.map(r => r.requesterId === userId ? r.receiverId : r.requesterId);
    if (connectedIds.length === 0) return [];
    const connectedUsers = await db.select().from(users).where(sql`${users.id} IN (${sql.join(connectedIds.map(id => sql`${id}`), sql`, `)})`);
    return connectedUsers;
  }

  async updateConnectionStatus(id: string, status: string): Promise<Connection> {
    const [conn] = await db.update(connections).set({ status, updatedAt: new Date() }).where(eq(connections.id, id)).returning();
    return conn;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getMessages(userId1: string, userId2: string, limit = 50): Promise<Message[]> {
    return db.select().from(messages)
      .where(or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      ))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getConversations(userId: string): Promise<{ user: User; lastMessage: Message }[]> {
    const allMessages = await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const seen = new Map<string, Message>();
    for (const msg of allMessages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!seen.has(otherId)) seen.set(otherId, msg);
    }

    const result: { user: User; lastMessage: Message }[] = [];
    for (const [otherId, lastMessage] of seen) {
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherId));
      if (otherUser) result.push({ user: otherUser, lastMessage });
    }
    return result;
  }

  async searchUsers(query: string, excludeUserId: string): Promise<User[]> {
    return db.select().from(users)
      .where(and(
        sql`${users.id} != ${excludeUserId}`,
        or(
          ilike(users.handle, `%${query}%`),
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`)
        )
      ))
      .limit(20);
  }
}

export const storage: IStorage = new DatabaseStorage();
