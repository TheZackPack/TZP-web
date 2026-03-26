import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
