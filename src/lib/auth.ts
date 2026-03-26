import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

import { hasDatabase, queryOne } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";

export const WEB_SESSION_COOKIE = "tzp_session";
const SESSION_SECRET = process.env.TZP_SESSION_SECRET || "";
const SESSION_TTL_HOURS = parseInt(process.env.TZP_SESSION_TTL_HOURS || "168", 10);
const CLAIM_CODES_RAW = process.env.TZP_CLAIM_CODES || "";
const CLAIM_CODES_ONE_TIME = (process.env.TZP_CLAIM_CODES_ONE_TIME || "true") === "true";

export type AccountSession = {
  accountId: string;
  playerId: string;
  minecraftUuid: string;
  username: string;
  displayName: string;
};

export type WebClaimSession = {
  sub: string;
  role: string;
  exp: number;
};

type SessionRow = AccountSession & {
  sessionId: string;
};

type MemorySession = { session: WebClaimSession; expiresAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __tzpClaimSessions: Map<string, MemorySession> | undefined;
  // eslint-disable-next-line no-var
  var __tzpUsedClaimCodes: Set<string> | undefined;
}

const memorySessions = global.__tzpClaimSessions ?? new Map<string, MemorySession>();
global.__tzpClaimSessions = memorySessions;

const usedClaimCodes = global.__tzpUsedClaimCodes ?? new Set<string>();
global.__tzpUsedClaimCodes = usedClaimCodes;

export async function createWebSession(input: {
  accountId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresInDays?: number;
}): Promise<string> {
  const token = randomToken();
  const tokenHash = sha256(token);
  const expiresInDays = input.expiresInDays ?? 30;

  await queryOne(
    `
      INSERT INTO web_sessions (account_id, token_hash, user_agent, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::interval)
      RETURNING id
    `,
    [input.accountId, tokenHash, input.userAgent, input.ipAddress, expiresInDays],
  );

  return token;
}

export async function createLauncherDeviceSession(input: {
  accountId: string;
  deviceName: string;
  platform: string;
  launcherVersion?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const token = randomToken();
  const tokenHash = sha256(token);

  await queryOne(
    `
      INSERT INTO launcher_devices (account_id, device_name, platform, launcher_version, token_hash, metadata)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id
    `,
    [
      input.accountId,
      input.deviceName,
      input.platform,
      input.launcherVersion ?? null,
      tokenHash,
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return token;
}

export async function setWebSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(WEB_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearWebSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(WEB_SESSION_COOKIE);
}

export async function getWebSession(): Promise<AccountSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return getAccountForWebToken(token);
}

export async function getAccountForWebToken(token: string): Promise<AccountSession | null> {
  const tokenHash = sha256(token);

  const row = await queryOne<SessionRow>(
    `
      SELECT
        a.id AS "accountId",
        p.id AS "playerId",
        p.minecraft_uuid AS "minecraftUuid",
        p.current_username AS username,
        a.display_name AS "displayName",
        ws.id AS "sessionId"
      FROM web_sessions ws
      JOIN accounts a ON a.id = ws.account_id
      JOIN players p ON p.id = a.player_id
      WHERE ws.token_hash = $1
        AND ws.revoked_at IS NULL
        AND ws.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash],
  );

  if (!row) {
    return null;
  }

  return {
    accountId: row.accountId,
    playerId: row.playerId,
    minecraftUuid: row.minecraftUuid,
    username: row.username,
    displayName: row.displayName,
  };
}

export async function getAccountForLauncherToken(
  token: string,
): Promise<(AccountSession & { launcherDeviceId: string }) | null> {
  const tokenHash = sha256(token);

  const row = await queryOne<
    AccountSession & { launcherDeviceId: string }
  >(
    `
      SELECT
        a.id AS "accountId",
        p.id AS "playerId",
        p.minecraft_uuid AS "minecraftUuid",
        p.current_username AS username,
        a.display_name AS "displayName",
        ld.id AS "launcherDeviceId"
      FROM launcher_devices ld
      JOIN accounts a ON a.id = ld.account_id
      JOIN players p ON p.id = a.player_id
      WHERE ld.token_hash = $1
        AND ld.revoked_at IS NULL
      LIMIT 1
    `,
    [tokenHash],
  );

  return row;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function hmac(data: string): string {
  return base64url(createHmac("sha256", SESSION_SECRET).update(data).digest());
}

function signPayload(payload: WebClaimSession): string {
  const body = base64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

function verifyToken(token: string): WebClaimSession | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = hmac(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64").toString("utf8")) as WebClaimSession;
    if (!payload?.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseClaimCodes(): Map<string, string> {
  const map = new Map<string, string>();
  CLAIM_CODES_RAW.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [code, role] = entry.split(":").map((part) => part.trim());
      if (code) {
        map.set(code, role || "member");
      }
    });
  return map;
}

function getTokenFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return request.cookies.get(WEB_SESSION_COOKIE)?.value ?? null;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_HOURS * 3600,
  };
}

export function redeemClaimCode(code: string): { role: string } | null {
  if (!CLAIM_CODES_RAW) return null;
  const codes = parseClaimCodes();
  const role = codes.get(code);
  if (!role) return null;
  if (CLAIM_CODES_ONE_TIME && usedClaimCodes.has(code)) return null;
  if (CLAIM_CODES_ONE_TIME) {
    usedClaimCodes.add(code);
  }
  return { role };
}

export function issueClaimSession(role: string, subject: string): { token: string; session: WebClaimSession } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_HOURS * 3600;
  const session: WebClaimSession = { sub: subject, role, exp };
  if (SESSION_SECRET) {
    return { token: signPayload(session), session };
  }
  const token = randomToken(24);
  memorySessions.set(token, { session, expiresAt: exp * 1000 });
  return { token, session };
}

export function getClaimSession(request: NextRequest): WebClaimSession | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  if (SESSION_SECRET) {
    return verifyToken(token);
  }
  const record = memorySessions.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    memorySessions.delete(token);
    return null;
  }
  return record.session;
}

export async function getSession(request: NextRequest): Promise<AccountSession | WebClaimSession | null> {
  if (hasDatabase()) {
    return getWebSession();
  }
  return getClaimSession(request);
}
