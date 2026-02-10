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
    console.log("Google callback hit, full query:", JSON.stringify(req.query));
    if (req.query.error) {
      const errorInfo = {
        error: req.query.error,
        error_description: req.query.error_description,
        error_uri: req.query.error_uri,
      };
      console.error("Google OAuth error:", JSON.stringify(errorInfo));
      return res.status(400).send(`<h2>Google OAuth Error</h2><pre>${JSON.stringify(errorInfo, null, 2)}</pre><p><a href="/">Go back</a></p>`);
    }
    const callbackURL = getCallbackURL(req);
    console.log("Callback using callbackURL:", callbackURL);
    passport.authenticate("google", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Passport auth error:", err);
        return res.status(500).send(`<h2>Auth Error</h2><pre>${err.message}</pre><p><a href="/">Go back</a></p>`);
      }
      if (!user) {
        console.error("Passport auth failed, info:", info);
        return res.status(401).send(`<h2>Auth Failed</h2><pre>${JSON.stringify(info, null, 2)}</pre><p><a href="/">Go back</a></p>`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.status(500).send(`<h2>Login Error</h2><pre>${loginErr.message}</pre><p><a href="/">Go back</a></p>`);
        }
        res.redirect("/");
      });
    })(req, res, next);
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
