import { betterAuth } from "better-auth";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["email", "profile"],
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