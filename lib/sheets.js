import { google } from "googleapis";

const SHEET_ID = "1qlDM8y5w2wQZz1pip1OcgoUM6AHbzV1MFVtPi8gdx4Y";

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return auth;
}

export async function getSPCSLog() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "SPCS Log!A3:L50000",
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r[1])
    .map((r) => ({
      date:     r[0]  || "",
      player:   r[1]  || "",
      team:     r[2]  || "",
      opponent: r[3]  || "",
      count:    r[4]  || "",
      inZone:   r[5]  || "",
      contact:  r[6]  || "",
      bip:      r[7]  || "",
      hardHit:  r[8]  || "",
      hit:      r[9]  || "",
      bases:    parseInt(r[10]) || 0,
      notes:    r[11] || "",
    }));
}

export function buildLeaderboard(rows) {
  const players = {};
  for (const row of rows) {
    if (!row.player) continue;
    if (!players[row.player]) {
      players[row.player] = {
        player: row.player, team: row.team,
        totalSPCS: 0, inZone: 0, contact: 0,
        bip: 0, hardHit: 0, hits: 0, totalBases: 0, totalScore: 0,
      };
    }
    const p = players[row.player];
    p.totalSPCS++;
    if (row.inZone  === "Yes") p.inZone++;
    if (row.contact === "Yes") p.contact++;
    if (row.bip     === "Yes") p.bip++;
    if (row.hardHit === "Yes") p.hardHit++;
    if (row.hit     === "Yes") p.hits++;
    p.totalBases += row.bases;
    const score =
      (row.inZone  === "Yes" ? 1 : 0) +
      (row.contact === "Yes" ? 1 : 0) +
      (row.bip     === "Yes" ? 1 : 0) +
      (row.hardHit === "Yes" ? 2 : 0) +
      (row.hit     === "Yes" ? 1 : 0) +
      row.bases;
    p.totalScore += score;
  }

  const allPlayers = Object.values(players);

  const withRatings = allPlayers.map((p) => {
    const avgScore   = p.totalSPCS > 0 ? p.totalScore / p.totalSPCS : 0;
    const spcsRating = parseFloat((p.totalSPCS * avgScore / 10).toFixed(1));
    return { ...p, avgScore, spcsRating };
  });

  const leagueAvgRating = withRatings.reduce((sum, p) => sum + p.spcsRating, 0) / Math.max(withRatings.length, 1);

  return withRatings.map((p) => ({
    ...p,
    avgScore:       p.avgScore.toFixed(1),
    spcsRating:     p.spcsRating.toFixed(1),
    spcsRatingPlus: Math.round((p.spcsRating / Math.max(leagueAvgRating, 0.01)) * 100),
    inZonePct:      p.totalSPCS > 0 ? ((p.inZone  / p.totalSPCS) * 100).toFixed(0) : "0",
    contactPct:     p.totalSPCS > 0 ? ((p.contact / p.totalSPCS) * 100).toFixed(0) : "0",
    hardHitPct:     p.totalSPCS > 0 ? ((p.hardHit / p.totalSPCS) * 100).toFixed(0) : "0",
    hitPct:         p.totalSPCS > 0 ? ((p.hits    / p.totalSPCS) * 100).toFixed(0) : "0",
  }));
}
