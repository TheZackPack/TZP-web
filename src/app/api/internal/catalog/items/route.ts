import { NextRequest, NextResponse } from "next/server";

import { hasDatabase, query } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { requireInternalBearer } from "@/lib/internal";

export async function POST(request: NextRequest) {
  const authError = requireInternalBearer(request.headers);
  if (authError) {
    return authError;
  }

  if (!hasDatabase()) {
    return jsonError("DATABASE_URL is not configured", 503);
  }

  const body = await request.json().catch(() => null);
  const packVersion =
    typeof body?.packVersion === "string" ? body.packVersion.trim() : "";
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!packVersion) {
    return jsonError("packVersion is required", 400);
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

  return NextResponse.json({
    ok: true,
    packVersion,
    itemCount: items.length,
  });
}
