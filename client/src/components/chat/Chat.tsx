import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    email?: string;
  };
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: initialMessages } = useQuery({
    queryKey: ["/api/chat/messages"],
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, data.payload]);
        } else if (data.type === 'error') {
          toast({
            title: "Chat Error",
            description: data.payload.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, [toast]);

  // Load initial messages
  useEffect(() => {
    if (Array.isArray(initialMessages)) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !user) return;
    
    try {
      socket.send(JSON.stringify({
        type: 'chat_message',
        userId: (user as any)?.id,
        payload: {
          message: newMessage.trim(),
        },
      }));
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Send Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDisplayName = (user: ChatMessage['user']) => {
    return user.firstName || user.email?.split('@')[0] || 'Player';
  };

  const getMessageColor = (userId: string) => {
    // Simple hash function for consistent colors
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['text-primary', 'text-accent', 'text-yellow-500', 'text-purple-400', 'text-pink-400', 'text-indigo-400'];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground">Live Chat</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div 
          ref={chatContainerRef}
          className="chat-container bg-secondary/20 rounded-lg p-3 mb-3 space-y-2 h-64 overflow-y-auto"
          data-testid="chat-messages"
        >
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="text-sm" data-testid={`message-${message.id}`}>
                <span className={`font-medium ${getMessageColor(message.userId)}`}>
                  {formatDisplayName(message.user)}:
                </span>
                <span className="text-foreground ml-2">{message.message}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            maxLength={500}
            className="flex-1 text-sm"
            data-testid="input-chat-message"
          />
          <Button 
            onClick={sendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2"
            data-testid="button-send-message"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Use chat for withdrawal requests or general questions.
        </p>
      </CardContent>
    </Card>
  );
}
