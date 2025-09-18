import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface DiceRollProps {
  balance: number;
  onGameComplete: () => void;
}

export default function DiceRoll({ balance, onGameComplete }: DiceRollProps) {
  const [betAmount, setBetAmount] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ amount, choice }: { amount: number; choice: number }) => {
      const response = await apiRequest('POST', '/api/games/dice-roll', { amount, choice });
      return response.json();
    },
    onSuccess: (result) => {
      setLastResult(result);
      setBetAmount("");
      setSelectedNumber(null);
      onGameComplete();
      
      toast({
        title: result.won ? "🎉 You Won!" : "😔 You Lost",
        description: result.won 
          ? `Amazing! You guessed ${result.result} correctly and won ${result.winnings.toFixed(1)} SX!`
          : `The dice rolled ${result.result}. Better luck next time!`,
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

  const handleRollDice = () => {
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
    
    if (!selectedNumber) {
      toast({
        title: "No Number Selected",
        description: "Please select a number from 1-6",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate({ amount, choice: selectedNumber });
  };

  return (
    <div className="bg-secondary/30 border border-border rounded-lg p-4">
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center glow-effect">
          <i className="fas fa-dice text-white text-2xl"></i>
        </div>
        <h4 className="text-lg font-bold text-foreground">Dice Roll</h4>
        <p className="text-sm text-muted-foreground">Pick 1-6</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="dice-bet-amount" className="text-sm text-muted-foreground">
            Bet Amount
          </Label>
          <Input
            id="dice-bet-amount"
            type="number"
            placeholder="Enter amount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            max={balance}
            step="0.1"
            className="mt-1"
            disabled={mutation.isPending}
            data-testid="input-dice-bet-amount"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <Button
              key={num}
              variant={selectedNumber === num ? "default" : "secondary"}
              className={`aspect-square font-bold transition-colors ${
                selectedNumber === num 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-primary text-muted-foreground hover:text-primary-foreground'
              }`}
              onClick={() => setSelectedNumber(num)}
              disabled={mutation.isPending}
              data-testid={`button-dice-${num}`}
            >
              {num}
            </Button>
          ))}
        </div>
        
        <Button
          onClick={handleRollDice}
          disabled={mutation.isPending || !betAmount || !selectedNumber}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          data-testid="button-roll-dice"
        >
          {mutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Rolling...
            </>
          ) : (
            'Roll Dice'
          )}
        </Button>
        
        {lastResult && (
          <div className="text-xs text-center text-muted-foreground" data-testid="text-dice-last-result">
            Last: {lastResult.result} - {lastResult.won ? `Won ${lastResult.winnings.toFixed(1)} SX` : 'Lost'}
          </div>
        )}
      </div>
    </div>
  );
}
