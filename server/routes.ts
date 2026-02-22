import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import { updateProfileSchema, updateHandleSchema, sendMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.post("/api/profile", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid profile data", errors: result.error.flatten().fieldErrors });
    }
    try {
      const user = await storage.updateUserProfile(userId, result.data);
      res.json(user);
    } catch (err: any) {
      console.error("Profile update error:", err.message);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.post("/api/handle", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const result = updateHandleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid handle", errors: result.error.flatten().fieldErrors });
    }
    try {
      const available = await storage.checkHandleAvailable(result.data.handle);
      if (!available) {
        return res.status(409).json({ message: "Handle is already taken" });
      }
      const user = await storage.updateUserHandle(userId, result.data.handle);
      res.json(user);
    } catch (err: any) {
      console.error("Handle update error:", err.message);
      res.status(500).json({ message: "Failed to update handle" });
    }
  });

  app.get("/api/handle/check/:handle", isAuthenticated, async (req, res) => {
    try {
      const available = await storage.checkHandleAvailable(req.params.handle);
      res.json({ available });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/snaptrade/register", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    try {
      const { registerSnaptradeUser } = await import("./snaptrade");
      const userSecret = await registerSnaptradeUser(userId);
      await storage.updateSnaptradeSecret(userId, userSecret);
      res.json({ success: true });
    } catch (err: any) {
      console.error("SnapTrade register error:", err.message);
      res.status(500).json({ message: "Failed to register with SnapTrade" });
    }
  });

  app.get("/api/snaptrade/login-url", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    try {
      const user = await storage.getUser(userId);
      if (!user?.snaptradeUserSecret) {
        return res.status(400).json({ message: "Not registered with SnapTrade" });
      }
      const { getSnaptradeLoginUrl } = await import("./snaptrade");
      const proto = req.get("x-forwarded-proto") || req.protocol;
      const host = req.get("x-forwarded-host") || req.get("host") || "";
      const redirectUri = `${proto}://${host}/snaptrade-callback`;
      const loginUrl = await getSnaptradeLoginUrl(userId, user.snaptradeUserSecret, redirectUri);
      res.json({ url: loginUrl });
    } catch (err: any) {
      console.error("SnapTrade login URL error:", err.message);
      res.status(500).json({ message: "Failed to get SnapTrade login URL" });
    }
  });

  app.post("/api/snaptrade/sync", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    try {
      const user = await storage.getUser(userId);
      if (!user?.snaptradeUserSecret) {
        return res.status(400).json({ message: "Not registered with SnapTrade" });
      }
      const { getUserAccounts, getUserHoldings } = await import("./snaptrade");
      const accounts = await getUserAccounts(userId, user.snaptradeUserSecret);
      const allHoldings = await getUserHoldings(userId, user.snaptradeUserSecret);

      for (const account of (accounts as any[])) {
        const linkedAccount = await storage.createLinkedAccount({
          userId,
          institutionName: account.institution_name || account.name || "Unknown",
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
        });

        const accountHoldings = (allHoldings as any[]).filter((h: any) => h.account?.id === account.id);
        const holdingsToInsert = accountHoldings.map((h: any) => ({
          userId,
          linkedAccountId: linkedAccount.id,
          symbol: h.symbol?.symbol || h.symbol || "UNKNOWN",
          name: h.symbol?.description || h.symbol?.symbol || "Unknown",
          quantity: String(h.units || 0),
          currentPrice: String(h.price || 0),
          totalValue: String((h.units || 0) * (h.price || 0)),
          costBasis: h.average_purchase_price ? String(h.average_purchase_price) : null,
          currency: h.currency?.code || "USD",
          securityType: h.symbol?.type?.code || null,
        }));

        if (holdingsToInsert.length > 0) {
          await storage.upsertHoldings(userId, linkedAccount.id, holdingsToInsert);
        }
      }

      const totalHoldings = await storage.getHoldings(userId);
      const totalValue = totalHoldings.reduce((sum, h) => sum + parseFloat(h.totalValue), 0);
      await storage.addPortfolioHistory(userId, String(totalValue));

      res.json({ success: true, accountsLinked: (accounts as any[]).length });
    } catch (err: any) {
      console.error("SnapTrade sync error:", err.message);
      res.status(500).json({ message: "Failed to sync brokerage data" });
    }
  });

  app.get("/api/portfolio/holdings", isAuthenticated, async (req, res) => {
    try {
      const holdings = await storage.getHoldings(req.session.userId!);
      res.json(holdings);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/portfolio/accounts", isAuthenticated, async (req, res) => {
    try {
      const accounts = await storage.getLinkedAccounts(req.session.userId!);
      res.json(accounts);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/portfolio/history", isAuthenticated, async (req, res) => {
    try {
      const { since } = req.query;
      const sinceDate = since ? new Date(since as string) : undefined;
      const history = await storage.getPortfolioHistory(req.session.userId!, sinceDate);
      res.json(history);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") return res.json([]);
      const results = await storage.searchUsers(q, req.session.userId!);
      res.json(results.map(u => ({ id: u.id, handle: u.handle, firstName: u.firstName, lastName: u.lastName, profileImageUrl: u.profileImageUrl })));
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/connections/request", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ message: "receiverId required" });
    try {
      const existing = await storage.getConnection(userId, receiverId);
      if (existing) return res.status(409).json({ message: "Connection already exists", connection: existing });
      const conn = await storage.createConnection(userId, receiverId);
      res.json(conn);
    } catch (err: any) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/connections", isAuthenticated, async (req, res) => {
    try {
      const conns = await storage.getConnections(req.session.userId!);
      res.json(conns.map(u => ({ id: u.id, handle: u.handle, firstName: u.firstName, lastName: u.lastName, profileImageUrl: u.profileImageUrl })));
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/connections/pending", isAuthenticated, async (req, res) => {
    try {
      const pending = await storage.getPendingConnectionRequests(req.session.userId!);
      res.json(pending.map(p => ({
        id: p.id,
        requester: { id: p.requester.id, handle: p.requester.handle, firstName: p.requester.firstName, lastName: p.requester.lastName, profileImageUrl: p.requester.profileImageUrl },
      })));
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/connections/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const conn = await storage.updateConnectionStatus(req.params.id, "accepted");
      res.json(conn);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/connections/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const conn = await storage.updateConnectionStatus(req.params.id, "rejected");
      res.json(conn);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const result = sendMessageSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid message" });
    try {
      const msg = await storage.createMessage({ senderId: userId, receiverId: result.data.receiverId, content: result.data.content });
      res.json(msg);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
    try {
      const msgs = await storage.getMessages(req.session.userId!, req.params.userId);
      res.json(msgs);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const convos = await storage.getConversations(req.session.userId!);
      res.json(convos.map(c => ({
        user: { id: c.user.id, handle: c.user.handle, firstName: c.user.firstName, lastName: c.user.lastName, profileImageUrl: c.user.profileImageUrl },
        lastMessage: c.lastMessage,
      })));
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
