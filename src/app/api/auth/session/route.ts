import { NextRequest, NextResponse } from "next/server";

import { getAccountForLauncherToken, getWebSession } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
    });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const deviceToken = authHeader.slice("Bearer ".length).trim();
    const launcherSession = await getAccountForLauncherToken(deviceToken);

    return NextResponse.json({
      authenticated: Boolean(launcherSession),
      configured: true,
      clientType: "launcher",
      account: launcherSession,
    });
  }

  const session = await getWebSession();
  return NextResponse.json({
    authenticated: Boolean(session),
    configured: true,
    clientType: "web",
    account: session,
  });
}
