import { NextResponse } from "next/server";

import { deriveModCatalogEntries } from "@/lib/catalog";
import { hasDatabase, query } from "@/lib/db";
import { getManifest } from "@/lib/manifest";
import { requireInternalBearer } from "@/lib/internal";

export async function POST(request: Request) {
  const authError = requireInternalBearer(request.headers);
  if (authError) {
    return authError;
  }

  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }

  const manifest = await getManifest(true);
  const mods = deriveModCatalogEntries(manifest.version, manifest.files ?? []);

  await query("DELETE FROM mod_catalog WHERE pack_version = $1", [manifest.version]);

  for (const mod of mods) {
    await query(
      `
        INSERT INTO mod_catalog (pack_version, mod_id, display_name, file_name, metadata)
        VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        manifest.version,
        mod.modId,
        mod.displayName,
        mod.fileName,
        JSON.stringify(mod),
      ],
    );
  }

  return NextResponse.json({
    ok: true,
    packVersion: manifest.version,
    modCount: mods.length,
  });
}
