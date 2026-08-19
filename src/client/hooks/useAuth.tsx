import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Check for auth_success/auth_error in URL (from Google OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("auth_success")) {
      void refresh();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.has("auth_error")) {
      console.error("Auth error:", params.get("auth_error"));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Помилка при вході." };
      setUser(data.user);
      return {};
    } catch {
      return { error: "Помилка мережі." };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Помилка при реєстрації." };
      setUser(data.user);
      return {};
    } catch {
      return { error: "Помилка мережі." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(window.location.origin)}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Google OAuth не налаштовано");
      }
    } catch {
      window.location.href = `/api/auth/google?origin=${encodeURIComponent(window.location.origin)}`;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, login, register, logout, loginWithGoogle, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
