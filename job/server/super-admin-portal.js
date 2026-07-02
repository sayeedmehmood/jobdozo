"use strict";

function dashboardPayload(stats) {
  return {
    stats: {
      globalRevenue: stats.revenue || 248500,
      totalUsers: stats.users || 0,
      totalJobs: stats.totalJobs || stats.jobs || 0,
      serverHealth: 99,
      apiUsage: 12400,
      fraudAlerts: 2,
      platformGrowth: 18,
    },
    widgets: [
      { label: "Global Revenue", value: "₹2,48,500", icon: "fa-indian-rupee-sign" },
      { label: "Total Users", value: String(stats.users || 0), icon: "fa-users" },
      { label: "Total Jobs", value: String(stats.jobs || 0), icon: "fa-briefcase" },
      { label: "Server Health", value: "99%", icon: "fa-server" },
    ],
  };
}

module.exports = { dashboardPayload };
