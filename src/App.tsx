import { useState } from "react";
import { useThreatAnalysis } from "./hooks/useThreatAnalysis";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import KillChainMap from "./components/KillChainMap";

const SAMPLE_LOGS = `2026-05-06 08:11:02 PORT_SCAN source=45.22.11.9 target=10.0.0.14 ports=21,22,80,443
2026-05-06 08:13:44 CVE_DETECTED host=web-server-01 cve=CVE-2025-1974 severity=critical service=Apache
2026-05-06 08:15:12 MALWARE detected host=finance-workstation malware=Trojan.Injector severity=high
2026-05-06 08:17:29 DNS_TUNNELING suspected_host=10.0.0.8 domain=ajsd81as8d1.company-update.xyz
2026-05-06 08:20:55 DATA_EXFILTRATION host=db-server bytes=842398234 destination=185.220.101.14 protocol=https
2026-05-06 08:23:01 DARKWEB_MENTION email=j.smith@company.com breach_source=forum_dump confidence=high
2026-05-06 08:25:47 RANSOMWARE_ACTIVITY host=hr-workstation encrypted_files=1542 extension=.locked
2026-05-06 08:27:18 CONNECTION_ATTEMPT ip=185.220.101.1 destination=unknown-port
2026-05-06 08:29:51 PRIVILEGE_ESCALATION user=jdoe host=server-01 method=sudo
2026-05-06 08:31:02 FAILED_MFA user=ceo@company.com ip=88.14.22.7
2026-05-06 08:33:15 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-06 08:33:18 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-06 08:33:21 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-06 08:33:24 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-06 08:33:27 LOGIN_FAILED user=admin ip=192.168.1.50`;

const STAGE_ORDER = ["Reconnaissance","Weaponization","Delivery","Exploitation","Installation","Command & Control","Actions on Objectives"];

const RISK_COLORS: Record<string, string> = { High: "#ef4444", Medium: "#f97316", Low: "#22c55e" };

const cardStyle: React.CSSProperties = { background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 18 };

const buttonStyle: React.CSSProperties = { padding: "9px 16px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#cbd5e1", fontSize: 13, cursor: "pointer" };

const riskBadgeStyle = (risk: string): React.CSSProperties => ({
  display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
  background: risk === "High" ? "#7f1d1d" : risk === "Medium" ? "#7c2d12" : "#14532d",
  color: risk === "High" ? "#fecaca" : risk === "Medium" ? "#fed7aa" : "#bbf7d0",
});

const riskDot = (risk: string) =>
  risk === "High" ? "#ef4444" : risk === "Medium" ? "#f97316" : "#22c55e";

function extractTimestamp(details: string): string {
  const m = details.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  return m ? m[0] : "Unknown time";
}

