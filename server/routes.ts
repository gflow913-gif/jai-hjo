import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupGoogleAuth, isAuthenticated } from "./googleAuth";
import { gameService } from "./gameService";
import { setupDiscordBot, getDiscordBot } from "./discordBot";
import { insertChatMessageSchema, insertWithdrawalRequestSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupGoogleAuth(app);

  // Setup Discord bot
  await setupDiscordBot();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const balance = await storage.getUserBalance(userId);
      res.json({ ...user, balance });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update username route
  app.post('/api/auth/set-username', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;
      
      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }
      
      if (username.trim().length > 20) {
        return res.status(400).json({ message: "Username must be less than 20 characters" });
      }
      
      const cleanUsername = username.trim();
      
      // Server-side validation - only alphanumeric and underscore
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
      }
      
      // Check if username is already taken (case-insensitive)
      const [existingUser] = await db.select().from(users).where(eq(users.username, cleanUsername));
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: "Username is already taken" });
      }
      
      // Update user with chosen username
      const updatedUser = await storage.updateUser(userId, {
        username: cleanUsername,
        isUsernameSet: true,
      });
      
      res.json({ 
        message: "Username updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error setting username:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  // Balance routes
  app.get('/api/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const balance = await storage.getUserBalance(userId);
      if (!balance) {
        return res.status(404).json({ message: "Balance not found" });
      }
      res.json(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Game routes
  app.post('/api/games/coin-flip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, choice } = req.body;
      
      if (!amount || !choice || !['heads', 'tails'].includes(choice)) {
        return res.status(400).json({ message: "Invalid bet parameters" });
      }

      const result = await gameService.playCoinFlip(userId, parseFloat(amount), choice);
      res.json(result);
    } catch (error) {
      console.error("Error playing coin flip:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Game error" });
    }
  });

  app.post('/api/games/dice-roll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, choice } = req.body;
      
      if (!amount || !choice || choice < 1 || choice > 6) {
        return res.status(400).json({ message: "Invalid bet parameters" });
      }

      const result = await gameService.playDiceRoll(userId, parseFloat(amount), parseInt(choice));
      res.json(result);
    } catch (error) {
      console.error("Error playing dice roll:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Game error" });
    }
  });

  app.post('/api/games/roulette', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, choice } = req.body;
      
      if (!amount || !choice || !['red', 'black'].includes(choice)) {
        return res.status(400).json({ message: "Invalid bet parameters" });
      }

      const result = await gameService.playRoulette(userId, parseFloat(amount), choice);
      res.json(result);
    } catch (error) {
      console.error("Error playing roulette:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Game error" });
    }
  });

  // Transaction history
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Chat routes
  app.get('/api/chat/messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getRecentChatMessages(limit);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Withdrawal routes
  app.post('/api/withdrawal/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }

      const balance = await storage.getUserBalance(userId);
      if (!balance) {
        return res.status(404).json({ message: "Balance not found" });
      }

      const totalBalance = parseFloat(balance.totalBalance);
      const earnedBalance = parseFloat(balance.earnedBalance);
      
      // Check withdrawal eligibility
      if (totalBalance < 10) {
        return res.status(400).json({ message: "Minimum balance of 10 SX required" });
      }
      
      if (earnedBalance < 10) {
        return res.status(400).json({ message: "Must have at least 10 SX earned through gambling" });
      }
      
      if (amount > earnedBalance) {
        return res.status(400).json({ message: "Cannot withdraw more than earned amount" });
      }

      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId,
        amount: amount.toString(),
        status: 'pending',
      });

      // Send Discord notification
      const discordBot = getDiscordBot();
      if (discordBot) {
        const user = await storage.getUser(userId);
        if (user) {
          await discordBot.sendWithdrawalNotification(withdrawalRequest, user);
        }
      }

      res.json(withdrawalRequest);
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  app.get('/api/withdrawal/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getUserWithdrawalRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  // Discord linking route
  app.post('/api/auth/discord/link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { linkCode } = req.body;
      
      if (!linkCode || typeof linkCode !== 'string') {
        return res.status(400).json({ message: "Link code is required" });
      }
      
      const discordBot = getDiscordBot();
      if (!discordBot) {
        return res.status(500).json({ message: "Discord bot not available" });
      }
      
      // Verify the link code
      const discordUserId = discordBot.verifyLinkCode(linkCode);
      if (!discordUserId) {
        return res.status(400).json({ message: "Invalid or expired link code" });
      }
      
      // Check if Discord ID is already linked to another account
      const [existingUser] = await db.select().from(users).where(eq(users.discordId, discordUserId));
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: "Discord account is already linked to another user" });
      }
      
      // Update user with Discord ID
      const updatedUser = await storage.updateUser(userId, { discordId: discordUserId });
      
      res.json({ 
        message: "Discord account linked successfully",
        discordLinked: true
      });
    } catch (error) {
      console.error("Error linking Discord account:", error);
      res.status(500).json({ message: "Failed to link Discord account" });
    }
  });

  // WebSocket token endpoint for secure WebSocket authentication
  const wsTokens = new Map<string, { userId: string; expiresAt: number }>();
  
  app.get('/api/auth/ws-token', isAuthenticated, (req: any, res) => {
    const userId = req.user.id;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    wsTokens.set(token, { userId, expiresAt });
    
    // Clean up expired tokens
    const now = Date.now();
    const expiredTokens: string[] = [];
    wsTokens.forEach((data, tokenKey) => {
      if (now > data.expiresAt) {
        expiredTokens.push(tokenKey);
      }
    });
    expiredTokens.forEach(tokenKey => wsTokens.delete(tokenKey));
    
    res.json({ token });
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection');
    let authenticatedUserId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const { type, payload, userId } = JSON.parse(data.toString());
        
        // Handle authentication with WebSocket token
        if (type === 'authenticate' && payload.wsToken) {
          const tokenData = wsTokens.get(payload.wsToken);
          
          if (!tokenData) {
            ws.send(JSON.stringify({
              type: 'authentication_failed',
              payload: { message: 'Invalid authentication token' }
            }));
            ws.close();
            return;
          }
          
          if (Date.now() > tokenData.expiresAt) {
            wsTokens.delete(payload.wsToken);
            ws.send(JSON.stringify({
              type: 'authentication_failed',
              payload: { message: 'Authentication token expired' }
            }));
            ws.close();
            return;
          }
          
          // Token is valid - authenticate the WebSocket
          authenticatedUserId = tokenData.userId;
          wsTokens.delete(payload.wsToken); // One-time use
          
          console.log(`WebSocket authenticated for user: ${tokenData.userId}`);
          ws.send(JSON.stringify({
            type: 'authenticated',
            payload: { success: true, userId: tokenData.userId }
          }));
          return;
        }
        
        // Require authentication for all other operations
        if (!authenticatedUserId) {
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Authentication required' }
          }));
          return;
        }
        
        if (type === 'chat_message' && payload.message) {
          // Use the authenticated user ID, not client-provided one
          const validatedMessage = insertChatMessageSchema.parse({
            userId: authenticatedUserId,
            message: payload.message.trim(),
          });

          const chatMessage = await storage.createChatMessage(validatedMessage);
          const user = await storage.getUser(authenticatedUserId);
          
          if (user) {
            const messageWithUser = {
              ...chatMessage,
              user,
            };

            // Broadcast to all connected clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'chat_message',
                  payload: messageWithUser,
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
