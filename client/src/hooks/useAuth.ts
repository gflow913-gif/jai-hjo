import { useQuery } from "@tanstack/react-query";
import { authClient } from "../lib/authClient";

export function useAuth() {
  // Use react-query to fetch session data
  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => {
      try {
        const result = await authClient.getSession();
        return result;
      } catch (error) {
        console.error("Auth session error:", error);
        return null;
      }
    },
    retry: false,
  });

  return {
    user: session?.data?.user,
    isLoading,
    isAuthenticated: !!session?.data?.user,
    refetch,
  };
}
