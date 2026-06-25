"use client";
import { useState } from "react";
import Link from "next/link";

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#0f1729", border: "1px solid #1e2d4a", borderRadius: 8, padding: "16px 20px", minWidth: 120 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || "#f1f5f9" }}>{value}</div>
    </div>
  );
}

function CountBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#64748b" }}>{count} swings ({pct.toFixed(0)}%)</span>
      </div>
      <div style={{ height: 8, background: "#1e2d4a", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function PlayerClient({ name, team, stats, swings }) {
  const [logOpen, setLogOpen] = useState(false);

  function ratingPlusColor(val) {
    if (val >= 115) return "#4ade80";
    if (val >= 100) return "#86efac";
    if (val >= 85)  return "#fbbf24";
    return "#f87171";
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1e2d4a", padding: "16px 40px" }}>
        <Link href="/" style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>← Back to Leaderboard</Link>
      </div>
      <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #1e2d4a" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 6 }}>Player Profile</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{name}</h1>
        <div style={{ fontSize: 14, color: "#64748b" }}>{team}</div>
      </div>
      <div style={{ padding: "24px 40px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Total SPCS"   value={stats.totalSPCS} />
        <StatCard label="Avg Score"    value={stats.avgScore} />
        <StatCard label="SPCS Rating"  value={stats.spcsRating} color="#86efac" />
        <StatCard label="SPCS Rating+" value={stats.spcsRatingPlus} color={ratingPlusColor(stats.spcsRatingPlus)} />
        <StatCard label="Hard Hit %"   value={`${stats.hardHitPct}%`} />
        <StatCard label="Hit %"        value={`${stats.hitPct}%`} />
        <StatCard label="Zone %"       value={`${stats.inZonePct}%`} />
      </div>
      <div style={{ padding: "0 40px 24px" }}>
        <div style={{ background: "#0f1729", border: "1px solid #1e2d4a", borderRadius: 8, padding: "20px 24px", maxWidth: 500 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Swing Breakdown by Count</div>
          <CountBar label="3-0" count={stats.countBreakdown["3-0"]} total={stats.totalSPCS} color="#3b82f6" />
          <CountBar label="3-1" count={stats.countBreakdown["3-1"]} total={stats.totalSPCS} color="#8b5cf6" />
          <CountBar label="2-0" count={stats.countBreakdown["2-0"]} total={stats.totalSPCS} color="#06b6d4" />
        </div>
      </div>
      <div style={{ padding: "0 40px 60px" }}>
        <button onClick={() => setLogOpen(!logOpen)} style={{ background: "#0f1729", border: "1px solid #1e2d4a", borderRadius: 8, padding: "12px 20px", color: "#e2e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span>{logOpen ? "▼" : "▶"} Swing Log</span>
          <span style={{ color: "#475569", fontWeight: 400 }}>({stats.totalSPCS} swings)</span>
        </button>
        {logOpen && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                  {["Date","Opponent","Count","In Zone","Contact","BIP","Hard Hit","Hit","Bases"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", color: "#475569", fontSize: 11, fontWeight: 600, textAlign: "left", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {swings.map((s, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #0d1424", background: i % 2 === 0 ? "transparent" : "#0d1424" }}>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{s.date}</td>
                    <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{s.opponent}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#3b82f6" }}>{s.count}</td>
                    {[s.inZone, s.contact, s.bip, s.hardHit, s.hit].map((val, j) => (
                      <td key={j} style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 600, color: val === "Yes" ? "#4ade80" : "#475569" }}>{val}</span>
                      </td>
                    ))}
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: s.bases > 0 ? "#fbbf24" : "#475569" }}>{s.bases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
