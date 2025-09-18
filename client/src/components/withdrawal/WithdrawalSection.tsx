import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface WithdrawalSectionProps {
  balance: any;
  onRefresh: () => void;
}

export default function WithdrawalSection({ balance, onRefresh }: WithdrawalSectionProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { toast } = useToast();

  const { data: withdrawalRequests } = useQuery({
    queryKey: ["/api/withdrawal/requests"],
  });

  const mutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/withdrawal/request', { amount });
      return response.json();
    },
    onSuccess: () => {
      setWithdrawAmount("");
      onRefresh();
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been sent to Discord for admin approval.",
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
        title: "Withdrawal Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalBalance = parseFloat(balance?.totalBalance || '0');
  const earnedBalance = parseFloat(balance?.earnedBalance || '0');
  const bonusBalance = parseFloat(balance?.bonusBalance || '0');
  
  const isEligible = totalBalance >= 10 && earnedBalance >= 10;
  const maxWithdrawable = earnedBalance;

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > maxWithdrawable) {
      toast({
        title: "Amount Too High",
        description: `You can only withdraw up to ${maxWithdrawable.toFixed(1)} SX (earned amount)`,
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(amount);
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">Withdrawal Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 ${
            isEligible 
              ? 'bg-accent/10 border-accent/20' 
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <i className={`fas ${isEligible ? 'fa-check-circle text-accent' : 'fa-exclamation-triangle text-yellow-500'}`}></i>
              <span className={`text-sm font-medium ${isEligible ? 'text-accent' : 'text-yellow-500'}`} data-testid="text-withdrawal-status">
                {isEligible ? 'Eligible to Withdraw' : 'Not Eligible Yet'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEligible 
                ? 'You meet all requirements for withdrawal' 
                : 'Keep playing to meet withdrawal requirements'}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Min Balance (10 SX):</span>
              <span className={`font-medium ${totalBalance >= 10 ? 'text-accent' : 'text-yellow-500'}`}>
                {totalBalance >= 10 ? '✓' : '✗'} {totalBalance.toFixed(1)} SX
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Min Earned (10 SX):</span>
              <span className={`font-medium ${earnedBalance >= 10 ? 'text-accent' : 'text-yellow-500'}`}>
                {earnedBalance >= 10 ? '✓' : '✗'} {earnedBalance.toFixed(1)} SX
              </span>
            </div>
          </div>
          
          {isEligible && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="withdraw-amount" className="text-sm text-muted-foreground">
                  Withdraw Amount (Max: {maxWithdrawable.toFixed(1)} SX)
                </Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={maxWithdrawable}
                  step="0.1"
                  className="mt-1"
                  disabled={mutation.isPending}
                  data-testid="input-withdraw-amount"
                />
              </div>
              <Button 
                onClick={handleWithdrawal}
                disabled={mutation.isPending || !withdrawAmount}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                data-testid="button-request-withdrawal"
              >
                {mutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Request Withdrawal
                  </>
                )}
              </Button>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Withdrawals are processed within 24 hours via Discord.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
