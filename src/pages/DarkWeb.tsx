import { API_BASE } from "../apiBase";
import { useState } from "react";

interface BreachResult {
  breached: boolean;
  source: string;
  count: number;
  breaches: any[];
  riskScore?: number;
  riskLevel?: string;
  passwords?: {
    plain_text: number;
    weak_hash: number;
    strong_hash: number;
    total: number;
  };
}

const riskBg = (level: string) =>
  level === "critical" || level === "high" ? "#fee2e2" :
  level === "medium" ? "#ffedd5" : "#dcfce7";

const riskText = (level: string) =>
  level === "critical" || level === "high" ? "#b91c1c" :
  level === "medium" ? "#c2410c" : "#15803d";

const riskColor = (level: string) =>
  level === "critical" || level === "high" ? "#ef4444" :
  level === "medium" ? "#f97316" : "#22c55e";

function parseServices(breaches: any[]): string[] {
  return breaches
    .map(s => {
      if (typeof s === "string") return s;
      if (typeof s === "object" && s !== null) return JSON.stringify(s);
      return String(s);
    })
    .flatMap(s => s.split(/[;,]/).map((x: string) => x.trim()).filter(Boolean))
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
}

export default function DarkWeb() {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [result, setResult] = useState<BreachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  async function checkEmail() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSearched(false);
    setShowAll(false);
    setSearchedEmail(email.trim());

    try {
      // ...
      const res = await fetch(`${API_BASE}/api/check-breach/${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Breach check failed");
      setResult(data);
      setSearched(true);
    } catch (err: any) {
      setError("Failed to check breach data. Make sure the server is running and try again.");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  const getRiskLevel = (count: number, result: BreachResult) => {
    if (result.riskLevel) return result.riskLevel;
    if (count >= 10) return "critical";
    if (count >= 5) return "high";
    if (count >= 2) return "medium";
    return "low";
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", margin: 0 }}>Dark Web Monitor</h2>
          <span style={{ fontSize: 11, fontWeight: 600, background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>LIVE</span>
        </div>
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
          Real-time breach detection powered by XposedOrNot — checks billions of exposed records
        </p>
      </div>

      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", marginBottom: 4 }}>Email Breach Check</h3>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Enter a business email to scan against breach databases</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={email}
            onChange={e => { setEmail(e.target.value); setSearched(false); setResult(null); }}
            onKeyDown={e => e.key === "Enter" && checkEmail()}
            placeholder="Enter email address (e.g. admin@company.com)..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: 7, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13 }}
          />
          <button
            onClick={checkEmail}
            disabled={loading || !email.trim()}
            style={{ padding: "10px 20px", borderRadius: 7, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500, opacity: loading || !email.trim() ? 0.6 : 1 }}>
            {loading ? "Scanning..." : "Check"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
          Powered by <span style={{ color: "#7c3aed" }}>XposedOrNot</span> — free, no API key required
        </p>
      </div>

      {error && (
        <div style={{ background: "#2a0f0f", border: "1px solid #991b1b", borderRadius: 10, padding: 16, marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>Scanning breach databases...</p>
        </div>
      )}

      {searched && !loading && result && (
        <div style={{ display: "grid", gap: 16 }}>
          {!result.breached ? (
            <div style={{ background: "#0f2a1a", border: "1px solid #166534", borderRadius: 12, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <p style={{ color: "#22c55e", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>No breaches found</p>
              <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 8px" }}>
                <span style={{ fontFamily: "monospace", color: "#e2e8f0" }}>{searchedEmail}</span> does not appear in any known breach databases
              </p>
              <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>Source: {result.source}</p>
            </div>
          ) : (
            <>
              <div style={{ background: "#2a0f0f", border: "1px solid #991b1b", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>⚠ Breaches Found</span>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: riskBg(getRiskLevel(result.count, result)), color: riskText(getRiskLevel(result.count, result)) }}>
                        {getRiskLevel(result.count, result).toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 4px" }}>
                      Email: <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{searchedEmail}</span>
                    </p>
                    <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 4px" }}>
                      Found in <span style={{ color: "#ef4444", fontWeight: 700 }}>{result.count}</span> breach{result.count !== 1 ? "es" : ""}
                    </p>
                    <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>Source: {result.source}</p>
                  </div>
                  {result.riskScore && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: riskColor(getRiskLevel(result.count, result)) }}>{result.riskScore}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Risk score / 100</div>
                    </div>
                  )}
                </div>
              </div>

              {result.passwords && result.passwords.total > 0 && (
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 16 }}>Password Exposure</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { label: "Plain Text", value: result.passwords.plain_text, color: "#ef4444" },
                      { label: "Weak Hash", value: result.passwords.weak_hash, color: "#f97316" },
                      { label: "Strong Hash", value: result.passwords.strong_hash, color: "#eab308" },
                      { label: "Total", value: result.passwords.total, color: "#94a3b8" },
                    ].map(p => (
                      <div key={p.label} style={{ background: "#0f172a", borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: p.color }}>{p.value}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{p.label}</div>
                      </div>
                    ))}
                  </div>
                  {result.passwords.plain_text > 0 && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 12, marginTop: 12 }}>
                      <p style={{ color: "#fca5a5", fontSize: 13, margin: 0 }}>
                        🚨 <strong>{result.passwords.plain_text}</strong> password{result.passwords.plain_text !== 1 ? "s" : ""} stored in plain text — change these immediately!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {parseServices(result.breaches).length > 0 && (
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", margin: "0 0 4px" }}>
                        Breached Services ({parseServices(result.breaches).length})
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Services where this email was found in a data breach</p>
                    </div>
                    {parseServices(result.breaches).length > 20 && (
                      <button
                        onClick={() => setShowAll(!showAll)}
                        style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                        {showAll ? "Show less" : `Show all ${parseServices(result.breaches).length}`}
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(showAll ? parseServices(result.breaches) : parseServices(result.breaches).slice(0, 20)).map((service, i) => (
                      <span key={i} style={{ fontSize: 11, color: "#cbd5e1", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", whiteSpace: "nowrap" }}>
                        {service}
                      </span>
                    ))}
                    {!showAll && parseServices(result.breaches).length > 20 && (
                      <span style={{ fontSize: 11, color: "#64748b", padding: "4px 10px" }}>
                        +{parseServices(result.breaches).length - 20} more...
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 12 }}>Recommended Actions</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { icon: "🔑", text: "Change passwords for all breached services immediately" },
                    { icon: "🔒", text: "Enable two-factor authentication on all accounts" },
                    { icon: "👀", text: "Monitor accounts for suspicious login activity" },
                    { icon: "📧", text: "Be alert for phishing emails targeting this address" },
                    { icon: "🛡️", text: "Consider using a password manager like Bitwarden or 1Password" },
                  ].map((action, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
                      <span style={{ fontSize: 16 }}>{action.icon}</span>
                      <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{action.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!searched && !loading && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>Enter a business email above and click Check</p>
          <p style={{ color: "#475569", fontSize: 12 }}>Try: test@example.com to see a real breach result</p>
        </div>
      )}

      <div style={{ marginTop: 24, background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 16 }}>Best practices to reduce dark web exposure</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { title: "Use unique passwords", desc: "Never reuse passwords across business accounts. Use a password manager like Bitwarden or 1Password." },
            { title: "Enable 2FA everywhere", desc: "Two-factor authentication blocks 99% of credential-based attacks even if passwords are leaked." },
            { title: "Monitor regularly", desc: "Check your business emails for breaches at least once a month and after any major breach news." },
          ].map(tip => (
            <div key={tip.title} style={{ background: "#0f172a", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#7c3aed", marginBottom: 6 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
