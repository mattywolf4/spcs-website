import { getSPCSLog, buildLeaderboard } from "@/lib/sheets";
import PlayerClient from "./PlayerClient";
import Link from "next/link";

export default async function PlayerPage({ params }) {
  const { name } = await params;
  const nameParam = decodeURIComponent(name).replace(/-/g, " ");
  const rows = await getSPCSLog();
  const swings = rows.filter((r) => r.player.toLowerCase() === nameParam.toLowerCase());

  if (swings.length === 0) {
    return (
      <main style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "#475569" }}>Player not found</div>
        <Link href="/" style={{ marginTop: 16, color: "#3b82f6", fontSize: 13 }}>← Back to leaderboard</Link>
      </main>
    );
  }

  const team = swings[0].team;
  const totalSPCS = swings.length;
  let inZone = 0, contact = 0, bip = 0, hardHit = 0, hits = 0, totalBases = 0, totalScore = 0;
  const countBreakdown = { "3-0": 0, "3-1": 0, "2-0": 0 };

  for (const s of swings) {
    if (s.inZone  === "Yes") inZone++;
    if (s.contact === "Yes") contact++;
    if (s.bip     === "Yes") bip++;
    if (s.hardHit === "Yes") hardHit++;
    if (s.hit     === "Yes") hits++;
    totalBases += s.bases;
    if (countBreakdown[s.count] !== undefined) countBreakdown[s.count]++;
    totalScore +=
      (s.inZone  === "Yes" ? 1 : 0) +
      (s.contact === "Yes" ? 1 : 0) +
      (s.bip     === "Yes" ? 1 : 0) +
      (s.hardHit === "Yes" ? 2 : 0) +
      (s.hit     === "Yes" ? 1 : 0) +
      s.bases;
  }

  const avgScore   = totalSPCS > 0 ? (totalScore / totalSPCS).toFixed(1) : "0.0";
  const spcsRating = (totalSPCS * parseFloat(avgScore) / 10).toFixed(1);
  const leaderboard = buildLeaderboard(rows);
  const leagueAvg = leaderboard.reduce((sum, p) => sum + parseFloat(p.spcsRating), 0) / Math.max(leaderboard.length, 1);
  const spcsRatingPlus = Math.round((parseFloat(spcsRating) / Math.max(leagueAvg, 0.01)) * 100);

  const stats = {
    totalSPCS, avgScore, spcsRating, spcsRatingPlus,
    hardHitPct: totalSPCS > 0 ? ((hardHit / totalSPCS) * 100).toFixed(0) : "0",
    hitPct:     totalSPCS > 0 ? ((hits    / totalSPCS) * 100).toFixed(0) : "0",
    inZonePct:  totalSPCS > 0 ? ((inZone  / totalSPCS) * 100).toFixed(0) : "0",
    countBreakdown,
  };

  return <PlayerClient name={swings[0].player} team={team} stats={stats} swings={swings} />;
}
