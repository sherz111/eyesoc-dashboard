import { useState } from "react";

export interface Alert {
  event: string;
  risk: "High" | "Medium" | "Low";
  details: string;
  action: string;
  killChainPhase?: string;
}

const SUSPICIOUS_IPS = ["45.33.21.10", "89.44.12.7", "185.199.108.153", "185.220.101.14", "185.220.101.1"];

function extractIP(log: string): string {
  const m = log.match(/ip=([0-9.]+)/) || log.match(/from ([0-9.]+)/) || log.match(/source=([0-9.]+)/);
  return m ? m[1] : "Unknown";
}

export function useThreatAnalysis() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);

  function analyzeLogs(text: string) {
    const lines = text.split("\n").filter(l => l.trim());
    const result: Alert[] = [];
    const failedByIP: Record<string, number> = {};

    lines.forEach(log => {
      const ip = extractIP(log);

      if (log.includes("LOGIN_FAILED") || log.includes("Failed password")) {
        failedByIP[ip] = (failedByIP[ip] || 0) + 1;
      }

      if (log.includes("PORT_SCAN")) {
        result.push({ event: "Port Scan", risk: "High", details: log.trim(), action: "Investigate source IP. Block if unauthorized.", killChainPhase: "Reconnaissance" });
      }

      if (log.includes("CVE_DETECTED")) {
        result.push({ event: "CVE Detected", risk: "High", details: log.trim(), action: "Patch affected service immediately.", killChainPhase: "Exploitation" });
      }

      if (log.includes("MALWARE") || log.includes("VIRUS")) {
        result.push({ event: "Malware Detected", risk: "High", details: log.trim(), action: "Isolate host and run a full malware scan immediately.", killChainPhase: "Installation" });
      }

      if (log.includes("DNS_TUNNELING")) {
        result.push({ event: "DNS Tunneling", risk: "High", details: log.trim(), action: "Block suspicious domain and investigate host.", killChainPhase: "Command & Control" });
      }

      if (log.includes("DATA_EXFILTRATION")) {
        result.push({ event: "Data Exfiltration", risk: "High", details: log.trim(), action: "Block destination IP and audit data access logs.", killChainPhase: "Actions on Objectives" });
      }

      if (log.includes("DARKWEB_MENTION")) {
        result.push({ event: "Dark Web Mention", risk: "High", details: log.trim(), action: "Reset credentials for affected email immediately.", killChainPhase: "Reconnaissance" });
      }

      if (log.includes("RANSOMWARE_ACTIVITY")) {
        result.push({ event: "Ransomware Activity", risk: "High", details: log.trim(), action: "Isolate host immediately. Do not pay ransom. Begin incident response.", killChainPhase: "Actions on Objectives" });
      }

      if (log.includes("PRIVILEGE_ESCALATION")) {
        result.push({ event: "Privilege Escalation", risk: "High", details: log.trim(), action: "Revoke elevated privileges and audit user activity.", killChainPhase: "Exploitation" });
      }

      if (log.includes("FAILED_MFA")) {
        result.push({ event: "Failed MFA", risk: "Medium", details: log.trim(), action: "Notify user and monitor for further attempts.", killChainPhase: "Delivery" });
      }

      SUSPICIOUS_IPS.forEach(bad => {
        if (log.includes(bad)) {
          result.push({ event: "Suspicious IP", risk: "Medium", details: log.trim(), action: `Review all activity from ${bad}.`, killChainPhase: "Delivery" });
        }
      });

      if (/user=admin|user=root|for root|invalid user admin/.test(log)) {
        result.push({ event: "Privileged Access", risk: "Medium", details: log.trim(), action: "Verify admin/root activity was authorized.", killChainPhase: "Exploitation" });
      }
    });

    Object.entries(failedByIP).forEach(([ip, count]) => {
      if (count >= 5) {
        result.push({ event: "Brute Force", risk: "High", details: `${count} failed login attempts from ${ip}`, action: "Block IP immediately. Review auth logs.", killChainPhase: "Delivery" });
      } else if (count >= 3) {
        result.push({ event: "Repeated Failed Logins", risk: "Medium", details: `${count} failed login attempts from ${ip}`, action: "Monitor closely. Consider temporary block.", killChainPhase: "Delivery" });
      } else {
        result.push({ event: "Failed Login", risk: "Low", details: `${count} failed login attempt from ${ip}`, action: "Monitor for further attempts from this IP." });
      }
    });

    setAlerts(result);
    setTotalLogs(lines.length);
  }

  function clearAnalysis() {
    setAlerts([]);
    setTotalLogs(0);
  }

  return { alerts, totalLogs, analyzeLogs, clearAnalysis };
}
