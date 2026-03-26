import { NextResponse } from "next/server";

import { getManifest } from "@/lib/manifest";

export async function GET() {
  try {
    const manifest = await getManifest();
    return NextResponse.json(manifest);
  } catch (err) {
    console.error("Manifest fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
