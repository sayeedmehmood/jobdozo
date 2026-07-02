/** Role-based portal routing and permissions. */
"use strict";

const ROLE_HOME = {
  seeker: "/seeker/dashboard",
  employer: "/employer/dashboard",
  recruiter: "/recruiter/dashboard",
  admin: "/admin/dashboard",
  "super-admin": "/super-admin/dashboard",
};

const PERMISSIONS = {
  seeker: { applyJobs: true, saveJobs: true, resumeBuilder: true, postJobs: false, viewCandidates: false, systemManagement: false },
  employer: { applyJobs: false, saveJobs: false, resumeBuilder: false, postJobs: true, viewCandidates: true, scheduleInterviews: true, systemManagement: false },
  recruiter: { manageHiring: true, candidateScreening: true, interviewManagement: true, postJobs: false, systemManagement: false },
  admin: { managePlatform: true, manageUsers: true, manageSubscriptions: true, fullAccess: false },
  "super-admin": { fullAccess: true, serverControl: true, revenueControl: true, securityControl: true },
};

function homeForRole(role) {
  return ROLE_HOME[role] || "/login.html";
}

module.exports = { ROLE_HOME, PERMISSIONS, homeForRole };
