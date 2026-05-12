import { useState } from "react";

interface CVEItem {
  id: string;
  description: string;
  severity: string;
  score: number;
  vector: string;
  published: string;
  modified: string;
  references: string[];
}

const severityColor = (s: string) =>
  s === "CRITICAL" ? "#ef4444" : s === "HIGH" ? "#f97316" : s === "MEDIUM" ? "#eab308" : s === "LOW" ? "#22c55e" : "#64748b";

const severityBg = (s: string) =>
  s === "CRITICAL" ? "#fee2e2" : s === "HIGH" ? "#ffedd5" : s === "MEDIUM" ? "#fefce8" : s === "LOW" ? "#dcfce7" : "#1e293b";

const severityText = (s: string) =>
  s === "CRITICAL" ? "#b91c1c" : s === "HIGH" ? "#c2410c" : s === "MEDIUM" ? "#854d0e" : s === "LOW" ? "#15803d" : "#64748b";

function parseCVEs(data: any): CVEItem[] {
  if (!data?.vulnerabilities) return [];
  return data.vulnerabilities.map((v: any) => {
    const cve = v.cve;
    const desc = cve.descriptions?.find((d: any) => d.lang === "en")?.value || "No description available.";
    const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0];
    const severity = metrics?.cvssData?.baseSeverity || metrics?.baseSeverity || "UNKNOWN";
    const score = metrics?.cvssData?.baseScore || metrics?.baseScore || 0;
    const vector = metrics?.cvssData?.vectorString || "N/A";
    const refs = (cve.references || []).slice(0, 3).map((r: any) => r.url);
    return {
      id: cve.id,
      description: desc,
      severity: severity.toUpperCase(),
      score,
      vector,
      published: cve.published?.split("T")[0] || "Unknown",
      modified: cve.lastModified?.split("T")[0] || "Unknown",
      references: refs,
    };
  });
}

export default function CVE() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CVEItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [total, setTotal] = useState(0);

  async function fetchCVEs(query: string) {
    setLoading(true);
    setError("");
    setSearched(false);

    try {
      let url = "";
      const trimmed = query.trim();

      if (/^CVE-\d{4}-\d+$/i.test(trimmed)) {
        url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${trimmed}`;
      } else {
        url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(trimmed)}&resultsPerPage=15`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`NVD API returned ${res.status}`);
      const data = await res.json();
      const parsed = parseCVEs(data);
      setResults(parsed);
      setTotal(data.totalResults || parsed.length);
      setSearched(true);
    } catch (err: any) {
      setError("Failed to fetch from NVD. The API may be rate-limited — wait 30 seconds and try again.");
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecent() {
    setLoading(true);
    setError("");
    setSearched(false);
    setSearch("");

    try {
      const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=15&startIndex=0`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`NVD API returned ${res.status}`);
      const data = await res.json();
      const parsed = parseCVEs(data);
      setResults(parsed);
      setTotal(data.totalResults || parsed.length);
      setSearched(true);
    } catch (err: any) {
      setError("Failed to fetch from NVD. Wait 30 seconds and try again.");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === "All" ? results : results.filter(r => r.severity === filter.toUpperCase());

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", margin: 0 }}>CVE Vulnerability Lookup</h2>
          <span style={{ fontSize: 11, fontWeight: 600, background: "#1d4ed8", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>LIVE — NIST NVD</span>
        </div>
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Real-time vulnerability data powered by the NIST National Vulnerability Database</p>
      </div>

      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search.trim() && fetchCVEs(search)}
            placeholder="Search by software name (Apache, Log4j) or CVE ID (CVE-2021-44228)..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: 7, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13 }}
          />
          <button
            onClick={() => search.trim() && fetchCVEs(search)}
            disabled={loading || !search.trim()}
            style={{ padding: "10px 20px", borderRadius: 7, border: "none", background: "#3b82f6", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500, opacity: loading || !search.trim() ? 0.6 : 1 }}>
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            onClick={fetchRecent}
            disabled={loading}
            style={{ padding: "10px 16px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            Latest CVEs
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
          Data sourced live from <a href="https://nvd.nist.gov" target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>nvd.nist.gov</a> — free public API, no key required. Rate limited to 5 requests per 30 seconds.
        </p>
      </div>

      {searched && results.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Filter:</span>
          {["All", "Critical", "High", "Medium", "Low"].map(level => (
            <button key={level} onClick={() => setFilter(level)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: filter === level ? "1px solid #3b82f6" : "1px solid #334155", background: filter === level ? "#1d4ed8" : "transparent", color: filter === level ? "#fff" : "#94a3b8" }}>{level}</button>
          ))}
          <span style={{ fontSize: 11, color: "#475569" }}>
            Showing {filtered.length} of {total.toLocaleString()} total results
          </span>
        </div>
      )}

      {error && (
        <div style={{ background: "#2a0f0f", border: "1px solid #991b1b", borderRadius: 10, padding: 16, marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>Fetching from NIST NVD...</p>
        </div>
      )}

      {searched && !loading && (
        filtered.length === 0 ? (
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <p style={{ color: "#64748b", fontSize: 14 }}>No CVEs found matching your search.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map(cve => (
              <div key={cve.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <a href={`https://nvd.nist.gov/vuln/detail/${cve.id}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6", fontFamily: "monospace", textDecoration: "none" }}>
                    {cve.id}
                  </a>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: severityBg(cve.severity), color: severityText(cve.severity) }}>
                    {cve.severity}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    CVSS: <span style={{ color: severityColor(cve.severity), fontWeight: 600 }}>{cve.score}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>Published: {cve.published}</span>
                  <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>Modified: {cve.modified}</span>
                </div>

                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10, lineHeight: 1.6 }}>{cve.description}</p>

                <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, marginBottom: cve.references.length > 0 ? 10 : 0, borderLeft: "3px solid #334155" }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Vector: </span>
                  <span style={{ fontSize: 11, color: "#e2e8f0", fontFamily: "monospace" }}>{cve.vector}</span>
                </div>

                {cve.references.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>References:</span>
                    {cve.references.map((ref, i) => (
                      <a key={i} href={ref} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: "#3b82f6", textDecoration: "none" }}>
                        [{i + 1}]
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {!searched && !loading && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>Search for a CVE ID or software name, or click Latest CVEs</p>
          <p style={{ color: "#475569", fontSize: 12 }}>Try: CVE-2021-44228, Apache, Log4j, Windows, OpenSSL</p>
        </div>
      )}
    </div>
  );
}
