import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import CoinFlip from "@/components/games/CoinFlip";
import DiceRoll from "@/components/games/DiceRoll";
import Roulette from "@/components/games/Roulette";
import WithdrawalSection from "@/components/withdrawal/WithdrawalSection";
import Chat from "@/components/chat/Chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: userWithBalance, refetch: refetchUser } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated,
  });

  const queryClient = useQueryClient();

  const handleGameComplete = () => {
    refetchUser();
    refetchTransactions();
    // Also invalidate the cache to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !userWithBalance) {
    return (
      <div className="min-h-screen bg-background gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your casino...</p>
        </div>
      </div>
    );
  }

  const balance = (userWithBalance as any)?.balance || {};
  const totalBalance = parseFloat(balance?.totalBalance || '0');
  const earnedBalance = parseFloat(balance?.earnedBalance || '0');
  const bonusBalance = parseFloat(balance?.bonusBalance || '0');
  
  // Calculate stats from transactions
  const transactionsList = Array.isArray(transactions) ? transactions : [];
  const wins = transactionsList.filter((t: any) => t.type === 'win').length || 0;
  const totalGames = transactionsList.filter((t: any) => t.type === 'bet').length || 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const biggestWin = transactionsList.filter((t: any) => t.type === 'win')
    .reduce((max: number, t: any) => Math.max(max, parseFloat(t.amount)), 0) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg">
      <div className="flex min-h-screen">
        <Sidebar 
          user={userWithBalance} 
          balance={balance}
          onRefresh={refetchUser}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Mobile Header */}
          <header className="bg-card border-b border-border p-4 lg:hidden">
            <div className="flex items-center justify-between">
              <button className="text-foreground">
                <i className="fas fa-bars text-xl"></i>
              </button>
              <h1 className="text-lg font-bold">Grow Casino</h1>
              <div className="text-accent font-bold" data-testid="text-balance-mobile">
                {totalBalance.toFixed(1)} SX
              </div>
            </div>
          </header>
          
          <div className="p-6 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="text-welcome">
                Welcome back, {(userWithBalance as any)?.firstName || 'Player'}!
              </h2>
              <p className="text-muted-foreground mb-6">
                {earnedBalance >= 10 && totalBalance >= 10 
                  ? "Ready to test your luck? Your withdrawal is ready!" 
                  : "Keep playing to unlock withdrawals!"}
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-card border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-coins text-accent"></i>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Wins</p>
                        <p className="text-xl font-bold text-foreground" data-testid="text-total-wins">
                          {wins}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-trophy text-primary"></i>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-xl font-bold text-foreground" data-testid="text-win-rate">
                          {winRate}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-chart-line text-yellow-500"></i>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Biggest Win</p>
                        <p className="text-xl font-bold text-foreground" data-testid="text-biggest-win">
                          {biggestWin.toFixed(1)} SX
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-fire text-red-500"></i>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Games Played</p>
                        <p className="text-xl font-bold text-foreground" data-testid="text-games-played">
                          {totalGames}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Games Section */}
              <div className="xl:col-span-2 space-y-6">
                {/* Gambling Games */}
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-foreground">Gambling Games</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <CoinFlip balance={totalBalance} onGameComplete={handleGameComplete} />
                      <DiceRoll balance={totalBalance} onGameComplete={handleGameComplete} />
                      <Roulette balance={totalBalance} onGameComplete={handleGameComplete} />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Activity */}
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {transactionsList.slice(0, 5).map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg" data-testid={`transaction-${transaction.id}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              transaction.type === 'win' ? 'bg-accent/10' : 'bg-destructive/10'
                            }`}>
                              <i className={`fas ${
                                transaction.gameType === 'coin_flip' ? 'fa-coins' :
                                transaction.gameType === 'dice_roll' ? 'fa-dice' :
                                transaction.gameType === 'roulette' ? 'fa-circle' : 'fa-money-bill'
                              } ${transaction.type === 'win' ? 'text-accent' : 'text-destructive'} text-sm`}></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {transaction.gameType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Transaction'} - {transaction.type}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              parseFloat(transaction.amount) > 0 ? 'text-accent' : 'text-destructive'
                            }`}>
                              {parseFloat(transaction.amount) > 0 ? '+' : ''}{parseFloat(transaction.amount).toFixed(1)} SX
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.type === 'win' ? 'Won' : transaction.type === 'bet' ? 'Bet' : 'Lost'}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {!transactionsList.length && (
                        <p className="text-center text-muted-foreground py-8">
                          No transactions yet. Start playing to see your activity!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Sidebar */}
              <div className="space-y-6">
                <WithdrawalSection 
                  balance={balance}
                  onRefresh={refetchUser}
                />
                
                {/* Discord Bot Info */}
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-foreground">Discord Bot</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                        <span className="text-sm text-accent font-medium">Bot Online</span>
                      </div>
                      
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-foreground mb-2">Available Commands:</h4>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="bg-muted/50 rounded px-2 py-1">
                            <span className="text-primary">!balance</span>
                            <span className="text-muted-foreground ml-2">Check your SX balance</span>
                          </div>
                          <div className="bg-muted/50 rounded px-2 py-1">
                            <span className="text-primary">!add @user &lt;amount&gt;</span>
                            <span className="text-muted-foreground ml-2">Admin only</span>
                          </div>
                          <div className="bg-muted/50 rounded px-2 py-1">
                            <span className="text-primary">!help</span>
                            <span className="text-muted-foreground ml-2">Show all commands</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-medium transition-colors"
                        onClick={() => window.open('https://discord.gg/your-invite', '_blank')}
                        data-testid="button-discord-invite"
                      >
                        <i className="fab fa-discord mr-2"></i>Join Discord Server
                      </button>
                    </div>
                  </CardContent>
                </Card>
                
                <Chat />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
