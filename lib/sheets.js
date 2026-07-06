import { supabase } from './supabase'

export async function getSPCSLog() {
  let allRows = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('spcs_swings')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('id', { ascending: true })

    if (error) throw error
    if (!data || data.length === 0) break

    allRows = allRows.concat(data)
    if (data.length < pageSize) break
    page++
  }

  return allRows.map((r) => ({
    date:     r.date     || "",
    player:   r.player   || "",
    team:     r.team     || "",
    opponent: r.opponent || "",
    count:    r.count    || "",
    inZone:   r.in_zone  || "",
    contact:  r.contact  || "",
    bip:      r.bip      || "",
    hardHit:  r.hard_hit || "",
    hit:      r.hit      || "",
    bases:    r.bases    || 0,
    notes:    r.notes    || "",
  }))
}

export function buildLeaderboard(rows) {
  const players = {}
  for (const row of rows) {
    if (!row.player) continue
    if (!players[row.player]) {
      players[row.player] = {
        player: row.player, team: row.team,
        totalSPCS: 0, inZone: 0, contact: 0,
        bip: 0, hardHit: 0, hits: 0, totalBases: 0, totalScore: 0,
      }
    }
    const p = players[row.player]
    p.totalSPCS++
    if (row.inZone  === "Yes") p.inZone++
    if (row.contact === "Yes") p.contact++
    if (row.bip     === "Yes") p.bip++
    if (row.hardHit === "Yes") p.hardHit++
    if (row.hit     === "Yes") p.hits++
    p.totalBases += row.bases
    const score =
      (row.inZone  === "Yes" ? 1 : 0) +
      (row.contact === "Yes" ? 1 : 0) +
      (row.bip     === "Yes" ? 1 : 0) +
      (row.hardHit === "Yes" ? 2 : 0) +
      (row.hit     === "Yes" ? 1 : 0) +
      row.bases
    p.totalScore += score
  }

  const allPlayers = Object.values(players)
  const withRatings = allPlayers.map((p) => {
    const avgScore   = p.totalSPCS > 0 ? p.totalScore / p.totalSPCS : 0
    const spcsRating = parseFloat((p.totalSPCS * avgScore / 10).toFixed(1))
    return { ...p, avgScore, spcsRating }
  })

  const leagueAvgRating = withRatings.reduce((sum, p) => sum + p.spcsRating, 0) / Math.max(withRatings.length, 1)

  return withRatings.map((p) => ({
    ...p,
    avgScore:       p.avgScore.toFixed(1),
    spcsRating:     p.spcsRating.toFixed(1),
    spcsRatingPlus: Math.round((p.spcsRating / Math.max(leagueAvgRating, 0.01)) * 100),
    inZonePct:      p.totalSPCS > 0 ? ((p.inZone  / p.totalSPCS) * 100).toFixed(0) : "0",
    contactPct:     p.totalSPCS > 0 ? ((p.contact / p.totalSPCS) * 100).toFixed(0) : "0",
    hardHitPct:     p.totalSPCS > 0 ? ((p.hardHit / p.totalSPCS) * 100).toFixed(0) : "0",
    hitPct:         p.totalSPCS > 0 ? ((p.hits    / p.totalSPCS) * 100).toFixed(0) : "0",
  }))
}
