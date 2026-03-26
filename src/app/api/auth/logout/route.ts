import { NextResponse } from "next/server";

import { clearWebSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearWebSessionCookie();
  return NextResponse.json({ ok: true });
}
