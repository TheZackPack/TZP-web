import { NextResponse } from 'next/server'

export async function GET() {
  // This could be dynamic from DB later, but start with static
  const info = {
    version: "2.0.0-alpha",
    mcVersion: "1.21.1",
    neoforgeVersion: "21.1.220",
    modCount: 250,
    questCount: 600,
    emcCount: 20000,
    features: [
      "AI Dungeon Master",
      "250+ Mods",
      "NeoForge 1.21.1",
      "EMC Economy",
      "Story Quests"
    ],
    motd: "v2.0 Alpha — The Big One is coming",
    serverStatus: "online"
  }

  return NextResponse.json(info, {
    headers: { 'Cache-Control': 'public, max-age=60' }
  })
}
