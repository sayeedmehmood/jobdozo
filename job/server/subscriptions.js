/** Subscription plans and billing helpers for JobDozo seekers. */
"use strict";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: null,
    tagline: "Get started on JobDozo",
    features: [
      "Browse & apply to jobs",
      "Basic profile & resume",
      "Job alerts (up to 3 keywords)",
      "2 AI skill tests / month",
    ],
    limits: { applications: 20, skillTests: 2, alertKeywords: 3 },
    popular: false,
  },
  {
    id: "monthly",
    name: "Premium Monthly",
    price: 199,
    interval: "month",
    tagline: "Stand out and get hired faster",
    features: [
      "Premium profile badge",
      "Priority applications — shown first to HR",
      "Unlimited applications",
      "Unlimited AI skill tests",
      "Resume builder & PDF export",
      "Profile boost (3× more views)",
      "Instant job alert notifications",
    ],
    limits: { applications: Infinity, skillTests: Infinity, alertKeywords: 12 },
    popular: false,
  },
  {
    id: "yearly",
    name: "Premium Yearly",
    price: 1499,
    interval: "year",
    tagline: "Best value — save ₹889 vs monthly",
    features: [
      "Everything in Premium Monthly",
      "Featured profile in employer search",
      "Dedicated career coach chat",
      "Interview prep AI assistant",
      "Early access to new jobs",
    ],
    savings: "37% off",
    limits: { applications: Infinity, skillTests: Infinity, alertKeywords: 12 },
    popular: true,
  },
];

const DEFAULT_SUBSCRIPTION = {
  planId: "free",
  planName: "Free",
  status: "active",
  price: 0,
  interval: null,
  startedAt: null,
  renewsAt: null,
  cancelledAt: null,
  premium: false,
};

function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

function normalizeSubscription(raw) {
  const s = { ...DEFAULT_SUBSCRIPTION, ...(raw || {}) };
  const plan = getPlan(s.planId);
  s.planId = plan.id;
  s.planName = plan.name;
  s.price = plan.price;
  s.interval = plan.interval;
  s.premium = plan.id !== "free" && s.status === "active";
  return s;
}

function calcRenewal(interval) {
  const d = new Date();
  if (interval === "month") d.setMonth(d.getMonth() + 1);
  else if (interval === "year") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

function subscribe(user, planId) {
  const plan = getPlan(planId);
  if (plan.id === "free") {
    return normalizeSubscription({
      planId: "free", status: "active", startedAt: null, renewsAt: null, cancelledAt: null,
    });
  }
  const now = new Date().toISOString();
  return normalizeSubscription({
    planId: plan.id,
    status: "active",
    startedAt: now,
    renewsAt: calcRenewal(plan.interval),
    cancelledAt: null,
  });
}

function cancelSubscription(sub) {
  return normalizeSubscription({
    ...sub,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    premium: false,
    renewsAt: null,
  });
}

function isPremium(user) {
  const s = normalizeSubscription(user?.subscription);
  return s.premium;
}

module.exports = {
  PLANS,
  DEFAULT_SUBSCRIPTION,
  getPlan,
  normalizeSubscription,
  subscribe,
  cancelSubscription,
  isPremium,
};
