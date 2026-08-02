import { getSPCSLog, buildLeaderboard } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to   = searchParams.get("to");

    const rows = await getSPCSLog();

    const filtered = rows.filter((r) => {
      if (!from && !to) return true;
      const parts = r.date.split("/");
      if (parts.length !== 3) return true;
      const rowDate = new Date(`${parts[2]}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`);
      if (from && rowDate < new Date(from)) return false;
      if (to   && rowDate > new Date(new Date(to).setHours(23,59,59))) return false;
      return true;
    });

    const leaderboard = buildLeaderboard(filtered);
    return NextResponse.json(leaderboard);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}