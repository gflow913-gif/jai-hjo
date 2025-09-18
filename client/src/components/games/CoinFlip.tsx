import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CoinFlipProps {
  balance: number;
  onGameComplete: () => void;
}

export default function CoinFlip({ balance, onGameComplete }: CoinFlipProps) {
  const [betAmount, setBetAmount] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<'heads' | 'tails' | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ amount, choice }: { amount: number; choice: 'heads' | 'tails' }) => {
      const response = await apiRequest('POST', '/api/games/coin-flip', { amount, choice });
      return response.json();
    },
    onSuccess: (result) => {
      setLastResult(result);
      setBetAmount("");
      setSelectedChoice(null);
      onGameComplete();
      
      toast({
        title: result.won ? "🎉 You Won!" : "😔 You Lost",
        description: result.won 
          ? `Congratulations! You won ${result.winnings.toFixed(1)} SX on ${result.result}!`
          : `Sorry, it was ${result.result}. Better luck next time!`,
        variant: result.won ? "default" : "destructive",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Game Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBet = (choice: 'heads' | 'tails') => {
    const amount = parseFloat(betAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough SX for this bet",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate({ amount, choice });
  };

  return (
    <div className="bg-secondary/30 border border-border rounded-lg p-4">
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center glow-effect">
          <i className="fas fa-coins text-white text-2xl"></i>
        </div>
        <h4 className="text-lg font-bold text-foreground">Coin Flip</h4>
        <p className="text-sm text-muted-foreground">50/50 chance</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="coin-bet-amount" className="text-sm text-muted-foreground">
            Bet Amount
          </Label>
          <Input
            id="coin-bet-amount"
            type="number"
            placeholder="Enter amount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            max={balance}
            step="0.1"
            className="mt-1"
            disabled={mutation.isPending}
            data-testid="input-coin-bet-amount"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleBet('heads')}
            disabled={mutation.isPending || !betAmount}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-coin-heads"
          >
            {mutation.isPending && selectedChoice === 'heads' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <i className="fas fa-circle mr-2"></i>
            )}
            Heads
          </Button>
          <Button
            onClick={() => handleBet('tails')}
            disabled={mutation.isPending || !betAmount}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            data-testid="button-coin-tails"
          >
            {mutation.isPending && selectedChoice === 'tails' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <i className="fas fa-times mr-2"></i>
            )}
            Tails
          </Button>
        </div>
        
        {lastResult && (
          <div className="text-xs text-center text-muted-foreground" data-testid="text-coin-last-result">
            Last: {lastResult.result} - {lastResult.won ? `Won ${lastResult.winnings.toFixed(1)} SX` : 'Lost'}
          </div>
        )}
      </div>
    </div>
  );
}
