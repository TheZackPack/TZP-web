import { NextRequest, NextResponse } from "next/server";
import { requireInternalBearer } from "@/lib/internal";
import { randomToken } from "@/lib/crypto";
import { hasDatabase, queryOne } from "@/lib/db";

export async function POST(request: NextRequest) {
  const authError = requireInternalBearer(request.headers);
  if (authError) return authError;

  const body = await request.json();
  const { uuid, username } = body;
  if (!uuid || !username) {
    return NextResponse.json(
      { error: "uuid and username required" },
      { status: 400 },
    );
  }

  const token = randomToken(24);
  const expiresIn = 300;

  if (hasDatabase()) {
    await queryOne(
      `INSERT INTO link_tokens (token, minecraft_uuid, minecraft_username, expires_at)
       VALUES ($1, $2, $3, NOW() + interval '5 minutes')
       RETURNING token`,
      [token, uuid, username],
    );
  }

  const baseUrl =
    process.env.TZP_WEB_URL || "https://tzp-production.up.railway.app";
  const url = `${baseUrl}/link?token=${token}`;

  return NextResponse.json({ token, url, expiresIn });
}
