"use strict";

function dashboardPayload(user, jobs, applications) {
  const assigned = jobs.filter((j) => j.employerId === user.employerId || j.employerId === "u-techcorp");
  const jobIds = new Set(assigned.map((j) => j.id));
  const apps = applications.filter((a) => jobIds.has(a.jobId));
  return {
    stats: {
      openPositions: assigned.filter((j) => j.status === "active").length,
      assignedCandidates: apps.length,
      pendingReviews: apps.filter((a) => a.status === "Applied" || a.status === "Viewed").length,
      scheduledInterviews: apps.filter((a) => a.status === "Interview").length,
    },
    hiringProgress: {
      screened: apps.filter((a) => a.status === "Shortlisted").length,
      interviewed: apps.filter((a) => a.status === "Interview").length,
      selected: apps.filter((a) => a.status === "Selected").length,
    },
    recentApplications: apps.slice(0, 6),
    assignedJobs: assigned.slice(0, 5),
  };
}

module.exports = { dashboardPayload };