export default function App() {
  const [input, setInput] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [fileName, setFileName] = useState("");
  const [showInput, setShowInput] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const { alerts, totalLogs, analyzeLogs, clearAnalysis } = useThreatAnalysis();

  const highCount = alerts.filter((a: any) => a.risk === "High").length;
  const medCount = alerts.filter((a: any) => a.risk === "Medium").length;
  const overallRisk = highCount > 0 ? "High" : medCount > 0 ? "Medium" : alerts.length > 0 ? "Low" : "None";

  const deepestStage = alerts
    .map((a: any) => a.killChainPhase)
    .filter(Boolean)
    .sort((a: string, b: string) => STAGE_ORDER.indexOf(b) - STAGE_ORDER.indexOf(a))[0] || "None";

  const typeCounts = alerts.reduce((acc: Record<string, number>, a: any) => {
    acc[a.event] = (acc[a.event] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(typeCounts).map(([name, count]) => ({ name, count }));
  const pieData = [
    { name: "High", value: highCount },
    { name: "Medium", value: medCount },
    { name: "Low", value: alerts.filter((a: any) => a.risk === "Low").length },
  ].filter(d => d.value > 0);

  const filtered = riskFilter === "All" ? alerts : alerts.filter((a: any) => a.risk === riskFilter);

  function readFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setInput(text);
      analyzeLogs(text);
    };
    reader.readAsText(file);
  }

  function handleClear() { setInput(""); setFileName(""); setRiskFilter("All"); setShowTimeline(false); clearAnalysis(); }
  function handleSample() { setInput(SAMPLE_LOGS); setFileName(""); analyzeLogs(SAMPLE_LOGS); }

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", fontFamily: "Inter, Segoe UI, sans-serif", padding: "28px 20px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Total logs", value: totalLogs || "—" },
            { label: "Alerts", value: alerts.length || "—" },
            { label: "Overall risk", value: overallRisk, color: overallRisk === "High" ? "#f87171" : "#f8fafc" },
            { label: "Deepest stage", value: deepestStage, color: deepestStage !== "None" ? "#38bdf8" : "#f8fafc" },
          ].map(card => (
            <div key={card.label} style={cardStyle}>
              <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: (card as any).color || "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showInput ? 14 : 0 }}>
            <div>
              <h2 style={{ fontSize: 16, margin: 0, color: "#f8fafc" }}>Log Input</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Paste logs, upload a file, or load sample test data.</p>
            </div>
            <button style={buttonStyle} onClick={() => setShowInput(!showInput)}>{showInput ? "Hide" : "Show"}</button>
          </div>
          {showInput && (
            <>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) readFile(file); }}
                style={{ border: "1px dashed #334155", borderRadius: 12, padding: 16, background: "#0f172a", textAlign: "center", marginBottom: 12 }}>
                <label style={{ cursor: "pointer", color: "#93c5fd" }}>
                  Upload log file
                  <input type="file" accept=".log,.txt,.csv" style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (file) readFile(file); }} />
                </label>
                <span style={{ color: "#64748b", fontSize: 13 }}> or drag and drop here</span>
                {fileName && <p style={{ color: "#22c55e", fontSize: 12, marginTop: 8 }}>Loaded: {fileName}</p>}
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste log lines here..."
                style={{ width: "100%", height: 115, padding: 14, fontFamily: "monospace", fontSize: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "#e2e8f0", resize: "vertical", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button onClick={() => analyzeLogs(input)} style={{ ...buttonStyle, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700 }}>Analyze logs</button>
                <button onClick={handleSample} style={buttonStyle}>Load sample</button>
                <button onClick={handleClear} style={buttonStyle}>Clear</button>
              </div>
            </>
          )}
        </div>

        {alerts.length > 0 && <KillChainMap alerts={alerts} />}

        {alerts.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Alerts by Type</h3>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Risk Breakdown</h3>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                    {pieData.map(entry => <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {alerts.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowTimeline(!showTimeline)}>
              <div>
                <h3 style={{ fontSize: 15, margin: 0, color: "#f8fafc" }}>Event Timeline</h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Chronological view of all detected alerts</p>
              </div>
              <button style={buttonStyle}>{showTimeline ? "Hide" : "Show"}</button>
            </div>

            {showTimeline && (
              <div style={{ marginTop: 20, position: "relative" }}>
                <div style={{ position: "absolute", left: 18, top: 0, bottom: 0, width: 2, background: "#1f2937" }} />
                {alerts.map((a: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20, position: "relative" }}>
                    <div style={{ width: 38, flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 2, position: "relative", zIndex: 1 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: riskDot(a.risk), border: "2px solid #020617", boxShadow: `0 0 8px ${riskDot(a.risk)}` }} />
                    </div>
                    <div style={{ flex: 1, background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, color: "#f8fafc", fontSize: 13 }}>{a.event}</span>
                          <span style={riskBadgeStyle(a.risk)}>{a.risk}</span>
                          {a.killChainPhase && (
                            <span style={{ fontSize: 11, color: "#38bdf8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 999, padding: "2px 8px" }}>{a.killChainPhase}</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{extractTimestamp(a.details)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", marginBottom: 6 }}>{a.details}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>→ {a.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {alerts.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
              <h3 style={{ fontSize: 15, margin: 0 }}>Detected Alerts</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["All", "High", "Medium", "Low"].map(level => (
                  <button key={level} onClick={() => setRiskFilter(level)} style={{ padding: "5px 11px", borderRadius: 999, border: riskFilter === level ? "1px solid #60a5fa" : "1px solid #334155", background: riskFilter === level ? "#1d4ed8" : "transparent", color: riskFilter === level ? "#fff" : "#94a3b8", fontSize: 12, cursor: "pointer" }}>{level}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    {["Event", "Risk", "Kill Chain", "Details", "Action"].map(h => (
                      <th key={h} style={{ padding: "10px", textAlign: "left", color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any, i: number) => (
                    <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1f2937" : "none" }}>
                      <td style={{ padding: 10, color: "#f8fafc" }}>{a.event}</td>
                      <td style={{ padding: 10 }}><span style={riskBadgeStyle(a.risk)}>{a.risk}</span></td>
                      <td style={{ padding: 10, color: "#38bdf8" }}>{a.killChainPhase || "Unmapped"}</td>
                      <td style={{ padding: 10, color: "#94a3b8", fontFamily: "monospace", fontSize: 11, maxWidth: 360 }}>{a.details}</td>
                      <td style={{ padding: 10, color: "#cbd5e1" }}>{a.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {alerts.length === 0 && totalLogs === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            Load sample data or paste logs above to begin analysis.
          </div>
        )}
      </div>
    </div>
  );
}
