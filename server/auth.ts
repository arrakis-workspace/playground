import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import crypto from "crypto";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    oauthState?: string;
  }
}

function getBaseURL(req: any): string {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  const host = req.get("x-forwarded-host") || req.get("host") || "";
  return `${proto}://${host}`;
}

export async function setupAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set");
  }

  app.set("trust proxy", 1);

  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    })
  );

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  app.get("/api/login", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;

    const baseURL = getBaseURL(req);
    const redirectUri = `${baseURL}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
      access_type: "offline",
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("Redirecting to Google with redirect_uri:", redirectUri);
    console.log("Full auth URL:", authUrl);
    res.redirect(authUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    console.log("Callback hit, query:", JSON.stringify(req.query));

    if (req.query.error) {
      console.error("Google error:", req.query.error, req.query.error_description);
      return res.redirect("/");
    }

    const code = req.query.code as string;
    if (!code) {
      console.error("No auth code received");
      return res.redirect("/");
    }

    try {
      const baseURL = getBaseURL(req);
      const redirectUri = `${baseURL}/api/auth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json() as any;
      if (!tokenRes.ok) {
        console.error("Token exchange failed:", JSON.stringify(tokenData));
        return res.redirect("/");
      }

      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile = await userInfoRes.json() as any;
      if (!userInfoRes.ok) {
        console.error("User info fetch failed:", JSON.stringify(profile));
        return res.redirect("/");
      }

      console.log("Google profile received:", profile.email);

      const user = await storage.upsertUser({
        id: profile.id,
        email: profile.email ?? null,
        firstName: profile.given_name ?? null,
        lastName: profile.family_name ?? null,
        profileImageUrl: profile.picture ?? null,
      });

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        res.redirect("/");
      });
    } catch (err: any) {
      console.error("OAuth callback error:", err.message);
      res.redirect("/");
    }
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(user);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/debug/auth-url", (req, res) => {
    const baseURL = getBaseURL(req);
    const redirectUri = `${baseURL}/api/auth/google/callback`;
    res.json({
      clientId: CLIENT_ID,
      redirectUri,
      note: "Make sure this exact redirect_uri is added in Google Cloud Console under Credentials > OAuth 2.0 Client > Authorized redirect URIs",
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
