/** Seeker account settings — notifications, privacy, preferences. */
"use strict";

const DEFAULT_SETTINGS = {
  notifications: {
    applicationUpdates: true,
    messages: true,
    jobAlerts: true,
    interviewReminders: true,
    marketing: false,
    emailDigest: false,
  },
  privacy: {
    profileVisible: true,
    showPhone: true,
    showSalary: true,
    allowEmployerContact: true,
  },
  preferences: {
    theme: "light",
    language: "en",
    compactSidebar: false,
  },
};

const THEME_OPTIONS = ["light", "dark", "system"];
const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
];

function normalizeSettings(raw) {
  const s = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  const r = raw || {};
  if (r.notifications && typeof r.notifications === "object") {
    for (const k of Object.keys(s.notifications)) {
      if (typeof r.notifications[k] === "boolean") s.notifications[k] = r.notifications[k];
    }
  }
  if (r.privacy && typeof r.privacy === "object") {
    for (const k of Object.keys(s.privacy)) {
      if (typeof r.privacy[k] === "boolean") s.privacy[k] = r.privacy[k];
    }
  }
  if (r.preferences && typeof r.preferences === "object") {
    if (THEME_OPTIONS.includes(r.preferences.theme)) s.preferences.theme = r.preferences.theme;
    if (LANGUAGE_OPTIONS.some((l) => l.id === r.preferences.language)) {
      s.preferences.language = r.preferences.language;
    }
    if (typeof r.preferences.compactSidebar === "boolean") {
      s.preferences.compactSidebar = r.preferences.compactSidebar;
    }
  }
  return s;
}

module.exports = {
  DEFAULT_SETTINGS,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  normalizeSettings,
};
