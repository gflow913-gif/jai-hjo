import type { Request, Response, NextFunction } from "express";
import { auth } from "./betterAuth";
import { fromNodeHeaders } from "better-auth/node";

export const isAuthenticated = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      username: session.user.username,
      isUsernameSet: session.user.isUsernameSet,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};