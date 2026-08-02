"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

const COLS = [
  { key: "player",         label: "Player",        align: "left",  tip: null },
  { key: "team",           label: "Team",          align: "left",  tip: null },
  { key: "totalSPCS",      label: "Total SPCS",    align: "right", tip: "Total number of swings taken in a plus count (3-0, 3-1, or 2-0)" },
  { key: "avgScore",       label: "Avg Score",     align: "right", tip: "Average SPCS score per swing. Max 10 pts: In Zone +1, Contact +1, BIP +1, Hard Hit +2, Hit +1, each Base +1" },
  { key: "spcsRating",     label: "SPCS Rating",   align: "right", tip: "Volume x Quality. Total SPCS multiplied by Avg Score divided by 10. Rewards players who swing often AND do damage." },
  { key: "spcsRatingPlus", label: "SPCS Rating+",  align: "right", tip: "SPCS Rating compared to league average. 100 = league average. 130 means 30% better than average." },
  { key: "inZonePct",      label: "Zone %",        align: "right", tip: "% of plus count swings taken at pitches in the strike zone. Higher = better pitch selection." },
  { key: "hardHitPct",     label: "Hard Hit %",    align: "right", tip: "% of balls in play hit at 95+ mph exit velocity (MLB Statcast definition)." },
  { key: "hitPct",         label: "Hit %",         align: "right", tip: "% of plus count swings that resulted in a base hit." },
];

function Tooltip({ text }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0,
      background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
      padding: "8px 10px", fontSize: 11, color: "#cbd5e1", width: 180,
      lineHeight: 1.6, zIndex: 100, pointerEvents: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)", whiteSpace: "normal",
    }}>
      {text}
    </div>
  );
}

function toInputDate(d) {
  return d.toISOString().split("T")[0];
}

export default function Home() {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sortKey,    setSortKey]    = useState("spcsRating");
  const [sortDir,    setSortDir]    = useState("desc");
  const [search,     setSearch]     = useState("");
  const [minSPCS,    setMinSPCS]    = useState(5);
  const [teamFilter, setTeamFilter] = useState("All");
  const [fromDate,   setFromDate]   = useState("");
  const [toDate,     setToDate]     = useState("");
  const [preset,     setPreset]     = useState("Season");
  const [hoveredCol, setHoveredCol] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate)   params.set("to",   toDate);
    const url = "/api/leaderboard" + (params.toString() ? "?" + params.toString() : "");
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [fromDate, toDate]);

  const teams = useMemo(() => {
    const t = [...new Set(data.map((p) => p.team))].sort();
    return ["All", ...t];
  }, [data]);

  function applyPreset(p) {
    setPreset(p);
    const today = new Date();
    if (p === "Last 7 days") {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      setFromDate(toInputDate(from));
      setToDate(toInputDate(today));
    } else if (p === "Last 30 days") {
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      setFromDate(toInputDate(from));
      setToDate(toInputDate(today));
    } else {
      setFromDate("");
      setToDate("");
    }
  }

  function handleFromDate(v) { setFromDate(v); setPreset("Custom"); }
  function handleToDate(v)   { setToDate(v);   setPreset("Custom"); }

  const sorted = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to   = toDate   ? new Date(new Date(toDate).setHours(23,59,59)) : null;

    return [...data]
      .filter((p) => p.totalSPCS >= minSPCS)
      .filter((p) => teamFilter === "All" || p.team === teamFilter)
      .filter((p) => p.player.toLowerCase().includes(search.toLowerCase()) ||
                     p.team.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const av = parseFloat(a[sortKey]) || 0;
        const bv = parseFloat(b[sortKey]) || 0;
        return sortDir === "desc" ? bv - av : av - bv;
      });
  }, [data, sortKey, sortDir, search, minSPCS, teamFilter, fromDate, toDate]);

  function handleSort(key) {
    if (key === sortKey) { setSortDir(sortDir === "desc" ? "asc" : "desc"); }
    else { setSortKey(key); setSortDir("desc"); }
  }

  function ratingColor(val) {
    const v = parseFloat(val);
    if (v >= 10) return "#4ade80";
    if (v >= 6)  return "#86efac";
    if (v >= 3)  return "#fbbf24";
    return "#f87171";
  }

  const inputStyle = {
    background: "#111827", border: "1px solid #1e2d4a", borderRadius: 6,
    color: "#e2e8f0", padding: "8px 12px", fontSize: 13, outline: "none",
  };

  const presetBtnStyle = (active) => ({
    background: active ? "#3b82f6" : "#111827",
    border: "1px solid " + (active ? "#3b82f6" : "#1e2d4a"),
    color: active ? "#fff" : "#94a3b8",
    borderRadius: 5, padding: "5px 12px", fontSize: 12,
    cursor: "pointer", fontWeight: 600,
  });

  return (
    <main style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1e2d4a", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 4 }}>MLB Analytics</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>Super Plus Counts</h1>
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Tracking swings on 3-0 · 3-1 · 2-0 counts</div>
      </div>
      <div style={{ background: "#0f1729", borderBottom: "1px solid #1e2d4a", padding: "12px 40px", display: "flex", gap: 32, flexWrap: "wrap" }}>
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
      <div style={{ padding: "20px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <input placeholder="Search player or team..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: 240 }} />
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={{ ...inputStyle, width: 200, cursor: "pointer" }}>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Min SPCS</span>
            {[1, 5, 10, 20].map((n) => (
              <button key={n} onClick={() => setMinSPCS(n)} style={presetBtnStyle(minSPCS === n)}>{n}+</button>
            ))}
          </div>
          {!loading && <span style={{ fontSize: 12, color: "#475569", marginLeft: "auto" }}>{sorted.length} players</span>}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Date Range</span>
          {["Season", "Last 7 days", "Last 30 days"].map((p) => (
            <button key={p} onClick={() => applyPreset(p)} style={presetBtnStyle(preset === p)}>{p}</button>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#475569" }}>From</span>
            <input type="date" value={fromDate} onChange={(e) => handleFromDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
            <span style={{ fontSize: 12, color: "#475569" }}>To</span>
            <input type="date" value={toDate} onChange={(e) => handleToDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
          </div>
        </div>
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
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    onMouseEnter={() => col.tip && setHoveredCol(col.key)}
                    onMouseLeave={() => setHoveredCol(null)}
                    style={{ padding: "10px 12px", textAlign: col.align, color: sortKey === col.key ? "#3b82f6" : "#475569", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", position: "relative" }}>
                    {col.label} {sortKey === col.key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    {col.tip && <span style={{ marginLeft: 3, color: "#334155", fontSize: 10 }}>?</span>}
                    {hoveredCol === col.key && col.tip && <Tooltip text={col.tip} />}
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
