import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface RouletteProps {
  balance: number;
  onGameComplete: () => void;
}

export default function Roulette({ balance, onGameComplete }: RouletteProps) {
  const [betAmount, setBetAmount] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<'red' | 'black' | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ amount, choice }: { amount: number; choice: 'red' | 'black' }) => {
      const response = await apiRequest('POST', '/api/games/roulette', { amount, choice });
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
          ? `Great! The ball landed on ${result.result} ${result.number} and you won ${result.winnings.toFixed(1)} SX!`
          : `The ball landed on ${result.result} ${result.number}. Better luck next time!`,
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

  const handleBet = (choice: 'red' | 'black') => {
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
        <div className="w-16 h-16 mx-auto mb-3 roulette-wheel rounded-full flex items-center justify-center relative">
          <div className="absolute inset-2 bg-secondary rounded-full flex items-center justify-center">
            <i className="fas fa-circle text-white text-sm"></i>
          </div>
        </div>
        <h4 className="text-lg font-bold text-foreground">Roulette</h4>
        <p className="text-sm text-muted-foreground">Red or Black</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="roulette-bet-amount" className="text-sm text-muted-foreground">
            Bet Amount
          </Label>
          <Input
            id="roulette-bet-amount"
            type="number"
            placeholder="Enter amount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            max={balance}
            step="0.1"
            className="mt-1"
            disabled={mutation.isPending}
            data-testid="input-roulette-bet-amount"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleBet('red')}
            disabled={mutation.isPending || !betAmount}
            className="bg-red-500 hover:bg-red-600 text-white"
            data-testid="button-roulette-red"
          >
            {mutation.isPending && selectedChoice === 'red' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : null}
            Red
          </Button>
          <Button
            onClick={() => handleBet('black')}
            disabled={mutation.isPending || !betAmount}
            className="bg-gray-800 hover:bg-gray-900 text-white"
            data-testid="button-roulette-black"
          >
            {mutation.isPending && selectedChoice === 'black' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : null}
            Black
          </Button>
        </div>
        
        {lastResult && (
          <div className="text-xs text-center text-muted-foreground" data-testid="text-roulette-last-result">
            Last: {lastResult.result} {lastResult.number} - {lastResult.won ? `Won ${lastResult.winnings.toFixed(1)} SX` : 'Lost'}
          </div>
        )}
      </div>
    </div>
  );
}
