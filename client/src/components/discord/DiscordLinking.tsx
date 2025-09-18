import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface DiscordLinkingProps {
  user: any;
  onUpdate: () => void;
}

export default function DiscordLinking({ user, onUpdate }: DiscordLinkingProps) {
  const [linkCode, setLinkCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const linkDiscordMutation = useMutation({
    mutationFn: (linkCode: string) => 
      apiRequest('/api/auth/discord/link', 'POST', { linkCode }),
    onSuccess: () => {
      toast({
        title: "Discord Linked!",
        description: "Your Discord account has been successfully linked to your casino account.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLinkCode("");
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Linking Failed",
        description: error.message || "Failed to link Discord account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter the linking code from Discord",
        variant: "destructive",
      });
      return;
    }
    
    linkDiscordMutation.mutate(linkCode.trim());
  };

  const isLinked = user.discordId;

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fab fa-discord text-[#5865F2]"></i>
          Discord Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLinked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-400 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Discord Linked</p>
                <p className="text-xs text-muted-foreground">
                  Your Discord account is connected to your casino account
                </p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="mb-2"><strong>Available Discord Commands:</strong></p>
              <ul className="space-y-1 text-xs">
                <li>• <code className="bg-secondary px-1 py-0.5 rounded">!balance</code> - Check your SX balance</li>
                <li>• <code className="bg-secondary px-1 py-0.5 rounded">!link</code> - Get account linking code</li>
                <li>• <code className="bg-secondary px-1 py-0.5 rounded">!help</code> - View all commands</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-3">Link your Discord account to:</p>
              <ul className="space-y-1 text-xs">
                <li>• Check your balance with <code className="bg-secondary px-1 py-0.5 rounded">!balance</code></li>
                <li>• Receive admin bonuses via <code className="bg-secondary px-1 py-0.5 rounded">!add</code></li>
                <li>• Get withdrawal notifications</li>
              </ul>
            </div>
            
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start gap-2">
                <i className="fas fa-info-circle text-blue-400 text-sm mt-0.5"></i>
                <div className="text-xs">
                  <p className="font-medium text-blue-300 mb-1">How to link:</p>
                  <ol className="space-y-1 text-blue-200/80">
                    <li>1. Join the Discord server</li>
                    <li>2. Send <code className="bg-blue-900/30 px-1 py-0.5 rounded">!link</code> in any channel</li>
                    <li>3. Copy the code from the bot's response</li>
                    <li>4. Paste it below and click "Link Account"</li>
                  </ol>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="link-code" className="text-sm">
                  Discord Link Code
                </Label>
                <Input
                  id="link-code"
                  type="text"
                  placeholder="Enter code from Discord bot"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  className="bg-background border-border text-foreground"
                  maxLength={6}
                  data-testid="input-discord-link-code"
                />
              </div>
              
              <Button
                type="submit"
                disabled={linkDiscordMutation.isPending || !linkCode.trim()}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                data-testid="button-link-discord"
              >
                {linkDiscordMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Linking...
                  </>
                ) : (
                  <>
                    <i className="fab fa-discord mr-2"></i>
                    Link Discord Account
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}