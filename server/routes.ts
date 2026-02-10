import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import { updateProfileSchema } from "@shared/schema";

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

  const httpServer = createServer(app);

  return httpServer;
}
