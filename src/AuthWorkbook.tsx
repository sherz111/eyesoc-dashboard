import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  return _supabase;
}

export interface Investigation {
  id: string;
  user_id: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  log_snapshot: string;
  alert_count: number;
  overall_risk: string;
  deepest_stage: string;
  created_at: string;
  updated_at: string;
  notes: string;
}

export interface WorkbookTask {
  id: string;
  investigation_id: string;
  user_id: string;
  text: string;
  done: boolean;
  created_at: string;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, session: null, isGuest: false, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const STATUS_LABELS: Record<string, string> = {
  open: "🔴 Open",
  in_progress: "🟡 In Progress",
  closed: "🟢 Closed",
};

const RISK_COLORS: Record<string, string> = {
  High: "#ef4444", Medium: "#f97316", Low: "#22c55e", None: "#64748b",
};

function AuthScreen({ onGuest }: { onGuest: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const db = getSupabase();

  async function handleSubmit() {
    setError(""); setInfo(""); setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "register") {
        const { error } = await db.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Check your email to confirm your account, then log in.");
        setMode("login");
      } else {
        const { error } = await db.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setInfo("Reset link sent — check your email.");
        setMode("login");
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo.png" alt="EyeSOC" style={{ height: 72, width: "auto", marginBottom: 14 }} />
          <h1 style={{ margin: 0, fontSize: 22, color: "#f8fafc" }}>Welcome to EyeSOC</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
            {mode === "login" ? "Sign in to save and track your investigations"
              : mode === "register" ? "Create a free account to get started"
              : "Reset your password"}
          </p>
        </div>

        {error && <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 14 }}>{error}</div>}
        {info && <div style={{ background: "#052e16", border: "1px solid #14532d", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#86efac", marginBottom: 14 }}>{info}</div>}

        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#64748b", fontSize: 12, marginBottom: 5, display: "block" }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="you@company.com"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #334155", background: "#020617", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
        </div>

        {mode !== "forgot" && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#64748b", fontSize: 12, marginBottom: 5, display: "block" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #334155", background: "#020617", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
        </button>

        <button onClick={onGuest}
          style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
          Continue as guest
        </button>

        <p style={{ fontSize: 11, color: "#475569", textAlign: "center", margin: "0 0 14px" }}>
          Guests can use the full dashboard. Sign in to save investigations.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          {mode === "login" ? (
            <>
              <button onClick={() => { setMode("register"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: 12, padding: 0 }}>Create account</button>
              <button onClick={() => { setMode("forgot"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: 0 }}>Forgot password?</button>
            </>
          ) : (
            <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: 12, padding: 0 }}>Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

interface WorkbookProps {
  currentAnalysis?: { logSnapshot: string; alertCount: number; overallRisk: string; deepestStage: string; };
  onLoadInvestigation?: (logSnapshot: string) => void;
}

export function WorkbookPanel({ currentAnalysis, onLoadInvestigation }: WorkbookProps) {
  const { user, isGuest, signOut } = useAuth();
  const db = getSupabase();

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selected, setSelected] = useState<Investigation | null>(null);
  const [tasks, setTasks] = useState<WorkbookTask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (user) fetchInvestigations(); }, [user]);
  useEffect(() => {
    if (selected) { fetchTasks(selected.id); setNotes(selected.notes || ""); }
  }, [selected?.id]);

  async function fetchInvestigations() {
    setLoading(true);
    const { data, error } = await db.from("investigations").select("*").order("updated_at", { ascending: false });
    if (!error && data) setInvestigations(data);
    setLoading(false);
  }

  async function fetchTasks(invId: string) {
    const { data, error } = await db.from("workbook_tasks").select("*").eq("investigation_id", invId).order("created_at", { ascending: true });
    if (!error && data) setTasks(data);
  }

  async function saveCurrentAnalysis() {
    if (!currentAnalysis || !newTitle.trim() || !user) return;
    setSaving(true);
    const { data, error } = await db.from("investigations").insert({
      user_id: user.id,
      title: newTitle.trim(),
      status: "open",
      log_snapshot: currentAnalysis.logSnapshot,
      alert_count: currentAnalysis.alertCount,
      overall_risk: currentAnalysis.overallRisk,
      deepest_stage: currentAnalysis.deepestStage,
      notes: "",
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setNewTitle("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchInvestigations();
      setSelected(data);
    }
  }

  async function updateStatus(id: string, status: Investigation["status"]) {
    const { error } = await db.from("investigations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) {
      setSelected(prev => prev ? { ...prev, status } : prev);
      setInvestigations(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    }
  }

  async function deleteInvestigation(id: string) {
    if (!confirm("Delete this case and all its tasks?")) return;
    await db.from("workbook_tasks").delete().eq("investigation_id", id);
    await db.from("investigations").delete().eq("id", id);
    setSelected(null); setTasks([]); setNotes("");
    await fetchInvestigations();
  }

  async function addTask() {
    if (!newTask.trim() || !selected || !user) return;
    const { data, error } = await db.from("workbook_tasks").insert({
      investigation_id: selected.id, user_id: user.id, text: newTask.trim(), done: false,
    }).select().single();
    if (!error && data) { setTasks(prev => [...prev, data]); setNewTask(""); }
  }

  async function toggleTask(task: WorkbookTask) {
    const { error } = await db.from("workbook_tasks").update({ done: !task.done }).eq("id", task.id);
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
  }

  async function deleteTask(id: string) {
    await db.from("workbook_tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    if (!selected) return;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      const { error } = await db.from("investigations").update({ notes: val, updated_at: new Date().toISOString() }).eq("id", selected.id);
      if (!error) { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); }
    }, 800);
  }

  if (isGuest) {
    return (
      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 32, textAlign: "center", marginTop: 18 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <h3 style={{ color: "#f8fafc", fontSize: 16, margin: "0 0 8px" }}>Sign in to use the Workbook</h3>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
          Create a free account to save investigations, track tasks, and write case notes that persist between sessions.
        </p>
        <button onClick={signOut} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Sign in to unlock Workbook
        </button>
      </div>
    );
  }

  if (!user) return null;

  const doneTasks = tasks.filter(t => t.done).length;

  return (
    <div style={{ marginTop: 18 }}>

      {/* Save current analysis banner */}
      {currentAnalysis && currentAnalysis.alertCount > 0 && (
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Save Current Analysis</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
                {currentAnalysis.alertCount} alerts · {currentAnalysis.overallRisk} risk · Deepest stage: {currentAnalysis.deepestStage}
              </p>
            </div>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveCurrentAnalysis()}
              placeholder="Give this case a name..."
              style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #334155", background: "#020617", color: "#e2e8f0", fontSize: 13, width: 220 }}
            />
            <button onClick={saveCurrentAnalysis} disabled={saving || !newTitle.trim()}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: newTitle.trim() ? "#2563eb" : "#1e293b", color: newTitle.trim() ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: newTitle.trim() ? "pointer" : "default" }}>
              {saving ? "Saving..." : "Save Case"}
            </button>
            {saveSuccess && <span style={{ fontSize: 12, color: "#22c55e" }}>✓ Saved!</span>}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, minHeight: 500 }}>

        {/* Case list */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1f2937" }}>
            <h3 style={{ margin: 0, fontSize: 14, color: "#f8fafc", fontWeight: 700 }}>Saved Cases</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{investigations.length} case{investigations.length !== 1 ? "s" : ""} · {user.email}</p>
          </div>

          <div style={{ overflowY: "auto", maxHeight: 500 }}>
            {loading && <p style={{ color: "#64748b", fontSize: 13, padding: 16 }}>Loading cases...</p>}
            {!loading && investigations.length === 0 && (
              <div style={{ padding: 20, textAlign: "center" }}>
                <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>No cases saved yet. Analyze some logs and save a case above.</p>
              </div>
            )}
            {investigations.map(inv => (
              <div key={inv.id} onClick={() => setSelected(inv)}
                style={{ padding: "12px 16px", cursor: "pointer", background: selected?.id === inv.id ? "#1e293b" : "transparent", borderLeft: `3px solid ${selected?.id === inv.id ? "#2563eb" : "transparent"}`, borderBottom: "1px solid #1f2937" }}>
                <div style={{ fontSize: 13, color: "#f8fafc", fontWeight: 600, marginBottom: 5 }}>{inv.title}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: inv.status === "open" ? "#93c5fd" : inv.status === "in_progress" ? "#fed7aa" : "#bbf7d0" }}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                  <span style={{ fontSize: 11, color: RISK_COLORS[inv.overall_risk] || "#64748b", fontWeight: 600 }}>
                    {inv.overall_risk} risk
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>
                  {inv.alert_count} alerts · {new Date(inv.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Case detail */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 20 }}>
          {!selected ? (
            <div style={{ textAlign: "center", marginTop: 80, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
              👈 Select a case from the left to view details,<br />or save your current analysis above.
            </div>
          ) : (
            <>
              {/* Case header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, color: "#f8fafc" }}>{selected.title}</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                    Saved {new Date(selected.created_at).toLocaleString()} · Last updated {new Date(selected.updated_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => deleteInvestigation(selected.id)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #7f1d1d", background: "#450a0a", color: "#fca5a5", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                  Delete case
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {[
                  { label: "Risk level", value: selected.overall_risk, color: RISK_COLORS[selected.overall_risk] || "#64748b" },
                  { label: "Alerts", value: String(selected.alert_count), color: "#f8fafc" },
                  { label: "Deepest stage", value: selected.deepest_stage, color: "#38bdf8" },
                  { label: "Tasks done", value: `${doneTasks}/${tasks.length}`, color: doneTasks === tasks.length && tasks.length > 0 ? "#22c55e" : "#f8fafc" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 14px", minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{stat.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Status buttons */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>Case status:</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["open", "in_progress", "closed"] as const).map(st => (
                    <button key={st} onClick={() => updateStatus(selected.id, st)}
                      style={{ padding: "6px 14px", borderRadius: 8, border: selected.status === st ? "none" : "1px solid #334155", background: selected.status === st ? (st === "open" ? "#1e3a5f" : st === "in_progress" ? "#7c2d12" : "#14532d") : "transparent", color: selected.status === st ? "#fff" : "#94a3b8", fontSize: 12, cursor: "pointer", fontWeight: selected.status === st ? 600 : 400 }}>
                      {STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Load evidence button */}
              {onLoadInvestigation && (
                <button onClick={() => onLoadInvestigation(selected.log_snapshot)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#93c5fd", fontSize: 13, cursor: "pointer", marginBottom: 20 }}>
                  📂 Load evidence into dashboard
                </button>
              )}

              {/* Tasks + Notes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* Tasks */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#f8fafc", fontWeight: 600 }}>Remediation Tasks</p>
                    <span style={{ fontSize: 12, color: doneTasks === tasks.length && tasks.length > 0 ? "#22c55e" : "#64748b" }}>
                      {doneTasks}/{tasks.length} done
                    </span>
                  </div>

                  {tasks.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      {tasks.map(task => (
                        <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f2937" }}>
                          <input type="checkbox" checked={task.done} onChange={() => toggleTask(task)}
                            style={{ accentColor: "#2563eb", width: 16, height: 16, flexShrink: 0, cursor: "pointer" }} />
                          <span style={{ flex: 1, fontSize: 13, color: task.done ? "#475569" : "#e2e8f0", textDecoration: task.done ? "line-through" : "none" }}>
                            {task.text}
                          </span>
                          <button onClick={() => deleteTask(task.id)}
                            style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {tasks.length === 0 && (
                    <p style={{ color: "#475569", fontSize: 13, margin: "0 0 10px" }}>No tasks yet — add one below.</p>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTask()}
                      placeholder="Add a task (e.g. Reset admin password)..."
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", background: "#020617", color: "#e2e8f0", fontSize: 13 }}
                    />
                    <button onClick={addTask}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                      Add
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#f8fafc", fontWeight: 600 }}>Investigation Notes</p>
                    {notesSaved && <span style={{ fontSize: 11, color: "#22c55e" }}>✓ Saved</span>}
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => handleNotesChange(e.target.value)}
                    placeholder={"Write your findings here...\n\nExamples:\n- Which systems were affected\n- What actions were taken\n- Who was notified\n- Next steps"}
                    style={{ width: "100%", minHeight: 200, padding: 12, fontFamily: "inherit", fontSize: 13, borderRadius: 8, border: "1px solid #334155", background: "#020617", color: "#e2e8f0", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
                  />
                  <p style={{ margin: "5px 0 0", fontSize: 11, color: "#475569" }}>Notes save automatically as you type.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function withAuth<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> {
  return function AuthWrapper(props: P) {
    const db = getSupabase();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
      db.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      });
      const { data: listener } = db.auth.onAuthStateChange((_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) setIsGuest(false);
      });
      return () => listener.subscription.unsubscribe();
    }, []);

    if (loading) {
      return (
        <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 14 }}>
          Loading...
        </div>
      );
    }

    if (!user && !isGuest) return <AuthScreen onGuest={() => setIsGuest(true)} />;

    const signOut = async () => {
      if (isGuest) {
        setIsGuest(false);
      } else {
        await db.auth.signOut();
        setUser(null);
        setSession(null);
        setIsGuest(false);
      }
    };

    return (
      <AuthContext.Provider value={{ user, session, isGuest, signOut }}>
        <Component {...props} />
      </AuthContext.Provider>
    );
  };
}
