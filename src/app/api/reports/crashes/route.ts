import { NextRequest, NextResponse } from "next/server";

import { requireWebSession } from "@/lib/api-auth";
import { query, queryOne } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { hasObjectStorage, uploadAttachment } from "@/lib/storage";

type CrashAttachmentInput = {
  fileName: string;
  contentType: string;
  contentBase64: string;
};

export async function POST(request: NextRequest) {
  const { error, session } = await requireWebSession();
  if (error || !session) {
    return error!;
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const summary = typeof body?.summary === "string" ? body.summary.trim() : "";
  const source = body?.source === "launcher" ? "launcher" : "minecraft";
  const launcherVersion =
    typeof body?.launcherVersion === "string" ? body.launcherVersion.trim() : null;
  const packVersion =
    typeof body?.packVersion === "string" ? body.packVersion.trim() : null;
  const osName = typeof body?.osName === "string" ? body.osName.trim() : null;
  const javaVersion =
    typeof body?.javaVersion === "string" ? body.javaVersion.trim() : null;
  const metadata =
    body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
  const attachments = Array.isArray(body?.attachments)
    ? (body.attachments as CrashAttachmentInput[]).slice(0, 5)
    : [];

  if (!title || !summary) {
    return jsonError("Title and summary are required", 400);
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
        pack_version,
        os_name,
        java_version,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      RETURNING id
    `,
    [
      session.accountId,
      session.minecraftUuid,
      session.username,
      title,
      summary,
      source,
      launcherVersion,
      packVersion,
      osName,
      javaVersion,
      JSON.stringify(metadata),
    ],
  );

  if (hasObjectStorage()) {
    for (const attachment of attachments) {
      const uploaded = await uploadAttachment({
        crashReportId: report!.id,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        contentBase64: attachment.contentBase64,
      });

      if (uploaded) {
        await query(
          `
            INSERT INTO crash_attachments (
              crash_report_id,
              file_name,
              content_type,
              storage_key,
              byte_size
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            report!.id,
            attachment.fileName,
            attachment.contentType,
            uploaded.key,
            uploaded.byteSize,
          ],
        );
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      reportId: report!.id,
      attachmentsAccepted: hasObjectStorage(),
      attachmentsStored: hasObjectStorage() ? attachments.length : 0,
    },
    { status: 201 },
  );
}
