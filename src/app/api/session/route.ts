import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  return NextResponse.json({
    authenticated: Boolean(session),
    configured: hasDatabase() || Boolean(process.env.TZP_CLAIM_CODES),
    session,
  });
}
