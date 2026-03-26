import { NextRequest, NextResponse } from "next/server";

import { randomToken, sha256 } from "@/lib/crypto";
import { hasDatabase, queryOne } from "@/lib/db";
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
  const minecraftUuid =
    typeof body?.minecraftUuid === "string" ? body.minecraftUuid.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const expiresInSeconds = Math.min(
    Math.max(Number(body?.expiresInSeconds ?? 600), 60),
    3600,
  );
  const metadata =
    body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

  if (!minecraftUuid || !username) {
    return jsonError("minecraftUuid and username are required", 400);
  }

  const player = await queryOne<{ playerId: string; currentUsername: string }>(
    `
      INSERT INTO players (minecraft_uuid, current_username)
      VALUES ($1, $2)
      ON CONFLICT (minecraft_uuid)
      DO UPDATE SET
        current_username = EXCLUDED.current_username,
        updated_at = NOW()
      RETURNING id AS "playerId", current_username AS "currentUsername"
    `,
    [minecraftUuid, username],
  );

  const plainCode = randomToken(4).toUpperCase();
  await queryOne(
    `
      INSERT INTO claim_codes (player_id, code_hash, issued_username, expires_at, metadata)
      VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::interval, $5::jsonb)
      RETURNING id
    `,
    [
      player!.playerId,
      sha256(plainCode),
      username,
      expiresInSeconds,
      JSON.stringify(metadata),
    ],
  );

  return NextResponse.json({
    ok: true,
    code: plainCode,
    minecraftUuid,
    username,
    expiresInSeconds,
  });
}
