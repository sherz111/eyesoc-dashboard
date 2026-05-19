import { API_BASE } from "./apiBase";
import { useMemo, useState } from "react";
import { useThreatAnalysis } from "./hooks/useThreatAnalysis";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import KillChainMap from "./components/KillChainMap";
import { WorkbookPanel, withAuth } from "./AuthWorkbook";

const SAMPLE_LOGS = `2026-05-07 09:10:11 PORT_SCAN source=45.22.11.9 target=10.0.0.14 ports=21,22,80,443
2026-05-07 09:11:03 CVE_DETECTED host=web-server-01 cve=CVE-2025-1974 severity=critical service=Apache
2026-05-07 09:11:58 CONNECTION_ATTEMPT ip=185.220.101.1 destination=8443 protocol=tcp
2026-05-07 09:12:22 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-07 09:12:25 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-07 09:12:28 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-07 09:12:31 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-07 09:12:34 LOGIN_FAILED user=admin ip=192.168.1.50
2026-05-07 09:13:10 PRIVILEGE_ESCALATION user=jdoe host=server-01 method=sudo
2026-05-07 09:13:42 FAILED_MFA user=ceo@company.com ip=88.14.22.7
2026-05-07 09:14:18 MALWARE detected host=finance-workstation malware=Trojan.Injector severity=high
2026-05-07 09:15:02 DNS_TUNNELING suspected_host=10.0.0.8 domain=ajsd81as8d1.company-update.xyz
2026-05-07 09:15:49 DARKWEB_MENTION email=j.smith@company.com breach_source=forum_dump confidence=high
2026-05-07 09:16:27 DATA_EXFILTRATION host=db-server bytes=842398234 destination=185.220.101.14 protocol=https
2026-05-07 09:17:15 RANSOMWARE_ACTIVITY host=hr-workstation encrypted_files=1542 extension=.locked`;

const STREAM_LOGS = SAMPLE_LOGS.split("\n").filter(Boolean);

const STAGE_ORDER = [
  "Reconnaissance", "Weaponization", "Delivery", "Exploitation",
  "Installation", "Command & Control", "Actions on Objectives",
];

const RISK_COLORS: Record<string, string> = {
  High: "#ef4444", Medium: "#f97316", Low: "#22c55e",
};

const MITRE_MAP: Record<string, { tactic: string; technique: string; id: string }> = {
  "Port Scan": { tactic: "Reconnaissance", technique: "Active Scanning", id: "T1595" },
  "Known Vulnerability": { tactic: "Initial Access", technique: "Exploit Public-Facing Application", id: "T1190" },
  "Malware Detected": { tactic: "Execution", technique: "User Execution / Malware", id: "T1204" },
  "DNS Tunneling": { tactic: "Command and Control", technique: "DNS Application Layer Protocol", id: "T1071.004" },
  "Data Exfiltration": { tactic: "Exfiltration", technique: "Exfiltration Over Web Service", id: "T1567" },
  "Dark Web Exposure": { tactic: "Credential Access", technique: "Credentials from Leaks", id: "T1555" },
  "Ransomware Activity": { tactic: "Impact", technique: "Data Encrypted for Impact", id: "T1486" },
  "Suspicious Connection": { tactic: "Command and Control", technique: "Application Layer Protocol", id: "T1071" },
  "Privilege Escalation": { tactic: "Privilege Escalation", technique: "Valid Accounts / Privilege Abuse", id: "T1078" },
  "Failed MFA Attempt": { tactic: "Credential Access", technique: "MFA Request Generation", id: "T1621" },
  "Brute Force": { tactic: "Credential Access", technique: "Brute Force", id: "T1110" },
  "Repeated Failed Logins": { tactic: "Credential Access", technique: "Brute Force", id: "T1110" },
  "Failed Login": { tactic: "Credential Access", technique: "Brute Force", id: "T1110" },
  "Suspicious IP": { tactic: "Command and Control", technique: "External Connection", id: "T1105" },
  "Privileged Access": { tactic: "Privilege Escalation", technique: "Valid Accounts", id: "T1078" },
};

