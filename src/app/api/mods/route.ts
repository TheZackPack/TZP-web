import { NextRequest, NextResponse } from "next/server";

import { deriveModCatalogEntries } from "@/lib/catalog";
import { hasDatabase, query } from "@/lib/db";
import { getManifest } from "@/lib/manifest";

export async function GET(request: NextRequest) {
  const requestedPackVersion =
    request.nextUrl.searchParams.get("packVersion")?.trim() || null;

  if (hasDatabase() && requestedPackVersion) {
    const rows = await query<{
      modId: string;
      displayName: string;
      fileName: string;
      packVersion: string;
    }>(
      `
        SELECT
          mod_id AS "modId",
          display_name AS "displayName",
          file_name AS "fileName",
          pack_version AS "packVersion"
        FROM mod_catalog
        WHERE pack_version = $1
        ORDER BY display_name ASC
      `,
      [requestedPackVersion],
    );

    if (rows.length > 0) {
      return NextResponse.json({
        packVersion: requestedPackVersion,
        mods: rows,
      });
    }
  }

  const manifest = await getManifest();
  return NextResponse.json({
    packVersion: manifest.version,
    mods: deriveModCatalogEntries(manifest.version, manifest.files ?? []),
  });
}
