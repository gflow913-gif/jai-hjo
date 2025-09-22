import { betterAuth } from "better-auth";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@shared/schema";
import https from "https";

// Configure HTTPS agent for Replit environment
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Allow self-signed certificates in development
});

// Set global HTTPS agent for all requests
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Get the base URL for the current environment
const getBaseURL = () => {
  // Check for custom base URL first
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Replit environment detection
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  
  // Standard development/production environments
  return process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_URL || 'https://your-app.replit.app' 
    : 'http://localhost:5000';
};

export const auth = betterAuth({
  baseURL: getBaseURL(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["email", "profile"],
      redirectURI: `${getBaseURL()}/api/auth/callback/google`,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.COOKIE_DOMAIN || 
              (process.env.REPLIT_DEV_DOMAIN ? `.${process.env.REPLIT_DEV_DOMAIN}` : undefined),
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      isUsernameSet: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      profileImageUrl: {
        type: "string", 
        required: false,
      },
      provider: {
        type: "string",
        required: false,
      },
      googleId: {
        type: "string",
        required: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;