import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-seedling text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Grow Casino</h1>
                <p className="text-xl text-muted-foreground">Sheckless Games</p>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Welcome to the Garden's Premier Casino
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Test your luck with Sheckless (SX) in our exciting games. 
              Get 5 SX just for joining and start winning today!
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card border border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-coins text-primary text-xl"></i>
                </div>
                <CardTitle className="text-xl">5 SX Joining Bonus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Start playing immediately with your free 5 Sheckless bonus. No deposit required!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-gamepad text-accent text-xl"></i>
                </div>
                <CardTitle className="text-xl">Three Exciting Games</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Coin flip, dice roll, and roulette. Fair RNG ensures every game is random and exciting.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-money-bill-wave text-yellow-500 text-xl"></i>
                </div>
                <CardTitle className="text-xl">Easy Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Withdraw your winnings easily. Just need 10 SX earned through gambling to be eligible.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Game Previews */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-6">Available Games</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-secondary/30 border border-border rounded-lg p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center glow-effect">
                  <i className="fas fa-coins text-white text-2xl"></i>
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">Coin Flip</h4>
                <p className="text-sm text-muted-foreground mb-3">50/50 chance • 2x multiplier</p>
                <p className="text-xs text-muted-foreground">Choose heads or tails and double your bet!</p>
              </div>

              <div className="bg-secondary/30 border border-border rounded-lg p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center glow-effect">
                  <i className="fas fa-dice text-white text-2xl"></i>
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">Dice Roll</h4>
                <p className="text-sm text-muted-foreground mb-3">Pick 1-6 • 6x multiplier</p>
                <p className="text-xs text-muted-foreground">Guess the dice roll for massive wins!</p>
              </div>

              <div className="bg-secondary/30 border border-border rounded-lg p-6">
                <div className="w-16 h-16 mx-auto mb-4 roulette-wheel rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-2 bg-secondary rounded-full flex items-center justify-center">
                    <i className="fas fa-circle text-white text-sm"></i>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">Roulette</h4>
                <p className="text-sm text-muted-foreground mb-3">Red or Black • 2x multiplier</p>
                <p className="text-xs text-muted-foreground">Classic casino game with great odds!</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Start Playing?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of players in the Grow a Garden casino experience. 
              Get your 5 SX bonus and start winning today!
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => window.location.href = '/api/auth/google'}
              data-testid="button-login"
            >
              <i className="fab fa-google mr-2"></i>
              Login with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
