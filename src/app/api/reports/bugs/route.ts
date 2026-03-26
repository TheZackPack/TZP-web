import { NextRequest, NextResponse } from "next/server";

import { requireWebSession } from "@/lib/api-auth";
import { createBugIssue } from "@/lib/github";
import { queryOne } from "@/lib/db";
import { getClientIp, jsonError } from "@/lib/http";

const rateLimitMap = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);
  if (lastRequest && now - lastRequest < 60_000) {
    return true;
  }
  rateLimitMap.set(ip, now);
  return false;
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireWebSession();
  if (error || !session) {
    return error!;
  }

  const ip = getClientIp(request.headers);
  if (isRateLimited(ip)) {
    return jsonError("Rate limited. Try again in a minute.", 429);
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const launcherVersion =
    typeof body?.launcherVersion === "string" ? body.launcherVersion.trim() : null;
  const packVersion =
    typeof body?.packVersion === "string" ? body.packVersion.trim() : null;
  const selectedMods = Array.isArray(body?.selectedMods)
    ? body.selectedMods
        .filter((value: unknown) => typeof value === "string")
        .slice(0, 32)
    : [];
  const selectedItemId =
    typeof body?.selectedItemId === "string" ? body.selectedItemId.trim() : null;
  const selectedItemOther =
    typeof body?.selectedItemOther === "string"
      ? body.selectedItemOther.trim()
      : null;
  const otherContext =
    typeof body?.otherContext === "string" ? body.otherContext.trim() : null;

  if (!title || !description) {
    return jsonError("Title and description are required", 400);
  }

  if (title.length > 200 || description.length > 5000) {
    return jsonError("Bug report is too large", 400);
  }

  const report = await queryOne<{ id: string }>(
    `
      INSERT INTO bug_reports (
        account_id,
        minecraft_uuid,
        username_snapshot,
        title,
        body,
        launcher_version,
        pack_version,
        selected_item_id,
        selected_item_other,
        other_context,
        selected_mods
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      RETURNING id
    `,
    [
      session.accountId,
      session.minecraftUuid,
      session.username,
      title,
      description,
      launcherVersion,
      packVersion,
      selectedItemId,
      selectedItemOther,
      otherContext,
      JSON.stringify(selectedMods),
    ],
  );

  const issueBody = [
    `**Reporter:** ${session.displayName} (${session.username})`,
    `**Minecraft UUID:** ${session.minecraftUuid}`,
    launcherVersion ? `**Launcher Version:** ${launcherVersion}` : null,
    packVersion ? `**Pack Version:** ${packVersion}` : null,
    selectedMods.length ? `**Mods:** ${selectedMods.join(", ")}` : null,
    selectedItemId ? `**Item/Block:** ${selectedItemId}` : null,
    selectedItemOther ? `**Other Item Context:** ${selectedItemOther}` : null,
    otherContext ? `**Extra Context:** ${otherContext}` : null,
    "",
    "---",
    "",
    description,
  ]
    .filter(Boolean)
    .join("\n");

  const mirrored = await createBugIssue({
    title: `[Bug Report] ${title}`,
    body: issueBody,
    labels: ["bug", "dashboard-report"],
  });

  if (mirrored) {
    await queryOne(
      `
        UPDATE bug_reports
        SET github_issue_number = $2,
            github_issue_url = $3
        WHERE id = $1
      `,
      [report!.id, mirrored.issueNumber, mirrored.issueUrl],
    );
  }

  return NextResponse.json(
    {
      ok: true,
      reportId: report!.id,
      mirrored,
    },
    { status: 201 },
  );
}
