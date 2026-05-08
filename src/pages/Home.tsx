import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    { icon: "🛡️", title: "Threat Detection", desc: "Analyze security logs to detect brute force attacks, port scans, malware, and suspicious IPs in real time.", path: "/dashboard" },
    { icon: "🌐", title: "Dark Web Monitor", desc: "Check if your business credentials or emails have been exposed in known data breaches on the dark web.", path: "/darkweb" },
    { icon: "🔍", title: "CVE Lookup", desc: "Search for known vulnerabilities in software your business uses and get recommended actions to patch them.", path: "/cve" },
    { icon: "⛓️", title: "Kill Chain Mapping", desc: "Automatically map detected threats to the Cyber Kill Chain to understand how far an attacker has progressed.", path: "/dashboard" },
    { icon: "📊", title: "Risk Scoring", desc: "Every alert is automatically scored as Low, Medium, or High risk so you know exactly what to prioritize.", path: "/dashboard" },
    { icon: "📁", title: "Log File Upload", desc: "Upload .log, .txt, or .csv files directly or drag and drop them onto the dashboard for instant analysis.", path: "/dashboard" },
  ];

  return (
    <div style={{ background: "#050d1a" }}>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px", backgroundImage: "url('/logo.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5, 13, 26, 0.82)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 700 }}>
          <div style={{ display: "inline-block", background: "rgba(30,41,59,0.8)", border: "1px solid #1e3a5f", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#60a5fa", marginBottom: 20, letterSpacing: "0.08em" }}>
            Built for small businesses — free and open source
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: "#f0f8ff", marginBottom: 16, lineHeight: 1.1, textShadow: "0 0 40px rgba(59,130,246,0.4)" }}>
            Enterprise security.<br />
            <span style={{ color: "#3b82f6" }}>Small business price.</span>
          </h1>
          <p style={{ fontSize: 16, color: "#93c5fd", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.8 }}>
            EyeSOC is a Mini SOC Threat Detection Dashboard designed to give small businesses the same security visibility as large enterprises — without the complexity, cost, or dedicated security team. Detect threats in real time, monitor dark web exposure, track CVE vulnerabilities, and map attacks to the Cyber Kill Chain, all in one place.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 48, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/dashboard")} style={{ padding: "13px 30px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
              Open Dashboard
            </button>
            <button onClick={() => navigate("/darkweb")} style={{ padding: "13px 30px", borderRadius: 8, border: "1px solid #1e3a5f", background: "rgba(30,41,59,0.6)", color: "#93c5fd", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Check Dark Web
            </button>
            <button onClick={() => navigate("/cve")} style={{ padding: "13px 30px", borderRadius: 8, border: "1px solid #1e3a5f", background: "rgba(30,41,59,0.6)", color: "#93c5fd", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              CVE Lookup
            </button>
          </div>
          <div style={{ color: "#1e3a5f", fontSize: 13 }}>↓ scroll down to explore</div>
        </div>
      </div>

      <div style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 700, color: "#e0f2fe", marginBottom: 12 }}>Everything you need to stay protected</h2>
        <p style={{ textAlign: "center", color: "#60a5fa", fontSize: 14, marginBottom: 40 }}>Six powerful tools. One lightweight dashboard.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 60 }}>
          {features.map(f => (
            <div key={f.title} onClick={() => navigate(f.path)}
              style={{ background: "rgba(10,25,50,0.8)", border: "1px solid #1e3a5f", borderRadius: 12, padding: 28, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b82f6")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e3a5f")}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e0f2fe", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#60a5fa", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(10,25,50,0.8)", border: "1px solid #1e3a5f", borderRadius: 12, padding: "32px 40px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, textAlign: "center", marginBottom: 60 }}>
          {[
            { value: "10+", label: "Threat detections" },
            { value: "100+", label: "CVEs tracked" },
            { value: "7", label: "Kill Chain stages" },
            { value: "Free", label: "Always free" },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6", marginBottom: 6 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#60a5fa" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(10,25,50,0.8)", border: "1px solid #1e3a5f", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e0f2fe", marginBottom: 12 }}>About EyeSOC</h3>
          <p style={{ fontSize: 14, color: "#60a5fa", lineHeight: 1.8, maxWidth: 700, margin: "0 auto 20px" }}>
            EyeSOC was built as a Mini SOC Threat Detection Dashboard project to prove that small businesses don't need enterprise budgets to have enterprise-grade security visibility. Starting from a plain HTML file, we built a full React and TypeScript application featuring real-time log analysis, Cyber Kill Chain mapping, dark web monitoring, and CVE vulnerability tracking. Our goal is to make cybersecurity accessible to every business, no matter the size.
          </p>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Try it now
          </button>
        </div>
      </div>
    </div>
  );
}
