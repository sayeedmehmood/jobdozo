"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, DEMO } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  loginOpen: boolean;
  setLoginOpen: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const u = api.user;
    setUser(u);
    if (!u || u.role !== "seeker") setLoginOpen(true);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password });
    if (resp.user.role !== "seeker") throw new Error("Please use a job seeker account");
    api.setSession(resp.token, resp.user);
    setUser(resp.user);
    setLoginOpen(false);
  }, []);

  const demoLogin = useCallback(() => login(DEMO.email, DEMO.password), [login]);

  const logout = useCallback(() => api.logout(), []);

  return (
    <AuthContext.Provider value={{ user, loading, loginOpen, setLoginOpen, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
