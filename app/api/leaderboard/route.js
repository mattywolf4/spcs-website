import { getSPCSLog, buildLeaderboard } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await getSPCSLog();
    const leaderboard = buildLeaderboard(rows);
    return NextResponse.json(leaderboard);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