const cardStyle: React.CSSProperties = {
  background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 18,
};

const buttonStyle: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 10, border: "1px solid #334155",
  background: "#1e293b", color: "#cbd5e1", fontSize: 13, cursor: "pointer",
};

const riskBadgeStyle = (risk: string): React.CSSProperties => ({
  display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
  background: risk === "High" ? "#7f1d1d" : risk === "Medium" ? "#7c2d12" : "#14532d",
  color: risk === "High" ? "#fecaca" : risk === "Medium" ? "#fed7aa" : "#bbf7d0",
});

function extractTimestamp(details: string): string {
  const m = details.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  return m ? m[0] : "Unknown time";
}

function extractIPs(text: string) {
  const ips = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
  return Array.from(new Set(ips)).filter((ip) => !isPrivateIp(ip));
}

function isPrivateIp(ip: string) {
  return ip.startsWith("10.") || ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) || ip.startsWith("127.");
}

function getCorrelations(alerts: any[]) {
  const events = new Set(alerts.map((a) => a.event));
  const phases = new Set(alerts.map((a) => a.killChainPhase));
  const correlations = [];
  if (events.has("Port Scan") && (events.has("Known Vulnerability") || events.has("Brute Force")))
    correlations.push({ title: "Reconnaissance followed by access attempt", severity: "High", description: "Scanning activity was followed by exploitation or credential attack behavior." });
  if (events.has("Brute Force") && (events.has("Privilege Escalation") || events.has("Privileged Access")))
    correlations.push({ title: "Possible account compromise path", severity: "High", description: "Repeated login failures combined with privileged activity may indicate credential compromise." });
  if (phases.has("Command & Control") && phases.has("Actions on Objectives"))
    correlations.push({ title: "Possible active compromise", severity: "Critical", description: "Command-and-control behavior appears alongside exfiltration or impact activity." });
  if (events.has("Malware Detected") && events.has("Ransomware Activity"))
    correlations.push({ title: "Malware escalation to impact", severity: "Critical", description: "Malware activity appears to have progressed toward ransomware or business-impacting behavior." });
  return correlations;
}

