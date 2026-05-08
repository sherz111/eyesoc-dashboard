import { useState } from "react";

const LEAKED_DB = [
  { email: "admin@company.com", source: "LinkedIn Breach 2021", date: "2021-06-14", type: "Email + Password hash" },
  { email: "info@business.com", source: "RockYou2021", date: "2021-07-04", type: "Email + Password" },
  { email: "john@example.com", source: "Adobe Breach 2020", date: "2020-11-10", type: "Email + Password hash" },
  { email: "hr@smallbiz.com", source: "Collection #1 2019", date: "2019-01-17", type: "Email + Password" },
  { email: "support@mystore.com", source: "Canva Breach 2019", date: "2019-05-24", type: "Email + Username" },
  { email: "ceo@startup.com", source: "Twitter Breach 2022", date: "2022-08-05", type: "Email + Phone" },
  { email: "sales@corp.com", source: "Facebook Breach 2021", date: "2021-04-03", type: "Email + Phone + Location" },
];

const CREDENTIAL_DB = [
  { username: "admin", password: "admin123", source: "Common credential list", severity: "Critical" },
  { username: "root", password: "password", source: "Common credential list", severity: "Critical" },
  { username: "john", password: "john2024", source: "Dark web paste 2024", severity: "High" },
  { username: "sarah", password: "sarah123!", source: "Combolist 2023", severity: "High" },
  { username: "mike", password: "Welcome1", source: "Dark web paste 2023", severity: "Medium" },
];

export default function DarkWeb() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [emailResults, setEmailResults] = useState<any[]>([]);
  const [credResults, setCredResults] = useState<any[]>([]);
  const [emailSearched, setEmailSearched] = useState(false);
  const [credSearched, setCredSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  function checkEmail() {
    setLoading(true);
    setTimeout(() => {
      const results = LEAKED_DB.filter(entry =>
        entry.email.toLowerCase().includes(email.toLowerCase())
      );
      setEmailResults(results);
      setEmailSearched(true);
      setLoading(false);
    }, 1500);
  }

  function checkCredentials() {
    setLoading(true);
    setTimeout(() => {
      const results = CREDENTIAL_DB.filter(entry =>
        entry.username.toLowerCase().includes(username.toLowerCase())
      );
      setCredResults(results);
      setCredSearched(true);
      setLoading(false);
    }, 1500);
  }

  const severityColor = (s: string) =>
    s === "Critical" ? "#ef4444" : s === "High" ? "#f97316" : "#eab308";

  const severityBg = (s: string) =>
    s === "Critical" ? "#fee2e2" : s === "High" ? "#ffedd5" : "#fefce8";

  const severityText = (s: string) =>
    s === "Critical" ? "#b91c1c" : s === "High" ? "#c2410c" : "#854d0e";

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>Dark Web Monitor</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Check if your business emails or credentials have been exposed in known data breaches</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Email checker */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", marginBottom: 4 }}>Email Breach Check</h3>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Check if a business email appears in known data breaches</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && checkEmail()}
              placeholder="Enter email address..."
              style={{ flex: 1, padding: "9px 12px", borderRadius: 7, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13 }}
            />
            <button onClick={checkEmail} style={{ padding: "9px 16px", borderRadius: 7, border: "none", background: "#3b82f6", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              {loading ? "..." : "Check"}
            </button>
          </div>

          {emailSearched && (
            emailResults.length === 0 ? (
              <div style={{ background: "#0f2a1a", border: "1px solid #166534", borderRadius: 8, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
                <p style={{ color: "#22c55e", fontSize: 13, fontWeight: 500, margin: 0 }}>No breaches found for this email</p>
              </div>
            ) : (
              <div>
                <div style={{ background: "#2a0f0f", border: "1px solid #991b1b", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 500, margin: 0 }}>⚠ Found in {emailResults.length} breach{emailResults.length > 1 ? "es" : ""}</p>
                </div>
                {emailResults.map((r, i) => (
                  <div key={i} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#f8fafc", marginBottom: 4 }}>{r.source}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Date: {r.date}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Exposed: {r.type}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#f97316" }}>Action: Change this password immediately and enable 2FA</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Credential checker */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", marginBottom: 4 }}>Credential Exposure Check</h3>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Check if a username appears in dark web credential dumps</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && checkCredentials()}
              placeholder="Enter username..."
              style={{ flex: 1, padding: "9px 12px", borderRadius: 7, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13 }}
            />
            <button onClick={checkCredentials} style={{ padding: "9px 16px", borderRadius: 7, border: "none", background: "#3b82f6", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              {loading ? "..." : "Check"}
            </button>
          </div>

          {credSearched && (
            credResults.length === 0 ? (
              <div style={{ background: "#0f2a1a", border: "1px solid #166534", borderRadius: 8, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
                <p style={{ color: "#22c55e", fontSize: 13, fontWeight: 500, margin: 0 }}>No exposed credentials found</p>
              </div>
            ) : (
              <div>
                <div style={{ background: "#2a0f0f", border: "1px solid #991b1b", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 500, margin: 0 }}>⚠ Credentials found in {credResults.length} source{credResults.length > 1 ? "s" : ""}</p>
                </div>
                {credResults.map((r, i) => (
                  <div key={i} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#f8fafc" }}>{r.source}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: severityBg(r.severity), color: severityText(r.severity) }}>{r.severity}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Username: {r.username}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#f97316" }}>Action: Reset password immediately and audit all accounts using this username</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Tips section */}
      <div style={{ marginTop: 24, background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 16 }}>Best practices to reduce dark web exposure</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { title: "Use unique passwords", desc: "Never reuse passwords across business accounts. Use a password manager." },
            { title: "Enable 2FA everywhere", desc: "Two-factor authentication blocks 99% of credential-based attacks." },
            { title: "Monitor regularly", desc: "Check your business emails for breaches at least once a month." },
          ].map(tip => (
            <div key={tip.title} style={{ background: "#0f172a", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#3b82f6", marginBottom: 6 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
