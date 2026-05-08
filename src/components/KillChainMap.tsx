const KILL_CHAIN_STAGES = [
  { id: 1, name: "Reconnaissance", short: "Recon", color: "#6366f1" },
  { id: 2, name: "Weaponization", short: "Weapon", color: "#8b5cf6" },
  { id: 3, name: "Delivery", short: "Delivery", color: "#f59e0b" },
  { id: 4, name: "Exploitation", short: "Exploit", color: "#ef4444" },
  { id: 5, name: "Installation", short: "Install", color: "#dc2626" },
  { id: 6, name: "Command & Control", short: "C2", color: "#991b1b" },
  { id: 7, name: "Actions on Objectives", short: "Exfil", color: "#7f1d1d" },
];

interface Alert {
  event: string;
  risk: string;
  details: string;
  action?: string;
  killChainPhase?: string;
}

interface KillChainMapProps {
  alerts: Alert[];
}

export default function KillChainMap({ alerts }: KillChainMapProps) {
  const stageHits = KILL_CHAIN_STAGES.map((stage) => {
    const matched = alerts.filter((a) => a.killChainPhase === stage.name);
    return { ...stage, count: matched.length, alerts: matched };
  });

  const totalMapped = stageHits.reduce((sum, stage) => sum + stage.count, 0);
  const deepestStage = [...stageHits].reverse().find((stage) => stage.count > 0);

  if (alerts.length === 0) return null;

  return (
    <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 18, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ color: "#818cf8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Cyber Kill Chain</div>
          <h2 style={{ margin: 0, fontSize: 17, color: "#f8fafc" }}>Attack Progression Map</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Automatically maps detected alerts to the attacker lifecycle.</p>
        </div>
        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: totalMapped > 0 ? "#f8fafc" : "#64748b" }}>{totalMapped}/{alerts.length}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>events mapped</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(90px, 1fr))", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {stageHits.map((stage) => {
          const isActive = stage.count > 0;
          const isDeepest = deepestStage?.id === stage.id;
          return (
            <div key={stage.id} style={{ minWidth: 90, borderRadius: 12, padding: "12px 10px", background: isActive ? `${stage.color}1f` : "#020617", border: `1px solid ${isActive ? stage.color : "#273449"}`, position: "relative" }}>
              {isDeepest && (
                <div style={{ position: "absolute", top: -9, right: 8, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999 }}>DEEPEST</div>
              )}
              <div style={{ height: 8, width: 8, borderRadius: "50%", background: isActive ? stage.color : "#334155", marginBottom: 10, boxShadow: isActive ? `0 0 12px ${stage.color}` : "none" }} />
              <div style={{ color: isActive ? "#f8fafc" : "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{stage.short}</div>
              <div style={{ color: isActive ? stage.color : "#475569", fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{stage.count}</div>
              <div style={{ color: "#64748b", fontSize: 10, marginTop: 6, lineHeight: 1.25 }}>Stage {stage.id}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginTop: 12, marginBottom: 16 }}>
        {stageHits.map((stage) => (
          <div key={stage.id} style={{ height: 4, borderRadius: 999, background: stage.count > 0 ? stage.color : "#273449" }} />
        ))}
      </div>

      {deepestStage ? (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 12, padding: "12px 14px", color: "#fecaca", fontSize: 13, marginBottom: 14 }}>
          <strong>Deepest detected stage:</strong> Stage {deepestStage.id} — {deepestStage.name}.{" "}
          {deepestStage.id <= 2 ? "This appears early-stage; monitor and block suspicious sources." : deepestStage.id <= 4 ? "This suggests active intrusion behavior; isolate affected systems." : "This suggests advanced compromise; begin incident response immediately."}
        </div>
      ) : (
        <div style={{ background: "#020617", border: "1px solid #273449", borderRadius: 12, padding: "12px 14px", color: "#94a3b8", fontSize: 13, marginBottom: 14 }}>
          No alerts have been mapped to the Cyber Kill Chain yet.
        </div>
      )}

      {stageHits.some((stage) => stage.count > 0) && (
        <details>
          <summary style={{ cursor: "pointer", color: "#93c5fd", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>View mapped stage details</summary>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>
            {stageHits.filter((stage) => stage.count > 0).map((stage) => (
              <div key={stage.id} style={{ background: "#020617", border: `1px solid ${stage.color}55`, borderRadius: 12, padding: 12 }}>
                <div style={{ color: stage.color, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Stage {stage.id}: {stage.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {stage.alerts.map((alert, index) => (
                    <span key={`${alert.event}-${index}`} style={{ fontSize: 11, color: "#cbd5e1", background: "rgba(255,255,255,0.04)", border: "1px solid #273449", borderRadius: 999, padding: "4px 8px" }}>
                      {alert.event}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
