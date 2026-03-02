import { type User, type UpsertUser, type UpdateNotificationSettings, type LinkedAccount, type InsertLinkedAccount, type Holding, type InsertHolding, type PortfolioHistoryEntry, type Connection, type InsertConnection, type Message, type InsertMessage, type Watchlist, type InsertWatchlist, type ManualHolding, type InsertManualHolding, type SellHoldingData } from "@shared/schema";
import { db } from "./db";
import { users, linkedAccounts, holdings, portfolioHistory, connections, messages, watchlists, manualHoldings, soldHoldings } from "@shared/schema";
import { eq, or, and, ilike, desc, asc, sql, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: { firstName: string; lastName: string; contactNumber: string; country: string }): Promise<User>;
  updateUserHandle(id: string, handle: string): Promise<User>;
  getUserByHandle(handle: string): Promise<User | undefined>;
  checkHandleAvailable(handle: string): Promise<boolean>;
  updateSnaptradeSecret(id: string, secret: string): Promise<void>;
  updateNotificationSettings(id: string, settings: UpdateNotificationSettings): Promise<User>;
  updateLastSeenRequestsAt(id: string): Promise<void>;
  getUnseenRequestCount(userId: string): Promise<number>;

  createLinkedAccount(data: InsertLinkedAccount): Promise<LinkedAccount>;
  getLinkedAccounts(userId: string): Promise<LinkedAccount[]>;
  deleteLinkedAccount(id: string, userId: string): Promise<void>;

  upsertHoldings(userId: string, linkedAccountId: string, holdingsData: InsertHolding[]): Promise<void>;
  getHoldings(userId: string): Promise<Holding[]>;

  addPortfolioHistory(userId: string, totalValue: string, date?: Date): Promise<void>;
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

  getUserWatchlists(userId: string): Promise<Watchlist[]>;
  createWatchlist(data: InsertWatchlist): Promise<Watchlist>;
  updateWatchlist(id: string, userId: string, name: string, symbols: string[]): Promise<Watchlist | undefined>;
  deleteWatchlist(id: string, userId: string): Promise<void>;

  deleteConnection(userId: string, otherUserId: string): Promise<void>;
  deleteConversation(userId: string, otherUserId: string): Promise<void>;

  addManualHolding(userId: string, data: InsertManualHolding): Promise<ManualHolding>;
  getManualHoldings(userId: string): Promise<ManualHolding[]>;
  deleteManualHolding(id: string, userId: string): Promise<void>;
  sellManualHolding(userId: string, holdingId: string, sellData: SellHoldingData): Promise<{ cashBalance: string }>;
  getCashBalance(userId: string): Promise<string>;

  deleteUser(userId: string): Promise<void>;
  reactivateUser(id: string, data: { email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null }): Promise<User>;
}

