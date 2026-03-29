import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, queryOne } from "@/lib/db";
import { createWebSession, setWebSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  // Look up and validate token
  const linkToken = await queryOne<{
    minecraft_uuid: string;
    minecraft_username: string;
    redeemed: boolean;
  }>(
    `SELECT minecraft_uuid, minecraft_username, redeemed
     FROM link_tokens
     WHERE token = $1 AND expires_at > NOW()`,
    [token],
  );

  if (!linkToken) {
    return NextResponse.json(
      { error: "Link expired or invalid. Run /link again in-game." },
      { status: 404 },
    );
  }

  if (linkToken.redeemed) {
    return NextResponse.json(
      { error: "This link has already been used. Run /link again." },
      { status: 410 },
    );
  }

  // Mark as redeemed
  await queryOne(`UPDATE link_tokens SET redeemed = TRUE WHERE token = $1`, [
    token,
  ]);

  // Create or find player
  let player = await queryOne<{ id: string }>(
    `SELECT id FROM players WHERE minecraft_uuid = $1`,
    [linkToken.minecraft_uuid],
  );

  if (!player) {
    player = await queryOne<{ id: string }>(
      `INSERT INTO players (minecraft_uuid, current_username)
       VALUES ($1, $2)
       RETURNING id`,
      [linkToken.minecraft_uuid, linkToken.minecraft_username],
    );
  } else {
    // Update username if changed
    await queryOne(
      `UPDATE players SET current_username = $1, updated_at = NOW() WHERE id = $2`,
      [linkToken.minecraft_username, player.id],
    );
  }

  // Create or find account
  let account = await queryOne<{ id: string }>(
    `SELECT id FROM accounts WHERE player_id = $1`,
    [player!.id],
  );

  if (!account) {
    account = await queryOne<{ id: string }>(
      `INSERT INTO accounts (player_id, display_name)
       VALUES ($1, $2)
       RETURNING id`,
      [player!.id, linkToken.minecraft_username],
    );
  }

  // Create web session
  const userAgent = request.headers.get("user-agent");
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip");
  const sessionToken = await createWebSession({
    accountId: account!.id,
    userAgent,
    ipAddress: ip,
  });

  // Set cookie
  await setWebSessionCookie(sessionToken);

  return NextResponse.json({
    success: true,
    username: linkToken.minecraft_username,
  });
}
