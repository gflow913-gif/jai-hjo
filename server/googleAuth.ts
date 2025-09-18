import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required for session security");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth strategy - use dynamic callback URL for Replit
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.NODE_ENV === 'production'
    ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
    : `http://localhost:${process.env.PORT || 5000}`;
    
  console.log(`Setting up Google OAuth with callback URL: ${baseUrl}/api/auth/google/callback`);
  console.log(`Google Client ID configured: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 10)}...`);
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${baseUrl}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("Google OAuth callback - User authenticated", { userId: profile.id });

      // Map Google profile to our user structure (don't set id, let DB generate)
      const userData = {
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        profileImageUrl: profile.photos?.[0]?.value || '',
        provider: 'google',
        googleId: profile.id,
      };

      const user = await storage.upsertUser(userData);
      console.log("User authentication successful", { userId: user.id });
      
      // Create session user object
      const sessionUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      return done(null, sessionUser);
    } catch (error) {
      console.error("Google auth error:", error);
      return done(error, false);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        const sessionUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        };
        done(null, sessionUser);
      } else {
        console.log("User not found in database:", id);
        done(null, false);
      }
    } catch (error) {
      console.error("Deserialize user error:", error);
      done(error, false);
    }
  });

  // Auth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { 
      scope: ["profile", "email"] 
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { 
      failureRedirect: "/login-failed" 
    }),
    (req, res) => {
      // Successful authentication
      res.redirect("/");
    }
  );

  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Destroy session and clear cookie
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destroy error:", sessionErr);
        }
        res.clearCookie('connect.sid'); // Default express-session cookie name
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};