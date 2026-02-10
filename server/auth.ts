import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export async function setupAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set");
  }

  const isProduction = process.env.NODE_ENV === "production";

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

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        proxy: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const user = await storage.upsertUser({
            id: profile.id,
            email,
            firstName: profile.name?.givenName ?? null,
            lastName: profile.name?.familyName ?? null,
            profileImageUrl: profile.photos?.[0]?.value ?? null,
          });
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  function getCallbackURL(req: any): string {
    const forwardedProto = req.get("x-forwarded-proto") || req.protocol;
    const forwardedHost = req.get("x-forwarded-host") || req.get("host") || "";
    return `${forwardedProto}://${forwardedHost}/api/auth/google/callback`;
  }

  app.get("/api/login", (req, res, next) => {
    const callbackURL = getCallbackURL(req);
    console.log("Login redirect, using callbackURL:", callbackURL);
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      callbackURL,
    } as any)(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log("Google callback hit, query params:", req.query);
    if (req.query.error) {
      console.error("Google OAuth error:", req.query.error, req.query.error_description);
      return res.redirect("/");
    }
    const callbackURL = getCallbackURL(req);
    console.log("Callback using callbackURL:", callbackURL);
    passport.authenticate("google", {
      failureRedirect: "/",
      callbackURL,
    } as any)(req, res, next);
  }, (_req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    res.json(req.user);
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
