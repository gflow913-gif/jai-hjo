# Grow Casino - Roblox Gambling Website

A comprehensive gambling website for the Roblox game "Grow a Garden" using virtual currency called Sheckless (SX).

## Features

### 🎮 **Gaming System**
- **Coin Flip**: 50/50 chance, 2x multiplier
- **Dice Roll**: Pick 1-6, 6x multiplier  
- **Roulette**: Red or Black, 2x multiplier
- Fair RNG using Node.js crypto module

### 💰 **Balance System**
- 5 SX joining bonus for new users
- Separate tracking of earned vs bonus balance
- Withdrawal eligibility: 10 SX total + 10 SX earned

### 🔐 **Authentication**
- Replit Auth integration
- Session-based authentication
- Secure API endpoints

### 💬 **Real-time Chat**
- WebSocket-based chat system
- User communication and withdrawal requests

### 🤖 **Discord Bot**
- `!balance` - Check balance
- `!add @user <amount>` - Add SX (Admin only)
- `!help` - Show commands
- Withdrawal request notifications

### 📊 **Dashboard**
- Balance overview with earned/bonus breakdown
- Game statistics and history
- Withdrawal status and eligibility
- Real-time transaction history

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Real-time**: WebSockets
- **Authentication**: Replit Auth
- **Bot**: Discord.js

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/grow_casino

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-here

# Replit Auth (automatically provided in Replit)
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.replit.dev

# Discord Bot (optional)
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_WITHDRAWAL_CHANNEL_ID=your-withdrawal-channel-id

# Port
PORT=5000
```

### 2. Database Setup

1. Create a PostgreSQL database
2. Run database migrations:
```bash
npm run db:push
```

### 3. Discord Bot Setup (Optional)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token to your `.env` file
4. Invite the bot to your server with appropriate permissions
5. Set the withdrawal channel ID in your `.env` file

### 4. Installation & Running

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build
npm start

# Database operations
npm run db:push  # Push schema changes
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── games/     # Game components
│   │   │   ├── chat/      # Chat system
│   │   │   ├── withdrawal/# Withdrawal system
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   └── index.html
├── server/                # Express.js backend
│   ├── routes.ts          # API routes
│   ├── gameService.ts     # Game logic & RNG
│   ├── discordBot.ts      # Discord bot
│   ├── storage.ts         # Database operations
│   ├── replitAuth.ts      # Authentication
│   └── index.ts           # Server entry point
├── shared/                # Shared types & schemas
│   └── schema.ts          # Database schema
└── migrations/            # Database migrations
```

## Game Logic

### Fair Random Number Generation
All games use Node.js `crypto.randomBytes()` for cryptographically secure randomness:

```typescript
private generateSecureRandom(max: number): number {
  const randomBuffer = randomBytes(4);
  const randomValue = randomBuffer.readUInt32BE(0);
  return Math.floor((randomValue / 0xFFFFFFFF) * max);
}
```

### Game Rules

**Coin Flip**
- Choose heads or tails
- 50% win chance
- 2x multiplier on win

**Dice Roll**
- Pick number 1-6
- 16.67% win chance (1/6)
- 6x multiplier on win

**Roulette**
- Choose red or black
- 47.37% win chance (18/38, accounting for green 0 and 00)
- 2x multiplier on win

## Security Features

- **Input Validation**: Zod schemas for all inputs
- **Authentication**: Session-based auth with HTTP-only cookies
- **Balance Separation**: Bonus vs earned balance tracking
- **Fair Gaming**: Cryptographically secure RNG
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **Rate Limiting**: Built-in Express rate limiting

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Login with Replit Auth
- `GET /api/logout` - Logout

### Games
- `POST /api/games/coin-flip` - Play coin flip
- `POST /api/games/dice-roll` - Play dice roll
- `POST /api/games/roulette` - Play roulette

### Balance & Transactions
- `GET /api/balance` - Get user balance
- `GET /api/transactions` - Get transaction history

### Withdrawals
- `POST /api/withdrawal/request` - Request withdrawal
- `GET /api/withdrawal/requests` - Get withdrawal history

### Chat
- `GET /api/chat/messages` - Get recent messages
- WebSocket `/ws` - Real-time chat

## Discord Bot Commands

- `!balance` - Check your balance (shows web app link)
- `!add @user <amount>` - Add SX to user balance (Admin only)
- `!help` - Show available commands

## Database Schema

### Users
- Authentication data (required for Replit Auth)
- Profile information

### User Balances
- `totalBalance` - Total SX available
- `earnedBalance` - SX earned through gambling
- `bonusBalance` - Joining bonus (5 SX)

### Transactions
- Complete history of all balance changes
- Game data and results
- Transaction types: bet, win, loss, withdrawal, bonus

### Chat Messages
- Real-time chat history
- User associations

### Withdrawal Requests
- Withdrawal tracking and approval workflow
- Discord integration for admin notifications

## Withdrawal Rules

Users can withdraw only when:
1. Total balance ≥ 10 SX
2. Earned balance ≥ 10 SX (joining bonus alone cannot be withdrawn)

This prevents abuse of the joining bonus system while allowing legitimate players to withdraw their winnings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support or questions, join our Discord server or create an issue on GitHub.