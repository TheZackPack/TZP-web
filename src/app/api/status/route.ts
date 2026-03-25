import { NextResponse } from 'next/server';
import net from 'net';

const MC_HOST = process.env.MC_SERVER_HOST || '15.204.117.31';
const MC_PORT = parseInt(process.env.MC_SERVER_PORT || '25565', 10);

interface ServerStatus {
  online: boolean;
  players: { online: number; max: number };
  version: string;
}

let cachedStatus: ServerStatus | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

function checkServer(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(MC_PORT, MC_HOST);
  });
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStatus && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json(cachedStatus);
    }

    const online = await checkServer();

    cachedStatus = {
      online,
      players: { online: 0, max: 20 },
      version: '1.21.1',
    };
    cacheTimestamp = now;

    return NextResponse.json(cachedStatus);
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
