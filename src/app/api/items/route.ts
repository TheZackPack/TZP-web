import { NextRequest, NextResponse } from "next/server";

import { hasDatabase, query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const packVersion =
    request.nextUrl.searchParams.get("packVersion")?.trim() || null;

  if (!hasDatabase() || !packVersion) {
    return NextResponse.json({
      packVersion,
      items: [],
    });
  }

  const rows = await query<{
    itemId: string;
    displayName: string;
    sourceModId: string | null;
  }>(
    `
      SELECT
        item_id AS "itemId",
        display_name AS "displayName",
        source_mod_id AS "sourceModId"
      FROM item_catalog
      WHERE pack_version = $1
      ORDER BY display_name ASC
    `,
    [packVersion],
  );

  return NextResponse.json({
    packVersion,
    items: rows,
  });
}
