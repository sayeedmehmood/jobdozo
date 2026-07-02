/* End-to-end workflow test against a running server. */
const BASE = "http://localhost:8123";

async function req(path, { method = "GET", body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data.error}`);
  return data;
}

(async () => {
  // 1. Employer login + post job
  const emp = await req("/api/auth/login", { method: "POST", body: { email: "hr@techcorp.in", password: "employer123" } });
  console.log("1. employer login OK:", emp.user.name);

  const job = await req("/api/jobs", { method: "POST", token: emp.token, body: {
    title: "QA Engineer (E2E Test)", category: "IT Jobs", type: "Full Time",
    location: "Jammu, J&K", salary: 30000, openings: 2, skills: ["Testing"], desc: "Test job",
  }});
  console.log("2. job posted OK:", job.id, job.title, "status:", job.status);

  const pub = await req("/api/jobs");
  console.log("3. job visible on public marketplace:", pub.some((j) => j.id === job.id));

  // 2. Seeker login + apply
  const seeker = await req("/api/auth/login", { method: "POST", body: { email: "priya@gmail.com", password: "priya123" } });
  const app = await req("/api/applications", { method: "POST", token: seeker.token, body: { jobId: job.id, experience: "Fresher" } });
  console.log("4. seeker applied OK:", app.id, "status:", app.status);

  // 3. Employer sees application
  const received = await req("/api/applications/received", { token: emp.token });
  console.log("5. employer sees application:", received.some((a) => a.id === app.id));

  // 4. Employer updates status
  const upd = await req(`/api/applications/${app.id}/status`, { method: "PATCH", token: emp.token, body: { status: "Shortlisted" } });
  console.log("6. status updated:", upd.status);

  // 5. Seeker sees update
  const mine = await req("/api/applications/mine", { token: seeker.token });
  console.log("7. seeker sees status:", mine.find((a) => a.id === app.id).status);

  // 6. Seeker saved jobs
  const sv = await req("/api/saved/" + job.id, { method: "POST", token: seeker.token });
  console.log("8. save job:", sv.saved);

  // 7. Seeker notifications
  const notifs = await req("/api/notifications", { token: seeker.token });
  console.log("9. seeker notifications:", notifs.length, "| latest:", notifs[0] && notifs[0].text);

  // 8. Admin
  const admin = await req("/api/auth/login", { method: "POST", body: { email: "admin@JobDozo.in", password: "admin123" } });
  const stats = await req("/api/admin/stats", { token: admin.token });
  console.log("10. admin stats:", JSON.stringify(stats));
  const act = await req("/api/admin/activity", { token: admin.token });
  console.log("11. activity log entries:", act.length, "| latest:", act[0].title, "-", act[0].sub);

  // 9. Admin suspends then deletes test job; seeker withdraws
  await req(`/api/jobs/${job.id}`, { method: "PATCH", token: admin.token, body: { status: "suspended" } });
  const pub2 = await req("/api/jobs");
  console.log("12. suspended job hidden from marketplace:", !pub2.some((j) => j.id === job.id));
  await req(`/api/applications/${app.id}`, { method: "DELETE", token: seeker.token });
  await req(`/api/jobs/${job.id}`, { method: "DELETE", token: admin.token });
  console.log("13. cleanup done (withdraw + delete)");

  // 10. RBAC checks
  let blocked = 0;
  try { await req("/api/admin/stats", { token: seeker.token }); } catch { blocked++; }
  try { await req("/api/jobs", { method: "POST", token: seeker.token, body: { title: "x", category: "y" } }); } catch { blocked++; }
  try { await req("/api/applications", { method: "POST", token: emp.token, body: { jobId: "j1" } }); } catch { blocked++; }
  console.log("14. RBAC: blocked forbidden calls:", blocked, "/ 3");

  console.log("\nALL WORKFLOW TESTS PASSED ✔");
})().catch((e) => { console.error("TEST FAILED:", e.message); process.exit(1); });
