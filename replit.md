# Overview

This is a Roblox-related gambling website called "Grow Casino" designed for the game "Grow a Garden" using a virtual currency called Sheckless (SX). The platform allows users to gamble their virtual currency in simple games like coin flip, dice roll, and roulette while maintaining strict withdrawal rules that require users to earn at least 10 SX through gambling activities (joining bonus alone cannot be withdrawn).

The application follows a full-stack architecture with a React frontend, Express.js backend, PostgreSQL database with Drizzle ORM, real-time chat functionality via WebSockets, and Discord bot integration for administrative currency management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live chat functionality

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth integration with session-based authentication using express-session
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Real-time Features**: WebSocket server for chat functionality
- **Game Logic**: Secure random number generation using Node.js crypto module for fair gambling

## Database Design
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Structure**:
  - Users table (mandatory for Replit Auth)
  - User balances with separate tracking for total, earned, and bonus amounts
  - Transactions table for comprehensive betting history
  - Chat messages with user relationships
  - Withdrawal requests with approval workflow
  - Sessions table for authentication state

## Security & Game Integrity
- **Fair Gaming**: Cryptographically secure random number generation for all game outcomes
- **Balance Separation**: Distinct tracking of joining bonus vs. earned balance to prevent bonus-only withdrawals
- **Input Validation**: Comprehensive validation using Zod schemas
- **Authentication**: Secure session management with HTTP-only cookies
- **Authorization**: Protected API endpoints with authentication middleware

## External Integrations
- **Discord Bot**: Administrative interface for currency management with role-based permissions
- **Real-time Chat**: WebSocket-based chat system for user communication and withdrawal requests
- **Replit Auth**: Integrated authentication system for seamless user onboarding

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and migrations
- **express**: Web framework for REST API and server functionality
- **discord.js**: Discord bot library for administrative currency management
- **ws**: WebSocket library for real-time chat functionality

## Frontend UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives for consistent design
- **@tanstack/react-query**: Server state management and caching solution
- **wouter**: Lightweight routing library for single-page application navigation
- **tailwindcss**: Utility-first CSS framework for responsive design
- **class-variance-authority**: Type-safe variant management for component styling

## Authentication & Session Management
- **openid-client**: OpenID Connect client for Replit Auth integration
- **passport**: Authentication middleware for Express.js
- **express-session**: Session management with PostgreSQL store
- **connect-pg-simple**: PostgreSQL session store for persistent authentication

## Development & Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **tsx**: TypeScript execution engine for development
- **esbuild**: Fast JavaScript bundler for production builds