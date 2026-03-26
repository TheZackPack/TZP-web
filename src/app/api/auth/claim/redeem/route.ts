import { NextRequest, NextResponse } from "next/server";

import {
  createLauncherDeviceSession,
  createWebSession,
  setWebSessionCookie,
} from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { hasDatabase, queryOne } from "@/lib/db";
import { getClientIp, jsonError } from "@/lib/http";

type ClaimRow = {
  claimId: string;
  playerId: string;
  accountId: string | null;
  minecraftUuid: string;
  username: string;
  displayName: string | null;
};

export async function POST(request: NextRequest) {
  if (!hasDatabase()) {
    return jsonError("DATABASE_URL is not configured", 503);
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const clientType = body?.clientType === "launcher" ? "launcher" : "web";
  const deviceName =
    typeof body?.deviceName === "string" && body.deviceName.trim()
      ? body.deviceName.trim()
      : "TZP Launcher";
  const platform =
    typeof body?.platform === "string" && body.platform.trim()
      ? body.platform.trim()
      : "unknown";
  const launcherVersion =
    typeof body?.launcherVersion === "string" ? body.launcherVersion.trim() : null;

  if (!code) {
    return jsonError("Claim code is required", 400);
  }

  const claim = await queryOne<ClaimRow>(
    `
      WITH matched_claim AS (
        SELECT
          cc.id AS "claimId",
          p.id AS "playerId",
          a.id AS "accountId",
          p.minecraft_uuid AS "minecraftUuid",
          p.current_username AS username,
          a.display_name AS "displayName"
        FROM claim_codes cc
        JOIN players p ON p.id = cc.player_id
        LEFT JOIN accounts a ON a.player_id = p.id
        WHERE cc.code_hash = $1
          AND cc.redeemed_at IS NULL
          AND cc.expires_at > NOW()
        LIMIT 1
      )
      SELECT * FROM matched_claim
    `,
    [sha256(code)],
  );

  if (!claim) {
    return jsonError("Invalid or expired claim code", 404);
  }

  const account = await queryOne<{
    accountId: string;
    displayName: string;
  }>(
    `
      INSERT INTO accounts (player_id, display_name)
      VALUES ($1, $2)
      ON CONFLICT (player_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
      RETURNING id AS "accountId", display_name AS "displayName"
    `,
    [claim.playerId, claim.displayName ?? claim.username],
  );

  await queryOne(
    `
      UPDATE claim_codes
      SET redeemed_at = NOW()
      WHERE id = $1
    `,
    [claim.claimId],
  );

  if (clientType === "launcher") {
    const deviceToken = await createLauncherDeviceSession({
      accountId: account!.accountId,
      deviceName,
      platform,
      launcherVersion,
      metadata: {
        source: "claim-code",
      },
    });

    return NextResponse.json({
      ok: true,
      clientType,
      deviceToken,
      account: {
        accountId: account!.accountId,
        displayName: account!.displayName,
        minecraftUuid: claim.minecraftUuid,
        username: claim.username,
      },
    });
  }

  const token = await createWebSession({
    accountId: account!.accountId,
    userAgent: request.headers.get("user-agent"),
    ipAddress: getClientIp(request.headers),
  });
  await setWebSessionCookie(token);

  return NextResponse.json({
    ok: true,
    clientType,
    account: {
      accountId: account!.accountId,
      displayName: account!.displayName,
      minecraftUuid: claim.minecraftUuid,
      username: claim.username,
    },
  });
}
