import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Threat Dashboard" },
    { path: "/darkweb", label: "Dark Web Monitor" },
    { path: "/cve", label: "CVE Lookup" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif" }}>
      <nav style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "0 24px", display: "flex", alignItems: "center", gap: 32, height: 64, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="EyeSOC" style={{ height: 48, width: "auto" }} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 13, textDecoration: "none",
              background: location.pathname === item.path ? "#1e293b" : "transparent",
              color: location.pathname === item.path ? "#f8fafc" : "#64748b",
              fontWeight: location.pathname === item.path ? 500 : 400,
            }}>{item.label}</Link>
          ))}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
