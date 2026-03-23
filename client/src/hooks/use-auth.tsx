import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";
import { v1Fetch, v1Post, setTokens, clearTokens, getAccessToken } from "@/lib/v1Api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: string, idToken: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateOfBirth?: string;
  smsConsent?: boolean;
  cityGroupIds?: number[];
  otherGroup?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const result = await v1Fetch<User>("/api/v1/auth/me");
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setUser(null);
        clearTokens();
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await v1Post("/api/v1/auth/login", { email, password });
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
      setUser(result.data.user);

      // Auto-bridge JWT to session for admin users so admin dashboard works
      const roles: string[] = result.data.user.roles || [];
      if (roles.includes("admin") || roles.includes("super_admin")) {
        try {
          await fetch("/api/auth/bridge", {
            method: "POST",
            headers: { Authorization: `Bearer ${result.data.accessToken}` },
            credentials: "include",
          });
          // Invalidate cached auth state so admin dashboard loads fresh
          const { queryClient } = await import("@/lib/queryClient");
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        } catch {}
      }

      return { success: true };
    }
    return { success: false, error: result.error || "Login failed" };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const result = await v1Post("/api/v1/auth/register", data);
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
      setUser(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error || "Registration failed" };
  }, []);

  const socialLogin = useCallback(async (provider: string, idToken: string, fullName?: string) => {
    const body: Record<string, string> = { provider, idToken };
    if (fullName) body.fullName = fullName;
    const result = await v1Post("/api/v1/auth/social", body);
    if (result.success && result.data) {
      setTokens(result.data.accessToken, result.data.refreshToken);
      setUser(result.data.user);

      // Auto-bridge JWT to session for admin users so admin dashboard works
      const roles: string[] = result.data.user.roles || [];
      if (roles.includes("admin") || roles.includes("super_admin")) {
        try {
          await fetch("/api/auth/bridge", {
            method: "POST",
            headers: { Authorization: `Bearer ${result.data.accessToken}` },
            credentials: "include",
          });
          const { queryClient } = await import("@/lib/queryClient");
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        } catch {}
      }

      return { success: true };
    }
    return { success: false, error: result.error || "Social login failed" };
  }, []);

  const logout = useCallback(async () => {
    try {
      await v1Post("/api/v1/auth/logout", {});
    } catch {}
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        socialLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
