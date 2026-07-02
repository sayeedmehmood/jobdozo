"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function LoginModal() {
  const { loginOpen, login, demoLogin } = useAuth();
  const [email, setEmail] = useState("hr@techcorp.in");
  const [password, setPassword] = useState("employer123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!loginOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try { await login(email, password); } catch (ex) { setErr(ex instanceof Error ? ex.message : "Login failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-overlay open" role="dialog" aria-modal="true">
      <div className="auth-card">
        <div className="auth-brand"><span><img src="/employer/icon.png" alt="" /></span> Job<em>Dozo</em> Employer</div>
        <h3>Employer login</h3>
        <form onSubmit={submit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <p className="auth-err">{err}</p>}
          <button type="submit" className="btn-primary full" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
        </form>
        <button type="button" className="btn-outline full" style={{ marginTop: 10 }} onClick={demoLogin}>Demo: TechCorp HR</button>
      </div>
    </div>
  );
}
