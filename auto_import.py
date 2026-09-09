#!/usr/bin/env python3
"""
Auto SPCS Importer — runs daily via GitHub Actions.
Automatically imports all SPCS from the previous day.
"""

import requests
import os
import re
from supabase import create_client
from pybaseball import statcast
from datetime import datetime, timedelta, timezone
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

PLUS_COUNTS  = {"3-0", "3-1", "2-0"}
SWING_CODES  = {"S", "W", "F", "T", "X", "D", "E", "*B"}
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

def get_schedule(date_str):
    url  = f"https://statsapi.mlb.com/api/v1/schedule?date={date_str}&sportId=1"
    r    = requests.get(url, timeout=15)
    r.raise_for_status()
    games = []
    for date_entry in r.json().get("dates", []):
        for game in date_entry.get("games", []):
            games.append({
                "pk":   game["gamePk"],
                "away": game["teams"]["away"]["team"]["name"],
                "home": game["teams"]["home"]["team"]["name"],
            })
    return games

def get_game_data(game_pk):
    url = f"https://statsapi.mlb.com/api/v1.1/game/{game_pk}/feed/live"
    r   = requests.get(url, timeout=15)
    r.raise_for_status()
    return r.json()

def load_statcast(date_str):
    try:
        df = statcast(start_dt=date_str, end_dt=date_str)
        return df if df is not None and not df.empty else pd.DataFrame()
    except:
        return pd.DataFrame()

def get_exit_velo(df, batter_name, game_pk, ab_index):
    if df.empty:
        return None
    try:
        match = df[(df["game_pk"] == game_pk) & (df["at_bat_number"] == ab_index) & (df["launch_speed"].notna())]
        if not match.empty:
            return float(match["launch_speed"].iloc[0])
        last = batter_name.split(" ")[-1]
        if "player_name" in df.columns:
            nm = df[df["player_name"].str.contains(last, case=False, na=False) & df["launch_speed"].notna()]
            if not nm.empty:
                return float(nm["launch_speed"].max())
    except:
        pass
    return None

def fmt_date(date_str):
    return datetime.strptime(date_str, "%Y-%m-%d").strftime("%m/%d/%Y")

def find_spcs(game_data, team_filter, statcast_df, game_pk):
    results   = []
    game_date = game_data["gameData"]["datetime"]["officialDate"]
    away_name = game_data["gameData"]["teams"]["away"]["name"]
    home_name = game_data["gameData"]["teams"]["home"]["name"]

    for play in game_data["liveData"]["plays"]["allPlays"]:
        half      = play["about"]["halfInning"]
        team_name = away_name if half == "top" else home_name
        opponent  = home_name if half == "top" else away_name

        if team_filter.lower() not in team_name.lower():
            continue

        batter      = play["matchup"]["batter"]["fullName"]
        ab_number   = play["about"]["atBatIndex"] + 1
        result_type = play.get("result", {}).get("eventType", "")
        pitches     = [e for e in play.get("playEvents", []) if e.get("type") == "pitch"]

        for i, event in enumerate(pitches):
            code = event.get("details", {}).get("code", "")
            if code not in SWING_CODES:
                continue

            if i == 0:
                balls, strikes = 0, 0
            else:
                prev    = pitches[i-1].get("count", {})
                balls   = prev.get("balls", 0)
                strikes = prev.get("strikes", 0)

            count_str = f"{balls}-{strikes}"
            if count_str not in PLUS_COUNTS:
                continue

            zone = event.get("pitchData", {}).get("zone", 0)
            try:
                in_zone = "Yes" if 1 <= int(zone) <= 9 else "No"
            except:
                in_zone = "No"

            contact  = "Yes" if code in {"F","T","X","D","E"} else "No"
            bip      = "Yes" if code in {"X","D","E"} else "No"

            hard_hit = "No"
            if bip == "Yes":
                ev = get_exit_velo(statcast_df, batter, game_pk, ab_number)
                if ev is not None:
                    hard_hit = "Yes" if ev >= 95.0 else "No"

            hit, bases = "No", 0
            if bip == "Yes":
                hit_map = {"single":1,"double":2,"triple":3,"home_run":4}
                if result_type in hit_map:
                    hit   = "Yes"
                    bases = hit_map[result_type]

            results.append({
                "date":     fmt_date(game_date),
                "player":   batter,
                "team":     team_name,
                "opponent": opponent,
                "count":    count_str,
                "in_zone":  in_zone,
                "contact":  contact,
                "bip":      bip,
                "hard_hit": hard_hit,
                "hit":      hit,
                "bases":    bases,
                "notes":    "",
            })

    return results

def main():
    est_offset = timedelta(hours=-4)
    yesterday = (datetime.now(timezone.utc) + est_offset - timedelta(days=1)).strftime("%Y-%m-%d")
    print(f"Importing SPCS for {yesterday}...")

    games = get_schedule(yesterday)
    if not games:
        print("No games found.")
        return

    print(f"Found {len(games)} games. Loading Statcast data...")
    statcast_df = load_statcast(yesterday)
    print(f"Loaded {len(statcast_df)} Statcast records" if not statcast_df.empty else "Statcast unavailable")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    all_rows = []
    for game in games:
        label = f"{game['away']} @ {game['home']}"
        print(f"Processing {label}...")
        try:
            game_data = get_game_data(game["pk"])
        except Exception as e:
            print(f"  Failed: {e}")
            continue

        away = game_data["gameData"]["teams"]["away"]["name"]
        home = game_data["gameData"]["teams"]["home"]["name"]

        for team in [away, home]:
            rows = find_spcs(game_data, team, statcast_df, game["pk"])
            all_rows.extend(rows)
            if rows:
                print(f"  {team}: {len(rows)} SPCS")

        if not all_rows:
        print("No SPCS found.")
        return

    # Check if data for this date already exists
    existing = supabase.table("spcs_swings").select("id").eq("date", all_rows[0]["date"]).execute()
    if existing.data:
        print(f"Data for {all_rows[0]['date']} already exists ({len(existing.data)} rows). Skipping.")
        return

    supabase.table("spcs_swings").insert(all_rows).execute()
    print(f"Done! {len(all_rows)} rows added to Supabase.")

if __name__ == "__main__":
    main()
