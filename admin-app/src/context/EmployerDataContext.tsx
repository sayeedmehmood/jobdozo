"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Application, Conversation, Job, Notification, User } from "@/lib/types";
import { useAuth } from "./AuthContext";

type EmployerCtx = {
  loading: boolean;
  dashboard: Record<string, unknown> | null;
  jobs: Job[];
  applications: Application[];
  candidates: Array<Record<string, unknown>>;
  conversations: Conversation[];
  notifications: Notification[];
  company: Record<string, unknown> | null;
  transactions: Record<string, unknown> | null;
  reviews: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  talent: Array<Record<string, unknown>>;
  refresh: () => Promise<void>;
  badges: Record<string, number>;
};

const EmployerDataContext = createContext<EmployerCtx | null>(null);

export function EmployerDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<Array<Record<string, unknown>>>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [transactions, setTransactions] = useState<Record<string, unknown> | null>(null);
  const [reviews, setReviews] = useState<Record<string, unknown> | null>(null);
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [talent, setTalent] = useState<Array<Record<string, unknown>>>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dash, jobList, apps, cands, convs, notifs, comp, tx, rev, sub, sett, talentRes] = await Promise.all([
        api.get<Record<string, unknown>>("/api/employer/dashboard"),
        api.get<Job[]>("/api/jobs/mine"),
        api.get<Application[]>("/api/applications/received"),
        api.get<{ candidates: Array<Record<string, unknown>> }>("/api/employer/candidates"),
        api.get<Conversation[]>("/api/messages/conversations"),
        api.get<Notification[]>("/api/notifications"),
        api.get<{ company: Record<string, unknown>; user?: User }>("/api/employer/company"),
        api.get<Record<string, unknown>>("/api/employer/transactions"),
        api.get<Record<string, unknown>>("/api/employer/reviews"),
        api.get<Record<string, unknown>>("/api/employer/subscription"),
        api.get<Record<string, unknown>>("/api/employer/settings"),
        api.get<{ results: Array<Record<string, unknown>> }>("/api/employer/talent-search"),
      ]);
      setDashboard(dash);
      setJobs(jobList);
      setApplications(apps);
      setCandidates(cands.candidates || []);
      setConversations(convs);
      setNotifications(notifs);
      setCompany(comp.company);
      setTransactions(tx);
      setReviews(rev);
      setSubscription(sub);
      setSettings(sett);
      setTalent(talentRes.results || []);
      const u = comp.user as User | undefined;
      if (u) api.setSession(api.token!, { ...user, ...u });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else setLoading(false);
  }, [user, refresh]);

  useEffect(() => {
    let sock: ReturnType<typeof import("@/lib/socket").getSocket> | null = null;
    let cancelled = false;
    import("@/lib/socket").then(({ getSocket }) => {
      if (cancelled) return;
      sock = getSocket();
      if (!sock) return;
      const onNotif = (n: Notification) => setNotifications((p) => [n, ...p].slice(0, 30));
      const onApp = () => refresh();
      sock.on("notification:new", onNotif);
      sock.on("application:created", onApp);
      sock.on("message:new", onApp);
    });
    return () => {
      cancelled = true;
      if (sock) {
        sock.off("notification:new");
        sock.off("application:created");
        sock.off("message:new");
      }
    };
  }, [refresh]);

  const badges = useMemo(() => ({
    applications: applications.length,
    messages: conversations.reduce((n, c) => n + (c.unread || 0), 0),
  }), [applications, conversations]);

  const value = useMemo(() => ({
    loading, dashboard, jobs, applications, candidates, conversations, notifications,
    company, transactions, reviews, subscription, settings, talent, refresh, badges,
  }), [loading, dashboard, jobs, applications, candidates, conversations, notifications, company, transactions, reviews, subscription, settings, talent, refresh, badges]);

  return <EmployerDataContext.Provider value={value}>{children}</EmployerDataContext.Provider>;
}

export function useEmployerData() {
  const ctx = useContext(EmployerDataContext);
  if (!ctx) throw new Error("useEmployerData must be used within EmployerDataProvider");
  return ctx;
}
