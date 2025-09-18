import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import UsernameSetup from "@/pages/username-setup";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user, refetch } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : user && !(user as any).isUsernameSet ? (
        // Show username setup if user hasn't chosen a username yet
        <Route path="*">
          {() => (
            <UsernameSetup 
              user={user} 
              onComplete={() => {
                refetch(); // Refresh user data after username is set
              }} 
            />
          )}
        </Route>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
