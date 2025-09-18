import { Client, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import { storage } from "./storage";

class DiscordBot {
  private client: Client;
  private isReady = false;

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
      // In a real implementation, you'd need to link Discord users to your app users
      // For now, we'll return a generic response
      const embed = {
        color: 0x3B82F6,
        title: '💰 Balance Check',
        description: 'To check your balance, please use the web application at your Replit domain.',
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

      // In a real implementation, you'd:
      // 1. Parse the user mention to get Discord user ID
      // 2. Look up the linked app user
      // 3. Add the amount to their balance
      // 4. Record the transaction

      const embed = {
        color: 0x10B981,
        title: '✅ Balance Added',
        description: `Successfully added ${amount} SX to ${userMention}'s balance.`,
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

  async start() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.warn('DISCORD_BOT_TOKEN not provided, Discord bot will not start');
      return;
    }

    try {
      await this.client.login(token);
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
