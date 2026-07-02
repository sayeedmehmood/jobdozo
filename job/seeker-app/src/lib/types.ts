export type User = {
  id: string;
  role: string;
  name: string;
  email: string;
  location?: string;
  profilePct?: number;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string;
  logoBg: string;
  logoColor?: string;
  salary: number;
  location: string;
  distance: number;
  openings: number;
  match: number;
  status?: string;
  postedAt?: string;
  tags?: string[];
  expLabel?: string;
};

export type Application = {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
  job?: Job;
};

export type Conversation = {
  id: string;
  applicationId?: string;
  lastMessage?: string;
  lastAt?: string;
  unread?: number;
  other?: { id?: string; name?: string; company?: string; logo?: string; logoBg?: string };
  job?: { title?: string; company?: string };
};

export type Notification = {
  id: string;
  icon: string;
  bg: string;
  text: string;
  read: boolean;
  createdAt: string;
};

export type SubscriptionData = {
  subscription: Record<string, unknown>;
  plans: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  premium: boolean;
};

export type SettingsData = {
  settings: Record<string, unknown>;
  account: Record<string, unknown>;
  themeOptions: string[];
  languageOptions: Array<{ id: string; label: string }>;
};
