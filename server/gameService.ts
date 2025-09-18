import { storage } from "./storage";
import { randomBytes } from "crypto";

interface GameResult {
  won: boolean;
  result: any;
  winnings: number;
  newBalance: number;
}

class GameService {
  private generateSecureRandom(max: number): number {
    const randomBuffer = randomBytes(4);
    const randomValue = randomBuffer.readUInt32BE(0);
    return Math.floor((randomValue / 0xFFFFFFFF) * max);
  }

  private async processGameResult(
    userId: string,
    betAmount: number,
    winnings: number,
    gameType: 'coin_flip' | 'dice_roll' | 'roulette',
    gameData: any
  ): Promise<GameResult> {
    const balance = await storage.getUserBalance(userId);
    if (!balance) {
      throw new Error("User balance not found");
    }

    const currentTotal = parseFloat(balance.totalBalance);
    const currentEarned = parseFloat(balance.earnedBalance);
    
    // Check if user has enough balance
    if (currentTotal < betAmount) {
      throw new Error("Insufficient balance");
    }

    // Calculate new balances
    const netGain = winnings - betAmount;
    const newTotal = currentTotal + netGain;
    const newEarned = winnings > 0 ? currentEarned + winnings : currentEarned;

    // Update balance
    await storage.updateUserBalance(userId, {
      totalBalance: newTotal.toFixed(2),
      earnedBalance: newEarned.toFixed(2),
    });

    // Record bet transaction
    await storage.createTransaction({
      userId,
      type: 'bet',
      gameType,
      amount: (-betAmount).toString(),
      balanceAfter: (currentTotal - betAmount).toFixed(2),
      gameData,
    });

    // Record win transaction if applicable
    if (winnings > 0) {
      await storage.createTransaction({
        userId,
        type: 'win',
        gameType,
        amount: winnings.toString(),
        balanceAfter: newTotal.toFixed(2),
        gameData,
      });
    } else {
      await storage.createTransaction({
        userId,
        type: 'loss',
        gameType,
        amount: '0',
        balanceAfter: newTotal.toFixed(2),
        gameData,
      });
    }

    return {
      won: winnings > 0,
      result: gameData.result,
      winnings,
      newBalance: newTotal,
    };
  }

  async playCoinFlip(userId: string, betAmount: number, choice: 'heads' | 'tails'): Promise<GameResult> {
    const result = this.generateSecureRandom(2) === 0 ? 'heads' : 'tails';
    const won = result === choice;
    const winnings = won ? betAmount * 2 : 0;

    const gameData = {
      choice,
      result,
      multiplier: 2,
    };

    return this.processGameResult(userId, betAmount, winnings, 'coin_flip', gameData);
  }

  async playDiceRoll(userId: string, betAmount: number, choice: number): Promise<GameResult> {
    const result = this.generateSecureRandom(6) + 1; // 1-6
    const won = result === choice;
    const winnings = won ? betAmount * 6 : 0;

    const gameData = {
      choice,
      result,
      multiplier: 6,
    };

    return this.processGameResult(userId, betAmount, winnings, 'dice_roll', gameData);
  }

  async playRoulette(userId: string, betAmount: number, choice: 'red' | 'black'): Promise<GameResult> {
    // Roulette wheel with 18 red, 18 black, 2 green (0, 00)
    const number = this.generateSecureRandom(38); // 0-37
    let result: 'red' | 'black' | 'green';
    
    if (number === 0 || number === 37) { // 0 and 00 (green)
      result = 'green';
    } else if ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number)) {
      result = 'red';
    } else {
      result = 'black';
    }

    const won = result === choice;
    const winnings = won ? betAmount * 2 : 0;

    const gameData = {
      choice,
      result,
      number,
      multiplier: 2,
    };

    return this.processGameResult(userId, betAmount, winnings, 'roulette', gameData);
  }
}

export const gameService = new GameService();
