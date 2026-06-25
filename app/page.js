"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

const COLS = [
  { key: "player",         label: "Player",        align: "left"  },
  { key: "team",           label: "Team",          align: "left"  },
  { key: "totalSPCS",      label: "Total SPCS",    align: "right" },
  { key: "avgScore",       label: "Avg Score",     align: "right" },
  { key: "spcsRating",     label: "SPCS Rating",   align: "right" },
  { key: "spcsRatingPlus", label: "SPCS Rating+",  align: "right" },
  { key: "inZonePct",      label: "Zone %",        align: "right" },
  { key: "hardHitPct",     label: "Hard Hit %",    align: "right" },
  { key: "hitPct",         label: "Hit %",         align: "right" },
];

export default function Home() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("spcsRating");
  const [sortDir, setSortDir] = useState("desc");
  const [search,  setSearch]  = useState("");
  const [minSPCS, setMinSPCS] = useState(5);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const sorted = useMemo(() => {
    return [...data]
      .filter((p) => p.totalSPCS >= minSPCS)
      .filter((p) => p.player.toLowerCase().includes(search.toLowerCase()) ||
                     p.team.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const av = parseFloat(a[sortKey]) || 0;
        const bv = parseFloat(b[sortKey]) || 0;
        return sortDir === "desc" ? bv - av : av - bv;
      });
  }, [data, sortKey, sortDir, search, minSPCS]);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function ratingColor(val) {
    const v = parseFloat(val);
    if (v >= 10) return "#4ade80";
    if (v >= 6)  return "#86efac";
    if (v >= 3)  return "#fbbf24";
    return "#f87171";
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1e2d4a", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 4 }}>
            MLB Analytics
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>
            Super Plus Counts
          </h1>
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Tracking swings on 3-0 · 3-1 · 2-0 counts
        </div>
      </div>
      <div style={{ background: "#0f1729", borderBottom: "1px solid #1e2d4a", padding: "12px 40px", display: "flex", gap: 32 }}>
        {[
          { label: "SPCS", def: "Swing taken in a plus count (3-0, 3-1, or 2-0)" },
          { label: "Avg Score", def: "Average score per swing (max 10 pts)" },
          { label: "SPCS Rating", def: "Volume x Quality combined metric" },
          { label: "SPCS Rating+", def: "SPCS Rating vs league average (100 = avg)" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.05em" }}>{item.label}</span>
            <span style={{ fontSize: 11, color: "#475569" }}>— {item.def}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "20px 40px", display: "flex", gap: 16, alignItems: "center" }}>
        <input
          placeholder="Search player or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: "#111827", border: "1px solid #1e2d4a", borderRadius: 6, color: "#e2e8f0", padding: "8px 14px", fontSize: 13, width: 240, outline: "none" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Min SPCS</span>
          {[1, 5, 10, 20].map((n) => (
            <button key={n} onClick={() => setMinSPCS(n)} style={{ background: minSPCS === n ? "#3b82f6" : "#111827", border: "1px solid " + (minSPCS === n ? "#3b82f6" : "#1e2d4a"), color: minSPCS === n ? "#fff" : "#94a3b8", borderRadius: 5, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              {n}+
            </button>
          ))}
        </div>
        {!loading && <span style={{ fontSize: 12, color: "#475569", marginLeft: "auto" }}>{sorted.length} players</span>}
      </div>
      <div style={{ padding: "0 40px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#475569", fontSize: 14 }}>Loading data...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                <th style={{ padding: "10px 12px", color: "#475569", fontSize: 11, fontWeight: 600, textAlign: "left", letterSpacing: "0.05em", textTransform: "uppercase" }}>#</th>
                {COLS.map((col) => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: "10px 12px", textAlign: col.align, color: sortKey === col.key ? "#3b82f6" : "#475569", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                    {col.label} {sortKey === col.key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.player} style={{ borderBottom: "1px solid #111827", background: i % 2 === 0 ? "transparent" : "#0d1424" }}>
                  <td style={{ padding: "12px 12px", color: "#334155", fontSize: 12, fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: "12px 12px", fontWeight: 600, color: "#f1f5f9" }}>
                    <Link href={`/player/${encodeURIComponent(p.player.replace(/ /g, "-"))}`} style={{ color: "#f1f5f9", textDecoration: "none" }}
                      onMouseEnter={e => e.target.style.color="#3b82f6"}
                      onMouseLeave={e => e.target.style.color="#f1f5f9"}>
                      {p.player}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 12px", color: "#94a3b8", fontSize: 12 }}>{p.team}</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#e2e8f0" }}>{p.totalSPCS}</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", color: "#cbd5e1" }}>{p.avgScore}</td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: ratingColor(p.spcsRating) }}>{p.spcsRating}</span>
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: p.spcsRatingPlus >= 115 ? "#4ade80" : p.spcsRatingPlus >= 100 ? "#86efac" : p.spcsRatingPlus >= 85 ? "#fbbf24" : "#f87171" }}>{p.spcsRatingPlus}</span>
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right", color: "#94a3b8" }}>{p.inZonePct}%</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", color: "#94a3b8" }}>{p.hardHitPct}%</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", color: "#94a3b8" }}>{p.hitPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
