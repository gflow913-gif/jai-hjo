import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { gameService } from "./gameService";
import { setupDiscordBot } from "./discordBot";
import { insertChatMessageSchema, insertWithdrawalRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Setup Discord bot
  await setupDiscordBot();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Balance routes
  app.get('/api/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

      res.json(withdrawalRequest);
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  app.get('/api/withdrawal/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getUserWithdrawalRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const { type, payload, userId } = JSON.parse(data.toString());
        
        if (type === 'chat_message' && userId && payload.message) {
          // Validate chat message
          const validatedMessage = insertChatMessageSchema.parse({
            userId,
            message: payload.message.trim(),
          });

          const chatMessage = await storage.createChatMessage(validatedMessage);
          const user = await storage.getUser(userId);
          
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
