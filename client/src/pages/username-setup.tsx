import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface UsernameSetupProps {
  user: any;
  onComplete: () => void;
}

export default function UsernameSetup({ user, onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setUsernameMutation = useMutation({
    mutationFn: (username: string) => 
      apiRequest('/api/auth/set-username', 'POST', { username }),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your username has been set. Welcome to Grow Casino!",
        variant: "default",
      });
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set username",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim().length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (username.trim().length > 20) {
      toast({
        title: "Username Too Long",
        description: "Username must be less than 20 characters",
        variant: "destructive",
      });
      return;
    }
    
    // Check for valid characters (alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      toast({
        title: "Invalid Characters",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      });
      return;
    }

    setUsernameMutation.mutate(username.trim());
  };

  const generateSuggestion = () => {
    const adjectives = ['Lucky', 'Crypto', 'Diamond', 'Golden', 'Elite', 'Master', 'Royal', 'Alpha'];
    const nouns = ['Player', 'Gamer', 'Winner', 'Trader', 'King', 'Legend', 'Boss', 'Pro'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 999) + 1;
    
    return `${randomAdj}${randomNoun}${randomNum}`;
  };

  const handleSuggestion = () => {
    setUsername(generateSuggestion());
  };

  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card border border-border shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <i className="fas fa-user-edit text-primary text-2xl"></i>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Choose Your Casino Name
            </CardTitle>
            <p className="text-muted-foreground">
              Welcome {user.firstName}! Pick a username for Grow Casino
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your casino username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border text-foreground"
                  maxLength={20}
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleSuggestion}
                className="w-full"
                data-testid="button-suggest-username"
              >
                <i className="fas fa-dice mr-2"></i>
                Suggest Random Name
              </Button>
              
              <Button
                type="submit"
                disabled={setUsernameMutation.isPending || username.trim().length < 3}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-set-username"
              >
                {setUsernameMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Setting Username...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Set Username & Continue
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Your username will be shown in games, chat, and leaderboards
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}