class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.email, email), eq(users.deleted, false))
    );
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
    const [existing] = await db.select({ id: users.id }).from(users).where(
      and(eq(users.handle, handle), eq(users.deleted, false))
    );
    return !existing;
  }

  async updateSnaptradeSecret(id: string, secret: string): Promise<void> {
    await db.update(users).set({ snaptradeUserSecret: secret, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async updateNotificationSettings(id: string, settings: UpdateNotificationSettings): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        emailNotifications: settings.emailNotifications,
        textNotifications: settings.textNotifications,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateLastSeenRequestsAt(id: string): Promise<void> {
    await db.update(users).set({ lastSeenRequestsAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
  }

  async getUnseenRequestCount(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    const lastSeen = user.lastSeenRequestsAt;
    let query;
    if (lastSeen) {
      query = await db.select({ count: sql<number>`count(*)` }).from(connections)
        .where(and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending"),
          gt(connections.createdAt, lastSeen)
        ));
    } else {
      query = await db.select({ count: sql<number>`count(*)` }).from(connections)
        .where(and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending")
        ));
    }
    return Number(query[0]?.count || 0);
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

  async addPortfolioHistory(userId: string, totalValue: string, date?: Date): Promise<void> {
    await db.insert(portfolioHistory).values({ userId, date: date || new Date(), totalValue });
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
      .where(and(
        eq(connections.receiverId, userId),
        eq(connections.status, "pending"),
        eq(users.deleted, false)
      ));
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
        eq(users.deleted, false),
        or(
          ilike(users.handle, `%${query}%`),
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`)
        )
      ))
      .limit(20);
  }

  async getUserWatchlists(userId: string): Promise<Watchlist[]> {
    return db.select().from(watchlists).where(eq(watchlists.userId, userId)).orderBy(asc(watchlists.createdAt));
  }

  async createWatchlist(data: InsertWatchlist): Promise<Watchlist> {
    const [wl] = await db.insert(watchlists).values(data).returning();
    return wl;
  }

  async updateWatchlist(id: string, userId: string, name: string, symbols: string[]): Promise<Watchlist | undefined> {
    const [wl] = await db.update(watchlists)
      .set({ name, symbols, updatedAt: new Date() })
      .where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)))
      .returning();
    return wl;
  }

  async deleteWatchlist(id: string, userId: string): Promise<void> {
    await db.delete(watchlists).where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)));
  }

  async deleteConnection(userId: string, otherUserId: string): Promise<void> {
    await db.delete(connections).where(
      and(
        eq(connections.status, "accepted"),
        or(
          and(eq(connections.requesterId, userId), eq(connections.receiverId, otherUserId)),
          and(eq(connections.requesterId, otherUserId), eq(connections.receiverId, userId))
        )
      )
    );
  }

  async deleteConversation(userId: string, otherUserId: string): Promise<void> {
    await db.delete(messages).where(
      or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
        and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
      )
    );
  }

  async addManualHolding(userId: string, data: InsertManualHolding): Promise<ManualHolding> {
    const totalValue = (parseFloat(data.quantity) * parseFloat(data.purchasePrice)).toFixed(2);
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    const [holding] = await db.insert(manualHoldings).values({
      userId,
      symbol: data.symbol,
      name: data.name,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      purchaseDate,
      totalValue,
    }).returning();
    return holding;
  }

  async getManualHoldings(userId: string): Promise<ManualHolding[]> {
    return db.select().from(manualHoldings).where(eq(manualHoldings.userId, userId)).orderBy(desc(manualHoldings.createdAt));
  }

  async deleteManualHolding(id: string, userId: string): Promise<void> {
    await db.delete(manualHoldings).where(and(eq(manualHoldings.id, id), eq(manualHoldings.userId, userId)));
  }

  async sellManualHolding(userId: string, holdingId: string, sellData: SellHoldingData): Promise<{ cashBalance: string }> {
    const [holding] = await db.select().from(manualHoldings).where(and(eq(manualHoldings.id, holdingId), eq(manualHoldings.userId, userId)));
    if (!holding) throw new Error("Holding not found");

    const currentQty = parseFloat(holding.quantity);
    const sellQty = sellData.sharesSold;
    if (sellQty > currentQty) throw new Error("Cannot sell more shares than owned");

    const sellValue = (sellQty * sellData.sellPrice).toFixed(2);

    await db.insert(soldHoldings).values({
      userId,
      manualHoldingId: holdingId,
      symbol: holding.symbol,
      sharesSold: sellQty.toString(),
      sellPrice: sellData.sellPrice.toString(),
      sellValue,
    });

    if (sellQty >= currentQty) {
      await db.delete(manualHoldings).where(eq(manualHoldings.id, holdingId));
    } else {
      const newQty = currentQty - sellQty;
      const newTotal = (newQty * parseFloat(holding.purchasePrice)).toFixed(2);
      await db.update(manualHoldings).set({
        quantity: newQty.toString(),
        totalValue: newTotal,
      }).where(eq(manualHoldings.id, holdingId));
    }

    const user = await this.getUser(userId);
    const currentCash = parseFloat(user?.cashBalance || "0");
    const newCash = (currentCash + parseFloat(sellValue)).toFixed(2);
    await db.update(users).set({ cashBalance: newCash, updatedAt: new Date() }).where(eq(users.id, userId));

    return { cashBalance: newCash };
  }

  async getCashBalance(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    return user?.cashBalance || "0";
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    await db.delete(watchlists).where(eq(watchlists.userId, userId));
    await db.delete(soldHoldings).where(eq(soldHoldings.userId, userId));
    await db.delete(manualHoldings).where(eq(manualHoldings.userId, userId));
    await db.delete(holdings).where(eq(holdings.userId, userId));
    await db.delete(linkedAccounts).where(eq(linkedAccounts.userId, userId));
    await db.delete(portfolioHistory).where(eq(portfolioHistory.userId, userId));
    await db.delete(messages).where(
      or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
    );
    await db.delete(connections).where(
      and(
        eq(connections.status, "pending"),
        or(eq(connections.requesterId, userId), eq(connections.receiverId, userId))
      )
    );

    await db.update(users).set({
      email: null,
      firstName: "Deleted",
      lastName: "User",
      contactNumber: null,
      country: null,
      profileImageUrl: null,
      snaptradeUserSecret: null,
      profileCompleted: null,
      handle: null,
      deleted: true,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }

  async reactivateUser(id: string, data: { email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null }): Promise<User> {
    await db.delete(connections).where(
      or(eq(connections.requesterId, id), eq(connections.receiverId, id))
    );

    const [user] = await db.update(users).set({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImageUrl: data.profileImageUrl,
      deleted: false,
      profileCompleted: null,
      handle: null,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    return user;
  }
}

export const storage: IStorage = new DatabaseStorage();
