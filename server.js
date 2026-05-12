import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function isValidIp(ip) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

app.get("/api/check-ip/:ip", async (req, res) => {
  try {
    const { ip } = req.params;
    if (!isValidIp(ip)) {
      return res.status(400).json({ error: "Invalid IP address" });
    }
    if (!process.env.ABUSEIPDB_API_KEY) {
      return res.status(500).json({ error: "Missing AbuseIPDB API key" });
    }
    const url = new URL("https://api.abuseipdb.com/api/v2/check");
    url.searchParams.set("ipAddress", ip);
    url.searchParams.set("maxAgeInDays", "90");
    url.searchParams.set("verbose", "true");
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Key: process.env.ABUSEIPDB_API_KEY,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "AbuseIPDB request failed", details: errorText });
    }
    const json = await response.json();
    const data = json.data;
    return res.json({
      ipAddress: data.ipAddress,
      abuseConfidenceScore: data.abuseConfidenceScore,
      countryCode: data.countryCode,
      usageType: data.usageType,
      isp: data.isp,
      domain: data.domain,
      totalReports: data.totalReports,
      numDistinctUsers: data.numDistinctUsers,
      lastReportedAt: data.lastReportedAt,
      isPublic: data.isPublic,
      isWhitelisted: data.isWhitelisted,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error while checking IP reputation" });
  }
});

app.listen(PORT, () => {
  console.log(`EyeSOC API running on http://localhost:${PORT}`);
});
