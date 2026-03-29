import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = Math.min(parseInt(limitParam ?? '50', 10), 100);
    const offset = parseInt(offsetParam ?? '0', 10);

    if (!hasDatabase()) {
      // Return mock data when no DB is configured
      return NextResponse.json({
        events: [],
        total: 0,
        limit,
        offset,
      });
    }

    const rows = await query<{
      id: number;
      player: string;
      event_type: string;
      event_name: string | null;
      description: string | null;
      outcome: string | null;
      event_timestamp: string;
    }>(
      `SELECT id, player, event_type, event_name, description, outcome, event_timestamp
       FROM madgod_events
       ORDER BY event_timestamp DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM madgod_events`,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    return NextResponse.json(
      {
        events: rows.map((r) => ({
          id: r.id,
          player: r.player,
          eventType: r.event_type,
          eventName: r.event_name,
          description: r.description,
          outcome: r.outcome,
          timestamp: r.event_timestamp,
        })),
        total,
        limit,
        offset,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('MadGod GET events error:', err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.MADGOD_API_TOKEN;

    if (!expectedToken) {
      console.warn('MadGod events: MADGOD_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server not configured for MadGod events' },
        { status: 503 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { player, eventType, eventName, description, outcome, timestamp } = body;

    if (!player || !eventType || !eventName) {
      return NextResponse.json(
        { error: 'player, eventType, and eventName are required' },
        { status: 400 },
      );
    }

    const event = {
      player,
      eventType,
      eventName,
      description: description || null,
      outcome: outcome || null,
      timestamp: timestamp || new Date().toISOString(),
    };

    if (hasDatabase()) {
      await queryOne(
        `
        INSERT INTO madgod_events (
          player, event_type, event_name, description, outcome, event_timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        `,
        [
          event.player,
          event.eventType,
          event.eventName,
          event.description,
          event.outcome,
          event.timestamp,
        ],
      );
    } else {
      console.log('MadGod event (no DB):', JSON.stringify(event));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('MadGod event error:', err);
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 },
    );
  }
}
