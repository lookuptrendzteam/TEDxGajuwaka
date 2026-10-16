
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      )
    : null;

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [nominations, setNominations] = useState<any[]>([]);

  async function loadDashboard() {
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data: admin } = await supabase
      .from("site_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      setMessage("This account is not an authorized administrator.");
      return;
    }

    const [r, n] = await Promise.all([
      supabase.from("audience_registrations")
        .select("*").order("created_at", { ascending: false }),
      supabase.from("speaker_nominations")
        .select("*").order("created_at", { ascending: false }),
    ]);

    if (r.error || n.error) {
      setMessage("Unable to load submissions. Check database policies.");
      return;
    }

    setRegistrations(r.data || []);
    setNominations(n.data || []);
    setAuthorized(true);
  }

  useEffect(() => {
    if (!supabase) {
      setMessage("Please configure your Supabase environment variables.");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) loadDashboard();
    });
  }, []);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Login failed. Check your email and password.");
    } else {
      await loadDashboard();
    }

    setLoading(false);
  }

  async function logout() {
    await supabase?.auth.signOut();
    setAuthorized(false);
    setRegistrations([]);
    setNominations([]);
    setPassword("");
  }

  if (!authorized) {
    return (
      <main style={pageStyle}>
        <p style={{ color: "#E62B1E", letterSpacing: 3 }}>
          TEDxGAJUWAKA · PRIVATE ADMIN
        </p>
        <h1>Admin <span style={{ color: "#E62B1E" }}>Portal</span></h1>
        <p>Sign in using your authorized Supabase account.</p>

        <form onSubmit={login} style={{ maxWidth: 420 }}>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={fieldStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={fieldStyle}
          />
          <button style={buttonStyle} disabled={loading}>
            {loading ? "CHECKING..." : "SIGN IN"}
          </button>
        </form>

        <p role="status">{message}</p>
        <a href="/">← Back to website</a>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <p style={{ color: "#E62B1E", letterSpacing: 3 }}>
        TEDxGAJUWAKA · ADMIN DASHBOARD
      </p>
      <h1>Event <span style={{ color: "#E62B1E" }}>Management</span></h1>
      <button onClick={logout} style={buttonStyle}>SIGN OUT</button>

      <div style={statsStyle}>
        <div style={cardStyle}>
          <h2>{registrations.length}</h2>
          <p>Audience registrations</p>
        </div>
        <div style={cardStyle}>
          <h2>{nominations.length}</h2>
          <p>Speaker nominations</p>
        </div>
      </div>

      <h2>Audience registrations</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Date</th></tr></thead>
          <tbody>
            {registrations.map(row => (
              <tr key={row.id}>
                <td>{row.full_name}</td>
                <td>{row.email}</td>
                <td>{row.phone || "—"}</td>
                <td>{new Date(row.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Speaker nominations</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead><tr><th>Nominee</th><th>Email</th><th>Talk title</th><th>Idea</th></tr></thead>
          <tbody>
            {nominations.map(row => (
              <tr key={row.id}>
                <td>{row.nominee_name}</td>
                <td>{row.email}</td>
                <td>{row.talk_title}</td>
                <td>{row.idea}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 28 }}>
        <a href="/admin/speakers" style={{ color: "#ff766c" }}>
          Manage previous speakers and photographs →
        </a>
      </p>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#090909",
  color: "#fff",
  padding: "32px 6%",
  fontFamily: "Arial, sans-serif",
};

const fieldStyle = {
  display: "block",
  boxSizing: "border-box" as const,
  width: "100%",
  padding: 14,
  margin: "12px 0",
  background: "#171717",
  color: "#fff",
  border: "1px solid #49302e",
  borderRadius: 6,
};

const buttonStyle = {
  padding: "14px 20px",
  margin: "12px 0",
  background: "#E62B1E",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  cursor: "pointer",
};

const statsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: 16,
  margin: "28px 0",
};

const cardStyle = {
  padding: 20,
  background: "#171717",
  border: "1px solid #49302e",
  borderRadius: 12,
};

const tableStyle = {
  width: "100%",
  minWidth: 600,
  borderCollapse: "collapse" as const,
  margin: "16px 0 36px",
};
