"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Application, Conversation, Job, Notification, SettingsData, SubscriptionData, User } from "@/lib/types";
import { useAuth } from "./AuthContext";

type SeekerCtx = {
  loading: boolean;
  applications: Application[];
  jobs: Job[];
  savedIds: string[];
  savedJobs: Job[];
  conversations: Conversation[];
  notifications: Notification[];
  resume: Record<string, unknown> | null;
  skillTests: Array<Record<string, unknown>>;
  jobAlerts: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  subscription: SubscriptionData;
  settings: SettingsData;
  refresh: () => Promise<void>;
  badges: Record<string, number>;
};

const defaultSub: SubscriptionData = { subscription: {}, plans: [], history: [], premium: false };
const defaultSettings: SettingsData = { settings: {}, account: {}, themeOptions: [], languageOptions: [] };

const SeekerDataContext = createContext<SeekerCtx | null>(null);

export function SeekerDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [resume, setResume] = useState<Record<string, unknown> | null>(null);
  const [skillTests, setSkillTests] = useState<Array<Record<string, unknown>>>([]);
  const [jobAlerts, setJobAlerts] = useState<Record<string, unknown>>({});
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData>(defaultSub);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [apps, jobList, saved, convs, notifs, res, skills, alerts, prof, sub, sett] = await Promise.all([
        api.get<Application[]>("/api/applications/mine"),
        api.get<Job[]>("/api/jobs"),
        api.get<{ ids: string[]; jobs: Job[] }>("/api/saved"),
        api.get<Conversation[]>("/api/messages/conversations"),
        api.get<Notification[]>("/api/notifications"),
        api.get<Record<string, unknown>>("/api/users/me/resume"),
        api.get<{ tests: Array<Record<string, unknown>> }>("/api/skill-tests"),
        api.get<Record<string, unknown>>("/api/users/me/job-alerts"),
        api.get<Record<string, unknown>>("/api/users/me/profile"),
        api.get<SubscriptionData>("/api/users/me/subscription"),
        api.get<SettingsData>("/api/users/me/settings"),
      ]);
      setApplications(apps);
      setJobs(jobList);
      setSavedIds(saved.ids);
      setSavedJobs(saved.jobs);
      setConversations(convs);
      setNotifications(notifs);
      setResume(res);
      setSkillTests(skills.tests || []);
      setJobAlerts(alerts);
      setProfile(prof);
      setSubscription(sub);
      setSettings(sett);
      const profUser = (prof as { user?: User }).user;
      if (profUser) api.setSession(api.token!, { ...user, ...profUser });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  useEffect(() => {
    let sock: ReturnType<typeof import("@/lib/socket").getSocket> | null = null;
    let cancelled = false;
    import("@/lib/socket").then(({ getSocket }) => {
      if (cancelled) return;
      sock = getSocket();
      if (!sock) return;
      const onNotif = (n: Notification) => setNotifications((prev) => [n, ...prev].slice(0, 30));
      const onApp = () => refresh();
      sock.on("notification:new", onNotif);
      sock.on("application:updated", onApp);
      sock.on("message:new", onApp);
    });
    return () => {
      cancelled = true;
      if (sock) {
        sock.off("notification:new");
        sock.off("application:updated");
        sock.off("message:new");
      }
    };
  }, [refresh]);

  const badges = useMemo(
    () => ({
      applications: applications.length,
      saved: savedJobs.length,
      interviews: applications.filter((a) => a.status === "Interview").length,
      messages: conversations.reduce((n, c) => n + (c.unread || 0), 0),
      skillTests: skillTests.length,
      alerts: ((jobAlerts as { stats?: { unread?: number } }).stats?.unread) || 0,
    }),
    [applications, savedJobs, conversations, skillTests, jobAlerts]
  );

  const value = useMemo(
    () => ({
      loading,
      applications,
      jobs,
      savedIds,
      savedJobs,
      conversations,
      notifications,
      resume,
      skillTests,
      jobAlerts,
      profile,
      subscription,
      settings,
      refresh,
      badges,
    }),
    [
      loading,
      applications,
      jobs,
      savedIds,
      savedJobs,
      conversations,
      notifications,
      resume,
      skillTests,
      jobAlerts,
      profile,
      subscription,
      settings,
      refresh,
      badges,
    ]
  );

  return <SeekerDataContext.Provider value={value}>{children}</SeekerDataContext.Provider>;
}

export function useSeekerData() {
  const ctx = useContext(SeekerDataContext);
  if (!ctx) throw new Error("useSeekerData must be used within SeekerDataProvider");
  return ctx;
}
