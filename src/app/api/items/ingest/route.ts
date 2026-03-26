import { NextRequest, NextResponse } from "next/server";

import { hasDatabase, query } from "@/lib/db";
import { requireInternalBearer } from "@/lib/internal";

export async function POST(request: NextRequest) {
  const authError = requireInternalBearer(request.headers);
  if (authError) {
    return authError;
  }

  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
    }

    const payload = await request.json();
    const packVersion =
      typeof payload?.packVersion === "string" ? payload.packVersion.trim() : "";
    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (!packVersion) {
      return NextResponse.json({ error: "packVersion is required." }, { status: 400 });
    }

    await query("DELETE FROM item_catalog WHERE pack_version = $1", [packVersion]);
    for (const item of items) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const itemId = typeof item.itemId === "string" ? item.itemId.trim() : "";
      const displayName =
        typeof item.displayName === "string" ? item.displayName.trim() : itemId;
      const sourceModId =
        typeof item.sourceModId === "string" ? item.sourceModId.trim() : null;

      if (!itemId) {
        continue;
      }

      await query(
        `
          INSERT INTO item_catalog (pack_version, item_id, display_name, source_mod_id, metadata)
          VALUES ($1, $2, $3, $4, $5::jsonb)
        `,
        [packVersion, itemId, displayName, sourceModId, JSON.stringify(item)],
      );
    }

    return NextResponse.json({ success: true, packVersion, itemCount: items.length });
  } catch (err) {
    console.error("Item catalog ingest error:", err);
    return NextResponse.json({ error: "Failed to ingest item catalog." }, { status: 400 });
  }
}
