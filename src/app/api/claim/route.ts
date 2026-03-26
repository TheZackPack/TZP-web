import { NextRequest, NextResponse } from "next/server";

import {
  createLauncherDeviceSession,
  createWebSession,
  getSessionCookieOptions,
  issueClaimSession,
  redeemClaimCode,
  setWebSessionCookie,
} from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { hasDatabase, queryOne } from "@/lib/db";
import { getClientIp } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code =
      typeof body?.code === "string"
        ? body.code.trim()
        : typeof body?.claim_code === "string"
          ? body.claim_code.trim()
          : "";
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const launcherFlow =
      typeof body?.claim_code === "string" || body?.clientType === "launcher";

    if (!code) {
      return NextResponse.json({ error: "Claim code is required." }, { status: 400 });
    }

    if (hasDatabase()) {
      const claim = await queryOne<{
        claimId: string;
        playerId: string;
        minecraftUuid: string;
        username: string;
        displayName: string | null;
      }>(
        `
          SELECT
            cc.id AS "claimId",
            p.id AS "playerId",
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
        `,
        [sha256(code)],
      );

      if (!claim) {
        return NextResponse.json({ error: "Invalid or expired claim code." }, { status: 401 });
      }

      const account = await queryOne<{ accountId: string; displayName: string }>(
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

      await queryOne("UPDATE claim_codes SET redeemed_at = NOW() WHERE id = $1", [
        claim.claimId,
      ]);

      if (launcherFlow) {
        const sessionToken = await createLauncherDeviceSession({
          accountId: account!.accountId,
          deviceName:
            typeof body?.device_id === "string" && body.device_id.trim()
              ? body.device_id.trim()
              : "TZP Launcher",
          platform:
            typeof body?.platform === "string" && body.platform.trim()
              ? body.platform.trim()
              : "unknown",
          launcherVersion:
            typeof body?.launcher_version === "string"
              ? body.launcher_version.trim()
              : null,
          metadata: {
            source: "launcher",
            deviceId: body?.device_id ?? null,
          },
        });

        return NextResponse.json({
          success: true,
          session_token: sessionToken,
          account: {
            username: claim.username,
            name: account!.displayName,
            minecraftUuid: claim.minecraftUuid,
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
        success: true,
        session: {
          sub: claim.minecraftUuid,
          role: "player",
          exp: 0,
          username: claim.username,
          displayName: account!.displayName,
        },
      });
    }

    const claim = redeemClaimCode(code);
    if (!claim) {
      return NextResponse.json({ error: "Invalid or expired claim code." }, { status: 401 });
    }

    const subject = label || `claim:${code}`;
    const { token, session } = issueClaimSession(claim.role, subject);

    const response = NextResponse.json({
      success: true,
      session,
    });
    response.cookies.set("tzp_session", token, getSessionCookieOptions());
    return response;
  } catch (err) {
    console.error("Claim code error:", err);
    return NextResponse.json({ error: "Failed to redeem claim code." }, { status: 500 });
  }
}
