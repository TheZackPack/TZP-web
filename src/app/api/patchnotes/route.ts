import { NextRequest, NextResponse } from 'next/server';
import launcherNotes from '@/data/patchnotes-launcher.json';
import clientNotes from '@/data/patchnotes-client.json';
import serverNotes from '@/data/patchnotes-server.json';
import liveNotes from '@/data/patchnotes-live.json';

type PatchNote = {
  version: string;
  date: string;
  title: string;
  type?: string;
  changes: Array<{ category: string; text: string } | string>;
};

const componentMap: Record<string, PatchNote[]> = {
  launcher: launcherNotes as PatchNote[],
  client: clientNotes as PatchNote[],
  server: serverNotes as PatchNote[],
  live: liveNotes as PatchNote[],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const component = searchParams.get('component');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  let notes: PatchNote[];

  if (component && componentMap[component]) {
    notes = componentMap[component];
  } else if (component) {
    return NextResponse.json(
      { error: `Unknown component: ${component}. Valid: launcher, client, server, live` },
      { status: 400 },
    );
  } else {
    // Merge all components, sorted by date descending
    notes = Object.values(componentMap)
      .flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  if (limit && limit > 0) {
    notes = notes.slice(0, limit);
  }

  return NextResponse.json(notes, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
