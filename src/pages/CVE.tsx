import { useState } from "react";

const CVE_DB = [
  { id: "CVE-2024-1234", software: "Apache", version: "2.4.51", severity: "Critical", score: 9.8, desc: "Remote code execution vulnerability in Apache HTTP Server allowing unauthenticated attackers to execute arbitrary code.", action: "Upgrade to Apache 2.4.52 or later immediately." },
  { id: "CVE-2024-5678", software: "OpenSSL", version: "1.1.1", severity: "High", score: 8.1, desc: "Buffer overflow in OpenSSL allows remote attackers to cause denial of service or execute arbitrary code.", action: "Update to OpenSSL 3.0 or later. Apply vendor patches." },
  { id: "CVE-2023-9999", software: "WordPress", version: "6.3", severity: "High", score: 7.5, desc: "SQL injection vulnerability in WordPress core allowing attackers to extract sensitive data from the database.", action: "Update to WordPress 6.4 or later. Review database permissions." },
  { id: "CVE-2023-4444", software: "Log4j", version: "2.14", severity: "Critical", score: 10.0, desc: "Log4Shell vulnerability allowing remote code execution via JNDI injection in log messages.", action: "Upgrade to Log4j 2.17.1 or later. Block JNDI lookups at firewall." },
  { id: "CVE-2023-3333", software: "Windows", version: "10", severity: "High", score: 8.8, desc: "Privilege escalation vulnerability in Windows 10 allowing local users to gain SYSTEM level privileges.", action: "Apply Microsoft security patch KB5028166 immediately." },
  { id: "CVE-2023-2222", software: "PHP", version: "8.0", severity: "Medium", score: 6.5, desc: "Type confusion vulnerability in PHP allowing remote attackers to bypass security restrictions.", action: "Upgrade to PHP 8.1 or later." },
  { id: "CVE-2022-1111", software: "MySQL", version: "8.0.26", severity: "Medium", score: 5.9, desc: "Information disclosure vulnerability in MySQL Server allowing authenticated users to access unauthorized data.", action: "Update to MySQL 8.0.27 or later." },
  { id: "CVE-2022-7890", software: "nginx", version: "1.20", severity: "High", score: 7.8, desc: "Heap buffer overflow in nginx HTTP/2 implementation allowing remote denial of service.", action: "Upgrade to nginx 1.21 or apply vendor patch." },
  { id: "CVE-2024-9876", software: "Chrome", version: "119", severity: "Critical", score: 9.1, desc: "Use-after-free vulnerability in Chrome V8 engine allowing remote code execution via malicious web pages.", action: "Update Chrome to version 120 or later immediately." },
  { id: "CVE-2023-5555", software: "VMware", version: "ESXi 7.0", severity: "Critical", score: 9.8, desc: "Heap overflow vulnerability in VMware ESXi allowing guest-to-host escape and full hypervisor compromise.", action: "Apply VMware security advisory VMSA-2023-0001 patch immediately." },
];

const severityColor = (s: string) =>
  s === "Critical" ? "#ef4444" : s === "High" ? "#f97316" : s === "Medium" ? "#eab308" : "#22c55e";

const severityBg = (s: string) =>
  s === "Critical" ? "#fee2e2" : s === "High" ? "#ffedd5" : s === "Medium" ? "#fefce8" : "#dcfce7";

const severityText = (s: string) =>
  s === "Critical" ? "#b91c1c" : s === "High" ? "#c2410c" : s === "Medium" ? "#854d0e" : "#15803d";

export default function CVE() {
  const [search, setSearch] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  function handleSearch() {
    setLoading(true);
    setTimeout(() => {
      const r = CVE_DB.filter(cve =>
        cve.id.toLowerCase().includes(search.toLowerCase()) ||
        cve.software.toLowerCase().includes(search.toLowerCase())
      );
      setResults(r);
      setSearched(true);
      setLoading(false);
    }, 1000);
  }

  function showAll() {
    setLoading(true);
    setTimeout(() => {
      setResults(CVE_DB);
      setSearched(true);
      setSearch("");
      setLoading(false);
    }, 800);
  }

  const filtered = filter === "All" ? results : results.filter(r => r.severity === filter);

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>CVE Vulnerability Lookup</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Search for known vulnerabilities by software name or CVE ID and get recommended actions</p>
      </div>

      {/* Search bar */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search by software name (e.g. Apache, WordPress) or CVE ID..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: 7, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13 }}
          />
          <button onClick={handleSearch} style={{ padding: "10px 20px", borderRadius: 7, border: "none", background: "#3b82f6", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            {loading ? "Searching..." : "Search"}
          </button>
          <button onClick={showAll} style={{ padding: "10px 16px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>
            Show all
          </button>
        </div>
      </div>

      {/* Filter */}
      {searched && results.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Filter:</span>
          {["All", "Critical", "High", "Medium"].map(level => (
            <button key={level} onClick={() => setFilter(level)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: filter === level ? "1px solid #3b82f6" : "1px solid #334155", background: filter === level ? "#1d4ed8" : "transparent", color: filter === level ? "#fff" : "#94a3b8" }}>{level}</button>
          ))}
          <span style={{ fontSize: 11, color: "#475569" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Results */}
      {searched && (
        filtered.length === 0 ? (
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <p style={{ color: "#64748b", fontSize: 14 }}>No CVEs found matching your search.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map(cve => (
              <div key={cve.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6", fontFamily: "monospace" }}>{cve.id}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: severityBg(cve.severity), color: severityText(cve.severity) }}>{cve.severity}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>CVSS Score: <span style={{ color: severityColor(cve.severity), fontWeight: 600 }}>{cve.score}</span></span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Affects: <span style={{ color: "#f8fafc" }}>{cve.software} {cve.version}</span></span>
                </div>
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10, lineHeight: 1.6 }}>{cve.desc}</p>
                <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, borderLeft: "3px solid #3b82f6" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Recommended action: </span>
                  <span style={{ fontSize: 12, color: "#e2e8f0" }}>{cve.action}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {!searched && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>Search for a software name or click Show all to browse all CVEs</p>
          <p style={{ color: "#475569", fontSize: 12 }}>Try searching: Apache, WordPress, Log4j, Windows, MySQL</p>
        </div>
      )}
    </div>
  );
}
