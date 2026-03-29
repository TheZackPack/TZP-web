import { NextResponse } from 'next/server';
import { hasDatabase, query } from '@/lib/db';

export async function GET() {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ players: [] });
    }

    const rows = await query<{
      id: string;
      username: string;
      playtime: number;
      deaths: number;
      kills: number;
      quests_completed: number;
      madgod_relationship: number;
      last_seen: string | null;
      updated_at: string;
    }>(
      `SELECT id, username, playtime, deaths, kills, quests_completed,
              madgod_relationship, last_seen, updated_at
       FROM player_stats
       ORDER BY playtime DESC`,
    );

    return NextResponse.json(
      { players: rows },
      { headers: { 'Cache-Control': 'public, max-age=30' } },
    );
  } catch (err) {
    console.error('MadGod players error:', err);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}