function CollapsePanel({ title, subtitle, count, children }: {
  title: string; subtitle: string; count?: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid #1f2937" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "transparent", border: "none", color: "#e5e7eb", padding: "16px 0", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>
            {open ? "▾" : "▸"} {title}
            {typeof count === "number" && <span style={{ color: "#64748b", fontWeight: 500 }}> · {count}</span>}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{subtitle}</div>
        </div>
      </button>
      {open && <div style={{ paddingBottom: 18 }}>{children}</div>}
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState<"dashboard" | "workbook">("dashboard");
  const [input, setInput] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [fileName, setFileName] = useState("");
  const [showInput, setShowInput] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [ipReputation, setIpReputation] = useState<any[]>([]);
  const [checkingIps, setCheckingIps] = useState(false);

  const { alerts, totalLogs, analyzeLogs, clearAnalysis } = useThreatAnalysis();
  const publicIps = useMemo(() => extractIPs(input), [input]);

  const highCount = alerts.filter((a: any) => a.risk === "High").length;
  const medCount = alerts.filter((a: any) => a.risk === "Medium").length;
  const lowCount = alerts.filter((a: any) => a.risk === "Low").length;

  const overallRisk = highCount > 0 ? "High" : medCount > 0 ? "Medium" : alerts.length > 0 ? "Low" : "None";

  const deepestStage = alerts
    .map((a: any) => a.killChainPhase)
    .filter(Boolean)
    .sort((a: string, b: string) => STAGE_ORDER.indexOf(b) - STAGE_ORDER.indexOf(a))[0] || "None";

  const filtered = (riskFilter === "All" ? alerts : alerts.filter((a: any) => a.risk === riskFilter))
    .sort((a: any, b: any) => {
      const tA = extractTimestamp(a.details), tB = extractTimestamp(b.details);
      if (tA === "Unknown time") return 1;
      if (tB === "Unknown time") return -1;
      return new Date(tB).getTime() - new Date(tA).getTime();
    });

  const typeCounts = alerts.reduce((acc: Record<string, number>, a: any) => {
    acc[a.event] = (acc[a.event] || 0) + 1; return acc;
  }, {});

  const barData = Object.entries(typeCounts).map(([name, count]) => ({ name, count }));
  const pieData = [
    { name: "High", value: highCount },
    { name: "Medium", value: medCount },
    { name: "Low", value: lowCount },
  ].filter((d) => d.value > 0);

  const mitreRows = filtered.map((alert: any) => ({
    event: alert.event, risk: alert.risk,
    time: extractTimestamp(alert.details),
    ...MITRE_MAP[alert.event],
  })).filter((row) => row.id);

  const correlations = getCorrelations(alerts);

  async function checkIpReputation() {
    setCheckingIps(true);
    try {
      const results = await Promise.all(publicIps.map(async (ip) => {
        try {
          // ...
          const response = await fetch(`${API_BASE}/api/check-ip/${ip}`);
          const data = await response.json();
          return { ip, ok: response.ok, ...data };
        } catch { return { ip, ok: false, error: "Lookup failed" }; }
      }));
      setIpReputation(results);
    } finally { setCheckingIps(false); }
  }

  function readFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text); analyzeLogs(text); setIpReputation([]);
    };
    reader.readAsText(file);
  }

  function handleClear() {
    setInput(""); setFileName(""); setRiskFilter("All");
    setStreamIndex(0); setIpReputation([]); setShowTimeline(false);
    clearAnalysis();
  }

  function handleSample() {
    setInput(SAMPLE_LOGS); setFileName("");
    setStreamIndex(STREAM_LOGS.length); setIpReputation([]);
    analyzeLogs(SAMPLE_LOGS);
  }

  function handleStreamNext() {
    const nextLine = STREAM_LOGS[streamIndex];
    if (!nextLine) return;
    const nextInput = input ? `${input}\n${nextLine}` : nextLine;
    setInput(nextInput); setStreamIndex(streamIndex + 1);
    setIpReputation([]); analyzeLogs(nextInput);
  }

  function handleLoadInvestigation(logSnapshot: string) {
    setInput(logSnapshot); setFileName("");
    setStreamIndex(STREAM_LOGS.length); setIpReputation([]);
    analyzeLogs(logSnapshot);
    setActivePage("dashboard");
}

  const riskDot = (risk: string) =>
    risk === "High" ? "#ef4444" : risk === "Medium" ? "#f97316" : "#22c55e";

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", fontFamily: "Inter, Segoe UI, sans-serif", padding: "28px 20px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        <header style={{ marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, color: "#f8fafc" }}>EyeSOC</h1>
            <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 14 }}>
              Lightweight SOC visibility for logs, threat detection, live IP reputation, and attack mapping.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setActivePage("dashboard")} style={{ ...buttonStyle, background: activePage === "dashboard" ? "#2563eb" : "#1e293b", color: activePage === "dashboard" ? "#fff" : "#cbd5e1", fontWeight: activePage === "dashboard" ? 700 : 400 }}>Dashboard</button>
            <button onClick={() => setActivePage("workbook")} style={{ ...buttonStyle, background: activePage === "workbook" ? "#2563eb" : "#1e293b", color: activePage === "workbook" ? "#fff" : "#cbd5e1", fontWeight: activePage === "workbook" ? 700 : 400 }}>Workbook</button>
          </div>
        </header>

        {activePage === "workbook" ? (
          <WorkbookPanel
            currentAnalysis={alerts.length > 0 ? { logSnapshot: input, alertCount: alerts.length, overallRisk, deepestStage } : undefined}
            onLoadInvestigation={handleLoadInvestigation}
          />
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
              {[
                { label: "Total logs", value: totalLogs || "—" },
                { label: "Alerts", value: alerts.length || "—" },
                { label: "Overall risk", value: overallRisk, color: overallRisk === "High" ? "#f87171" : "#f8fafc" },
                { label: "Deepest stage", value: deepestStage, color: deepestStage !== "None" ? "#38bdf8" : "#f8fafc" },
              ].map((card) => (
                <div key={card.label} style={cardStyle}>
                  <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: (card as any).color || "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.value}</div>
                </div>
              ))}
            </section>

            <section style={{ ...cardStyle, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showInput ? 14 : 0, gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 16, margin: 0, color: "#f8fafc" }}>Log Input & Live Stream</h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Paste logs, upload a file, or stream demo events one at a time.</p>
                </div>
                <button style={buttonStyle} onClick={() => setShowInput(!showInput)}>{showInput ? "Hide" : "Show"}</button>
              </div>
              {showInput && (
                <>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) readFile(file); }}
                    style={{ border: "1px dashed #334155", borderRadius: 12, padding: 16, background: "#0f172a", textAlign: "center", marginBottom: 12 }}>
                    <label style={{ cursor: "pointer", color: "#93c5fd" }}>
                      Upload log file
                      <input type="file" accept=".log,.txt,.csv" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) readFile(file); }} />
                    </label>
                    <span style={{ color: "#64748b", fontSize: 13 }}> or drag and drop here</span>
                    {fileName && <p style={{ color: "#22c55e", fontSize: 12, marginTop: 8 }}>Loaded: {fileName}</p>}
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setIpReputation([]); }}
                    placeholder="Paste log lines here..."
                    style={{ width: "100%", height: 115, padding: 14, fontFamily: "monospace", fontSize: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "#e2e8f0", resize: "vertical", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button onClick={() => analyzeLogs(input)} style={{ ...buttonStyle, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700 }}>Analyze logs</button>
                    <button onClick={handleSample} style={buttonStyle}>Load sample</button>
                    <button onClick={handleStreamNext} disabled={streamIndex >= STREAM_LOGS.length} style={{ ...buttonStyle, opacity: streamIndex >= STREAM_LOGS.length ? 0.45 : 1 }}>Stream next event</button>
                    <button onClick={checkIpReputation} disabled={publicIps.length === 0 || checkingIps} style={{ ...buttonStyle, opacity: publicIps.length === 0 || checkingIps ? 0.45 : 1 }}>
                      {checkingIps ? "Checking IPs..." : "Check IP Reputation"}
                    </button>
                    <button onClick={handleClear} style={buttonStyle}>Clear</button>
                    <span style={{ alignSelf: "center", fontSize: 12, color: "#64748b" }}>Public IPs found: {publicIps.length}</span>
                  </div>
                </>
              )}
            </section>

            {alerts.length > 0 && <KillChainMap alerts={alerts} />}

            {alerts.length > 0 && (
              <section style={{ ...cardStyle, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, margin: 0 }}>Detected Alerts</h3>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Newest alerts are shown first.</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["All", "High", "Medium", "Low"].map((level) => (
                      <button key={level} onClick={() => setRiskFilter(level)} style={{ padding: "5px 11px", borderRadius: 999, border: riskFilter === level ? "1px solid #60a5fa" : "1px solid #334155", background: riskFilter === level ? "#1d4ed8" : "transparent", color: riskFilter === level ? "#fff" : "#94a3b8", fontSize: 12, cursor: "pointer" }}>{level}</button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #334155" }}>
                        {["Time", "Event", "Risk", "Kill Chain", "Details", "Action"].map((h) => (
                          <th key={h} style={{ padding: "10px", textAlign: "left", color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a: any, i: number) => (
                        <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1f2937" : "none" }}>
                          <td style={{ padding: 10, color: "#94a3b8", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{extractTimestamp(a.details)}</td>
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
              </section>
            )}

            {alerts.length > 0 && (
              <section style={{ ...cardStyle, marginBottom: 18 }}>
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
              </section>
            )}

            {alerts.length > 0 && (
              <section style={{ ...cardStyle, marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, margin: "0 0 4px", color: "#f8fafc" }}>Advanced Analysis</h3>
                <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 13 }}>Optional analyst details. Open only what you need.</p>

                <CollapsePanel title="Correlated Incident Findings" subtitle="Combines multiple alerts into higher-confidence incident patterns." count={correlations.length}>
                  {correlations.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>No correlated incident patterns detected yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {correlations.map((item, i) => (
                        <div key={i} style={{ background: item.severity === "Critical" ? "rgba(239,68,68,0.10)" : "rgba(249,115,22,0.10)", border: item.severity === "Critical" ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(249,115,22,0.25)", borderRadius: 12, padding: 12 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={riskBadgeStyle(item.severity === "Critical" ? "High" : "Medium")}>{item.severity}</span>
                            <strong style={{ color: "#f8fafc", fontSize: 13 }}>{item.title}</strong>
                          </div>
                          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsePanel>

                <CollapsePanel title="Live IP Reputation" subtitle="Checks public IPs from logs against AbuseIPDB through your local backend." count={ipReputation.length}>
                  {ipReputation.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Click "Check IP Reputation" above to run live lookups.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #334155" }}>
                            {["IP", "Score", "Country", "Usage", "ISP", "Reports", "Last Reported"].map((h) => (
                              <th key={h} style={{ padding: "10px", textAlign: "left", color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ipReputation.map((row) => (
                            <tr key={row.ip} style={{ borderBottom: "1px solid #1f2937" }}>
                              <td style={{ padding: 10, color: "#38bdf8", fontFamily: "monospace" }}>{row.ip}</td>
                              <td style={{ padding: 10 }}><span style={riskBadgeStyle(Number(row.abuseConfidenceScore || 0) >= 75 ? "High" : Number(row.abuseConfidenceScore || 0) >= 25 ? "Medium" : "Low")}>{row.abuseConfidenceScore ?? "—"}%</span></td>
                              <td style={{ padding: 10, color: "#cbd5e1" }}>{row.countryCode || "—"}</td>
                              <td style={{ padding: 10, color: "#cbd5e1" }}>{row.usageType || "—"}</td>
                              <td style={{ padding: 10, color: "#cbd5e1" }}>{row.isp || "—"}</td>
                              <td style={{ padding: 10, color: "#cbd5e1" }}>{row.totalReports ?? "—"}</td>
                              <td style={{ padding: 10, color: "#94a3b8" }}>{row.lastReportedAt || row.error || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CollapsePanel>

                <CollapsePanel title="Charts" subtitle="Visual summary of alert types and risk levels.">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 14 }}>
                      <h4 style={{ fontSize: 13, margin: "0 0 12px" }}>Alerts by Type</h4>
                      <ResponsiveContainer width="100%" height={190}>
                        <BarChart data={barData}>
                          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 14 }}>
                      <h4 style={{ fontSize: 13, margin: "0 0 12px" }}>Risk Breakdown</h4>
                      <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                            {pieData.map((entry) => (<Cell key={entry.name} fill={RISK_COLORS[entry.name]} />))}
                          </Pie>
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CollapsePanel>

                <CollapsePanel title="MITRE ATT&CK Context" subtitle="Maps alerts to likely attacker tactics and techniques." count={mitreRows.length}>
                  {mitreRows.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>No MITRE mappings available for the current alerts.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #334155" }}>
                            {["Time", "Alert", "Risk", "Tactic", "Technique", "ID"].map((h) => (
                              <th key={h} style={{ padding: "10px", textAlign: "left", color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mitreRows.map((row, i) => (
                            <tr key={`${row.event}-${row.id}-${i}`} style={{ borderBottom: i < mitreRows.length - 1 ? "1px solid #1f2937" : "none" }}>
                              <td style={{ padding: 10, color: "#94a3b8", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{row.time}</td>
                              <td style={{ padding: 10, color: "#f8fafc" }}>{row.event}</td>
                              <td style={{ padding: 10 }}><span style={riskBadgeStyle(row.risk)}>{row.risk}</span></td>
                              <td style={{ padding: 10, color: "#93c5fd" }}>{row.tactic}</td>
                              <td style={{ padding: 10, color: "#cbd5e1" }}>{row.technique}</td>
                              <td style={{ padding: 10, color: "#38bdf8", fontFamily: "monospace" }}>{row.id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CollapsePanel>
              </section>
            )}

            {alerts.length === 0 && totalLogs === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                Load sample data, stream demo events, or paste logs above to begin analysis.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(App);
