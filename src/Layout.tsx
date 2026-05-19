import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Threat Dashboard" },
    { path: "/darkweb", label: "Dark Web Monitor" },
    { path: "/cve", label: "CVE Lookup" },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuth(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif" }}>
      <nav style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "0 24px", display: "flex", alignItems: "center", gap: 32, height: 64, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="EyeSOC" style={{ height: 48, width: "auto" }} />
        </div>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 13, textDecoration: "none",
              background: location.pathname === item.path ? "#1e293b" : "transparent",
              color: location.pathname === item.path ? "#f8fafc" : "#64748b",
              fontWeight: location.pathname === item.path ? 500 : 400,
            }}>{item.label}</Link>
          ))}
        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{user.email}</span>
            <button onClick={handleSignOut} style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid #334155",
              background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer",
            }}>Sign out</button>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} style={{
            padding: "6px 16px", borderRadius: 6, border: "none",
            background: "#2563eb", color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer",
          }}>Sign in</button>
        )}
      </nav>

      {showAuth && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "#111827", border: "1px solid #1f2937", borderRadius: 14,
            padding: 28, width: "100%", maxWidth: 400,
          }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#f8fafc" }}>
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>
              {mode === "login" ? "Access your investigation workbook" : "Free - takes 10 seconds"}
            </p>
            {error && (
              <div style={{
                background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8,
                padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 14,
              }}>{error}</div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="you@company.com"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #334155", background: "#020617",
                  color: "#e2e8f0", fontSize: 13, boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="........"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #334155", background: "#020617",
                  color: "#e2e8f0", fontSize: 13, boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={handleSubmit} disabled={loading}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
                background: "#2563eb", color: "#fff", fontSize: 14,
                fontWeight: 700, cursor: "pointer", marginBottom: 14,
              }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              {mode === "login" ? (
                <button onClick={() => { setMode("register"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: 12, padding: 0 }}>
                  Create account
                </button>
              ) : (
                <button onClick={() => { setMode("login"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: 12, padding: 0 }}>
                  Back to sign in
                </button>
              )}
              <button onClick={() => setShowAuth(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: 0 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}


