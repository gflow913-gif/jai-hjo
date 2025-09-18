import { Client, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { users, withdrawalRequests } from "@shared/schema";
import { db } from "./db";

class DiscordBot {
  private client: Client;
  private isReady = false;
  private withdrawalChannelId: string | null = null;
  private linkingCodes: Map<string, { discordUserId: string; expiresAt: number }> = new Map();

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.once('clientReady', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      const content = message.content.trim();
      
      // Handle balance command
      if (content === '!balance') {
        await this.handleBalanceCommand(message);
      }
      
      // Handle add command (admin only)
      if (content.startsWith('!add ')) {
        await this.handleAddCommand(message);
      }
      
      // Handle approve command (admin only)
      if (content.startsWith('!approve ')) {
        await this.handleApproveCommand(message);
      }
      
      // Handle reject command (admin only)
      if (content.startsWith('!reject ')) {
        await this.handleRejectCommand(message);
      }
      
      // Handle link command
      if (content === '!link') {
        await this.handleLinkCommand(message);
      }
      
      // Handle help command
      if (content === '!help') {
        await this.handleHelpCommand(message);
      }
    });

    this.client.on('error', (error) => {
      console.error('Discord bot error:', error);
    });
  }

  private async handleBalanceCommand(message: any) {
    try {
      const discordUserId = message.author.id;
      
      // Find user by Discord ID
      const [user] = await db.select().from(users).where(eq(users.discordId, discordUserId));
      
      if (!user) {
        const embed = {
          color: 0xF59E0B,
          title: '🔗 Account Not Linked',
          description: `Your Discord account is not linked to a Grow Casino account.\n\n**To link your account:**\n1. Use the \`!link\` command to get a linking code\n2. Log into the web application\n3. Enter the code in the Discord section on your dashboard\n\nOr create an account at the web application first.`,
          footer: {
            text: 'Grow Casino • Account Linking',
          },
        };
        await message.reply({ embeds: [embed] });
        return;
      }

      const balance = await storage.getUserBalance(user.id);
      if (!balance) {
        await message.reply('❌ Could not retrieve balance. Please try again later.');
        return;
      }

      const embed = {
        color: 0x10B981,
        title: '💰 Your Balance',
        fields: [
          {
            name: 'Total Balance',
            value: `${parseFloat(balance.totalBalance).toFixed(2)} SX`,
            inline: true,
          },
          {
            name: 'Earned Balance',
            value: `${parseFloat(balance.earnedBalance).toFixed(2)} SX`,
            inline: true,
          },
          {
            name: 'Bonus Balance',
            value: `${parseFloat(balance.bonusBalance).toFixed(2)} SX`,
            inline: true,
          },
        ],
        footer: {
          text: 'Grow Casino • Balance Check',
        },
        timestamp: new Date().toISOString(),
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling balance command:', error);
      await message.reply('❌ Error checking balance. Please try again later.');
    }
  }

  private async handleAddCommand(message: any) {
    try {
      // Check if user has admin permissions
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('❌ You need administrator permissions to use this command.');
        return;
      }

      const args = message.content.split(' ');
      if (args.length !== 3) {
        await message.reply('❌ Usage: `!add @user <amount>`');
        return;
      }

      const userMention = args[1];
      const amount = parseFloat(args[2]);

      if (isNaN(amount) || amount <= 0) {
        await message.reply('❌ Please provide a valid amount.');
        return;
      }

      // Extract user ID from mention
      const userIdMatch = userMention.match(/^<@!?(\d+)>$/);
      if (!userIdMatch) {
        await message.reply('❌ Please mention a valid user.');
        return;
      }

      const discordUserId = userIdMatch[1];
      
      // Find user by Discord ID
      const [user] = await db.select().from(users).where(eq(users.discordId, discordUserId));
      
      if (!user) {
        await message.reply(`❌ ${userMention} has not linked their Discord account to Grow Casino yet.`);
        return;
      }

      // Get current balance
      const currentBalance = await storage.getUserBalance(user.id);
      if (!currentBalance) {
        await message.reply('❌ Could not retrieve user balance. Please try again later.');
        return;
      }

      // Add the amount to their earned balance (admin bonus)
      const newEarnedBalance = parseFloat(currentBalance.earnedBalance) + amount;
      const newTotalBalance = parseFloat(currentBalance.totalBalance) + amount;

      await storage.updateUserBalance(user.id, {
        earnedBalance: newEarnedBalance.toFixed(2),
        totalBalance: newTotalBalance.toFixed(2),
      });

      // Record transaction
      await storage.createTransaction({
        userId: user.id,
        type: 'bonus',
        amount: amount.toFixed(2),
        balanceAfter: newTotalBalance.toFixed(2),
        gameData: {
          source: 'discord_admin',
          adminUserId: message.author.id,
          adminUsername: message.author.username,
        },
      });

      const embed = {
        color: 0x10B981,
        title: '✅ Balance Added Successfully',
        fields: [
          {
            name: 'User',
            value: `${user.username || user.firstName || user.email}`,
            inline: true,
          },
          {
            name: 'Amount Added',
            value: `${amount.toFixed(2)} SX`,
            inline: true,
          },
          {
            name: 'New Total Balance',
            value: `${newTotalBalance.toFixed(2)} SX`,
            inline: true,
          },
        ],
        footer: {
          text: `Admin Action by ${message.author.username}`,
        },
        timestamp: new Date().toISOString(),
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling add command:', error);
      await message.reply('❌ Error adding balance. Please try again later.');
    }
  }

  private async handleApproveCommand(message: any) {
    try {
      // Check if user has admin permissions
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('❌ You need administrator permissions to use this command.');
        return;
      }

      const args = message.content.split(' ');
      if (args.length !== 2) {
        await message.reply('❌ Usage: `!approve <request_id>`');
        return;
      }

      const requestId = args[1].trim();
      
      // Get the withdrawal request first
      const [existingRequest] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, requestId));
      
      if (!existingRequest) {
        await message.reply('❌ Withdrawal request not found.');
        return;
      }
      
      if (existingRequest.status !== 'pending') {
        await message.reply(`❌ Withdrawal request is already ${existingRequest.status}.`);
        return;
      }
      
      // Get user and their current balance
      const user = await storage.getUser(existingRequest.userId);
      const balance = await storage.getUserBalance(existingRequest.userId);
      
      if (!user || !balance) {
        await message.reply('❌ User or balance not found.');
        return;
      }
      
      const withdrawalAmount = parseFloat(existingRequest.amount);
      const currentEarned = parseFloat(balance.earnedBalance);
      const currentTotal = parseFloat(balance.totalBalance);
      
      // Verify they still have sufficient balance
      if (withdrawalAmount > currentEarned) {
        await message.reply('❌ User no longer has sufficient earned balance for this withdrawal.');
        return;
      }
      
      // Update balances - debit from both earned and total
      await storage.updateUserBalance(existingRequest.userId, {
        earnedBalance: (currentEarned - withdrawalAmount).toFixed(2),
        totalBalance: (currentTotal - withdrawalAmount).toFixed(2),
      });
      
      // Record the withdrawal transaction
      await storage.createTransaction({
        userId: existingRequest.userId,
        type: 'withdrawal',
        amount: (-withdrawalAmount).toFixed(2), // Negative for withdrawal
        balanceAfter: (currentTotal - withdrawalAmount).toFixed(2),
        gameData: {
          withdrawalRequestId: requestId,
          approvedBy: message.author.id,
          approvedByUsername: message.author.username,
        },
      });
      
      // Update withdrawal request status
      const updatedRequest = await storage.updateWithdrawalRequest(requestId, {
        status: 'approved',
        processedAt: new Date(),
      });

      const embed = {
        color: 0x10B981,
        title: '✅ Withdrawal Approved',
        fields: [
          {
            name: 'Request ID',
            value: requestId,
            inline: true,
          },
          {
            name: 'Amount',
            value: `${parseFloat(updatedRequest.amount).toFixed(2)} SX`,
            inline: true,
          },
          {
            name: 'Status',
            value: 'Approved',
            inline: true,
          },
        ],
        footer: {
          text: `Admin Action by ${message.author.username}`,
        },
        timestamp: new Date().toISOString(),
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling approve command:', error);
      await message.reply('❌ Error approving withdrawal. Please check the request ID and try again.');
    }
  }

  private async handleRejectCommand(message: any) {
    try {
      // Check if user has admin permissions
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('❌ You need administrator permissions to use this command.');
        return;
      }

      const args = message.content.split(' ');
      if (args.length !== 2) {
        await message.reply('❌ Usage: `!reject <request_id>`');
        return;
      }

      const requestId = args[1].trim();
      
      // Get the withdrawal request first  
      const [existingRequest] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, requestId));
      
      if (!existingRequest) {
        await message.reply('❌ Withdrawal request not found.');
        return;
      }
      
      if (existingRequest.status !== 'pending') {
        await message.reply(`❌ Withdrawal request is already ${existingRequest.status}.`);
        return;
      }
      
      // Update withdrawal request status (no balance changes needed for rejection)
      const updatedRequest = await storage.updateWithdrawalRequest(requestId, {
        status: 'rejected',
        processedAt: new Date(),
      });
      
      // Record rejection in transaction log for audit
      await storage.createTransaction({
        userId: existingRequest.userId,
        type: 'withdrawal',
        amount: '0.00', // No balance change
        balanceAfter: '0.00', // Will be ignored since amount is 0
        gameData: {
          withdrawalRequestId: requestId,
          rejectedBy: message.author.id,
          rejectedByUsername: message.author.username,
          status: 'rejected',
        },
      });

      const embed = {
        color: 0xEF4444,
        title: '❌ Withdrawal Rejected',
        fields: [
          {
            name: 'Request ID',
            value: requestId,
            inline: true,
          },
          {
            name: 'Amount',
            value: `${parseFloat(updatedRequest.amount).toFixed(2)} SX`,
            inline: true,
          },
          {
            name: 'Status',
            value: 'Rejected',
            inline: true,
          },
        ],
        footer: {
          text: `Admin Action by ${message.author.username}`,
        },
        timestamp: new Date().toISOString(),
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling reject command:', error);
      await message.reply('❌ Error rejecting withdrawal. Please check the request ID and try again.');
    }
  }

  private async handleLinkCommand(message: any) {
    try {
      const discordUserId = message.author.id;
      
      // Check if user is already linked
      const [existingUser] = await db.select().from(users).where(eq(users.discordId, discordUserId));
      
      if (existingUser) {
        const embed = {
          color: 0x10B981,
          title: '✅ Already Linked',
          description: `Your Discord account is already linked to your Grow Casino account.\n\n**Username:** ${existingUser.username || 'Not set yet'}\n**Email:** ${existingUser.email || 'N/A'}\n**Name:** ${existingUser.firstName || 'N/A'}`,
          footer: {
            text: 'Grow Casino • Account Linking',
          },
        };
        await message.reply({ embeds: [embed] });
        return;
      }
      
      // Generate a unique 6-digit code
      const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
      
      // Store the linking code
      this.linkingCodes.set(linkCode, {
        discordUserId,
        expiresAt
      });
      
      // Clean up expired codes
      this.cleanupExpiredCodes();
      
      const embed = {
        color: 0x3B82F6,
        title: '🔗 Link Your Account',
        description: `To link your Discord account to Grow Casino:\n\n1. Log into the website: **https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-domain.replit.app'}**\n2. Go to your dashboard\n3. Enter this code: **${linkCode}**\n\n⏱️ This code expires in 10 minutes.`,
        footer: {
          text: 'Grow Casino • Account Linking',
        },
        timestamp: new Date().toISOString(),
      };
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error handling link command:', error);
      await message.reply('❌ Error generating link code. Please try again later.');
    }
  }

  private cleanupExpiredCodes() {
    const now = Date.now();
    const codesToDelete: string[] = [];
    
    this.linkingCodes.forEach((data, code) => {
      if (now > data.expiresAt) {
        codesToDelete.push(code);
      }
    });
    
    codesToDelete.forEach(code => this.linkingCodes.delete(code));
  }

  public verifyLinkCode(code: string): string | null {
    const linkData = this.linkingCodes.get(code.toUpperCase());
    if (!linkData) return null;
    
    if (Date.now() > linkData.expiresAt) {
      this.linkingCodes.delete(code);
      return null;
    }
    
    // Return the Discord user ID and remove the code (one-time use)
    this.linkingCodes.delete(code);
    return linkData.discordUserId;
  }

  private async handleHelpCommand(message: any) {
    const embed = {
      color: 0x6366F1,
      title: '🤖 Grow Casino Bot Commands',
      fields: [
        {
          name: '!balance',
          value: 'Check your Sheckless (SX) balance',
          inline: false,
        },
        {
          name: '!add @user <amount>',
          value: 'Add SX to a user\'s balance (Admin only)',
          inline: false,
        },
        {
          name: '!approve <request_id>',
          value: 'Approve a withdrawal request (Admin only)',
          inline: false,
        },
        {
          name: '!reject <request_id>',
          value: 'Reject a withdrawal request (Admin only)',
          inline: false,
        },
        {
          name: '!link',
          value: 'Link your Discord account to your Grow Casino account',
          inline: false,
        },
        {
          name: '!help',
          value: 'Show this help message',
          inline: false,
        },
      ],
      footer: {
        text: 'Grow Casino • Sheckless Games',
      },
    };

    await message.reply({ embeds: [embed] });
  }

  async sendWithdrawalNotification(withdrawalRequest: any, user: any) {
    if (!this.isReady || !this.withdrawalChannelId) {
      console.log('Discord bot not ready or withdrawal channel not set');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.withdrawalChannelId);
      if (!channel || !channel.isTextBased()) {
        console.error('Withdrawal channel not found or not text-based');
        return;
      }

      const embed = {
        color: 0xF59E0B,
        title: '💸 New Withdrawal Request',
        fields: [
          {
            name: 'User',
            value: user.username || user.firstName || user.email || 'Unknown',
            inline: true,
          },
          {
            name: 'Amount',
            value: `${parseFloat(withdrawalRequest.amount).toFixed(2)} SX`,
            inline: true,
          },
          {
            name: 'Request ID',
            value: withdrawalRequest.id,
            inline: true,
          },
          {
            name: 'Date',
            value: new Date(withdrawalRequest.createdAt).toLocaleString(),
            inline: false,
          },
        ],
        footer: {
          text: 'Grow Casino • Withdrawal System',
        },
        timestamp: new Date().toISOString(),
      };

      if (channel && 'send' in channel) {
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error sending withdrawal notification:', error);
    }
  }

  setWithdrawalChannel(channelId: string) {
    this.withdrawalChannelId = channelId;
  }

  async start() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      console.warn('DISCORD_TOKEN not provided, Discord bot will not start');
      return;
    }

    try {
      await this.client.login(token);
      
      // Set withdrawal channel if provided
      if (process.env.DISCORD_GUILD_ID) {
        console.log('Discord bot connected to guild:', process.env.DISCORD_GUILD_ID);
        // Note: You can set a specific channel ID for withdrawal notifications if needed
        // this.setWithdrawalChannel('YOUR_CHANNEL_ID');
      }
    } catch (error) {
      console.error('Failed to start Discord bot:', error);
    }
  }

  isOnline(): boolean {
    return this.isReady;
  }
}

let botInstance: DiscordBot | null = null;

export async function setupDiscordBot() {
  if (!botInstance) {
    botInstance = new DiscordBot();
    await botInstance.start();
  }
  return botInstance;
}

export function getDiscordBot(): DiscordBot | null {
  return botInstance;
}
