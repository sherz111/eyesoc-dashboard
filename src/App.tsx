import { useState } from "react";
import { useThreatAnalysis } from "./hooks/useThreatAnalysis";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const SAMPLE_LOGS = `2026-04-29 10:01:12 LOGIN_FAILED user=john ip=192.168.1.10
2026-04-29 10:01:20 LOGIN_FAILED user=john ip=192.168.1.10
2026-04-29 10:01:35 LOGIN_FAILED user=john ip=192.168.1.10
2026-04-29 10:01:48 LOGIN_FAILED user=john ip=192.168.1.10
2026-04-29 10:02:01 LOGIN_FAILED user=john ip=192.168.1.10
2026-04-29 10:03:44 PORT_SCAN source=10.0.0.55 target=10.0.0.12
2026-04-29 10:04:18 LOGIN_SUCCESS user=admin ip=172.16.0.5
2026-04-29 10:05:22 CONNECTION_ATTEMPT ip=45.33.21.10
2026-04-29 10:06:30 MALWARE detected host=workstation-02
2026-04-29 10:07:11 LOGIN_FAILED user=root ip=89.44.12.7`;

const RISK_COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f97316",
  Low: "#22c55e",
};

const riskBadgeStyle = (risk: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  background: risk === "High" ? "#fee2e2" : risk === "Medium" ? "#ffedd5" : "#dcfce7",
  color: risk === "High" ? "#b91c1c" : risk === "Medium" ? "#c2410c" : "#15803d",
});

export default function App() {
  const [input, setInput] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [fileName, setFileName] = useState("");
  const { alerts, totalLogs, analyzeLogs, clearAnalysis } = useThreatAnalysis();

  const highCount = alerts.filter((a: any) => a.risk === "High").length;
  const medCount = alerts.filter((a: any) => a.risk === "Medium").length;
  const overallRisk = highCount > 0 ? "High" : medCount > 0 ? "Medium" : alerts.length > 0 ? "Low" : "None";

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

  function handleClear() {
    setInput("");
    setFileName("");
    setRiskFilter("All");
    clearAnalysis();
  }

  function handleSample() {
    setInput(SAMPLE_LOGS);
    setFileName("");
    analyzeLogs(SAMPLE_LOGS);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#f8fafc" }}>EyeSOC</span>
          <span style={{ fontSize: 11, fontWeight: 600, background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>LIVE</span>
        </div>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>Threat detection dashboard — upload or paste security logs to begin analysis</p>

        {/* File upload drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) readFile(file);
          }}
          style={{ border: "1px dashed #334155", borderRadius: 8, padding: "20px 16px", background: "#1e293b", textAlign: "center", marginBottom: 12 }}>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 10 }}>Drag and drop a log file here, or</p>
          <label style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid #475569", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>
            Browse file
            <input
              type="file"
              accept=".log,.txt,.csv"
              style={{ display: "none" }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) readFile(file);
              }}
            />
          </label>
          {fileName && (
            <p style={{ color: "#22c55e", fontSize: 12, marginTop: 10 }}>Loaded: {fileName}</p>
          )}
        </div>

        {/* Textarea */}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Or paste log lines directly here..."
          style={{ width: "100%", height: 120, padding: "12px 14px", fontFamily: "monospace", fontSize: 12, borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", resize: "vertical", boxSizing: "border-box" }}
        />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, marginBottom: 28 }}>
          <button onClick={() => analyzeLogs(input)} style={{ padding: "9px 18px", borderRadius: 7, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 500, fontSize: 13, cursor: "pointer" }}>Analyze logs</button>
          <button onClick={handleSample} style={{ padding: "9px 18px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>Load sample</button>
          <button onClick={handleClear} style={{ padding: "9px 18px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>Clear</button>
        </div>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total logs", value: totalLogs || "—" },
            { label: "Alerts found", value: alerts.length || "—" },
            { label: "High risk", value: highCount || "—", color: highCount > 0 ? "#ef4444" : undefined },
            { label: "Overall risk", value: overallRisk, color: overallRisk === "High" ? "#ef4444" : overallRisk === "Medium" ? "#f97316" : overallRisk === "Low" ? "#22c55e" : undefined },
          ].map(card => (
            <div key={card.label} style={{ background: "#1e293b", borderRadius: 10, padding: "14px 16px", border: "1px solid #334155" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: card.color || "#f8fafc" }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {alerts.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, border: "1px solid #334155" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Alerts by type</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, border: "1px solid #334155" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Risk breakdown</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {pieData.map(entry => <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filter buttons */}
        {alerts.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Filter by risk:</span>
            {["All", "High", "Medium", "Low"].map(level => (
              <button key={level} onClick={() => setRiskFilter(level)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: riskFilter === level ? "1px solid #3b82f6" : "1px solid #334155", background: riskFilter === level ? "#1d4ed8" : "transparent", color: riskFilter === level ? "#fff" : "#94a3b8" }}>{level}</button>
            ))}
            <span style={{ fontSize: 11, color: "#475569" }}>{filtered.length} alert{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Alert table */}
        {alerts.length > 0 && (
          <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  {["Event type", "Risk", "Details", "Recommended action"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any, i: number) => (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #334155" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0f172a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "#f1f5f9" }}>{a.event}</td>
                    <td style={{ padding: "10px 14px" }}><span style={riskBadgeStyle(a.risk)}>{a.risk}</span></td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: "#94a3b8", wordBreak: "break-word", maxWidth: 320 }}>{a.details}</td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12 }}>{a.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {alerts.length === 0 && totalLogs === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#475569", fontSize: 14 }}>
            Upload a file or paste log lines above and click Analyze logs — or try Load sample
          </div>
        )}

      </div>
    </div>
  );
}

