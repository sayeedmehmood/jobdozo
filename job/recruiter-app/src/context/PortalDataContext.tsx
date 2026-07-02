"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { useAuth } from "./AuthContext";

type PortalCtx = {
  loading: boolean;
  dashboard: Record<string, unknown> | null;
  notifications: Notification[];
  refresh: () => Promise<void>;
  badges: Record<string, number>;
};

const PortalDataContext = createContext<PortalCtx | null>(null);

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dash, notifs] = await Promise.all([
        api.get<Record<string, unknown>>("/api/recruiter/dashboard"),
        api.get<Notification[]>("/api/notifications"),
      ]);
      setDashboard(dash);
      setNotifications(notifs);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else setLoading(false);
  }, [user, refresh]);

  const badges = useMemo(() => ({
    applications: Number((dashboard?.stats as Record<string, number>)?.pendingReviews || 0),
    messages: notifications.filter((n) => !n.read).length,
  }), [dashboard, notifications]);

  const value = useMemo(() => ({ loading, dashboard, notifications, refresh, badges }), [loading, dashboard, notifications, refresh, badges]);

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const ctx = useContext(PortalDataContext);
  if (!ctx) throw new Error("usePortalData must be used within PortalDataProvider");
  return ctx;
}
