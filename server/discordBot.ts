import { Client, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import { storage } from "./storage";
import { eq } from "drizzle-orm";

class DiscordBot {
  private client: Client;
  private isReady = false;
  private withdrawalChannelId: string | null = null;

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
    this.client.once('ready', () => {
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
      // Try to find user by Discord ID (you'd need to implement Discord linking)
      const discordUserId = message.author.id;
      
      // For now, show generic message since Discord linking isn't implemented
      const embed = {
        color: 0x3B82F6,
        title: '💰 Balance Check',
        description: `To check your balance, please log into the web application.\n\n**Commands:**\n\`!balance\` - Check your balance\n\`!add @user <amount>\` - Add SX to user (Admin only)\n\`!help\` - Show this help`,
        footer: {
          text: 'Grow Casino • Sheckless Games',
        },
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

      // Note: In a full implementation, you'd need a Discord-to-User mapping table
      // For now, we'll show a success message but won't actually add balance

      const embed = {
        color: 0x10B981,
        title: '✅ Balance Added',
        description: `Would add ${amount} SX to ${userMention}'s balance.\n\n*Note: Discord user linking not implemented yet. Users must use the web interface.*`,
        footer: {
          text: 'Grow Casino • Admin Action',
        },
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling add command:', error);
      await message.reply('❌ Error adding balance. Please try again later.');
    }
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
            value: user.firstName || user.email || 'Unknown',
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

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending withdrawal notification:', error);
    }
  }

  setWithdrawalChannel(channelId: string) {
    this.withdrawalChannelId = channelId;
  }

  async start() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.warn('DISCORD_BOT_TOKEN not provided, Discord bot will not start');
      return;
    }

    try {
      await this.client.login(token);
      
      // Set withdrawal channel if provided
      if (process.env.DISCORD_WITHDRAWAL_CHANNEL_ID) {
        this.setWithdrawalChannel(process.env.DISCORD_WITHDRAWAL_CHANNEL_ID);
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
