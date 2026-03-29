import { NextResponse } from 'next/server'

export async function GET() {
  const info = {
    // Website display
    version: "1.1.9",
    mcVersion: "1.21.1",
    neoforgeVersion: "21.1.220",
    modCount: 195,
    questCount: 493,
    emcCount: 19697,
    features: [
      "AI Dungeon Master",
      "195+ Mods",
      "NeoForge 1.21.1",
      "EMC Economy",
      "Story Quests"
    ],
    motd: "v1.1.9 Live — Beta server now available for testing",
    serverStatus: "online",

    // Launcher pill fields
    mod_count: 195,
    engine: "NeoForge 1.21.1",
    feature: "AI Dungeon Master",
  }

  return NextResponse.json(info, {
    headers: { 'Cache-Control': 'public, max-age=60' }
  })
}
