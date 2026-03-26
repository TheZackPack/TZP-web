import { NextRequest, NextResponse } from "next/server";

import { getAccountForLauncherToken } from "@/lib/auth";
import { requireWebSession } from "@/lib/api-auth";
import { queryOne } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body?.reports)) {
      const sessionToken =
        typeof body?.session_token === "string" ? body.session_token.trim() : "";
      if (!sessionToken) {
        return NextResponse.json({ error: "session_token is required." }, { status: 401 });
      }

      const launcherSession = await getAccountForLauncherToken(sessionToken);
      if (!launcherSession) {
        return NextResponse.json({ error: "Invalid launcher session." }, { status: 401 });
      }

      let stored = 0;
      for (const report of body.reports) {
        const reportTitle =
          typeof report?.filename === "string" && report.filename.trim()
            ? report.filename.trim()
            : typeof report?.type === "string" && report.type.trim()
              ? report.type.trim()
              : "Launcher Crash Report";
        const summary =
          typeof report?.message === "string" && report.message.trim()
            ? report.message.trim()
            : typeof report?.content === "string" && report.content.trim()
              ? report.content.trim().slice(0, 4000)
              : "Queued launcher crash report";

        await queryOne(
          `
            INSERT INTO crash_reports (
              account_id,
              launcher_device_id,
              minecraft_uuid,
              username_snapshot,
              title,
              summary,
              source,
              launcher_version,
              metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
            RETURNING id
          `,
          [
            launcherSession.accountId,
            launcherSession.launcherDeviceId,
            launcherSession.minecraftUuid,
            launcherSession.username,
            reportTitle,
            summary,
            "launcher",
            body?.launcher_version || null,
            JSON.stringify(report),
          ],
        );
        stored += 1;
      }

      return NextResponse.json({
        success: true,
        stored,
      });
    }

    const { error, session } = await requireWebSession();
    if (error || !session) {
      return error!;
    }

    const { title, description, launcherVersion, platform, log } = body || {};

    if (!title || !description || !log) {
      return NextResponse.json(
        { error: "Title, description, and log are required." },
        { status: 400 },
      );
    }

    const report = await queryOne<{ id: string }>(
      `
        INSERT INTO crash_reports (
          account_id,
          minecraft_uuid,
          username_snapshot,
          title,
          summary,
          source,
          launcher_version,
          os_name,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        RETURNING id
      `,
      [
        session.accountId,
        session.minecraftUuid,
        session.username,
        title,
        description,
        "dashboard",
        launcherVersion || null,
        platform || null,
        JSON.stringify({
          logPreview: String(log).slice(0, 20000),
          source: "dashboard",
        }),
      ],
    );

    return NextResponse.json(
      {
        success: true,
        reportId: report?.id ?? null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Crash report error:", err);
    return NextResponse.json({ error: "Failed to submit crash report." }, { status: 500 });
  }
}
