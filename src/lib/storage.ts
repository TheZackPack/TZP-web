import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { randomToken } from "@/lib/crypto";

function getStorageConfig() {
  const bucket = process.env.TZP_S3_BUCKET;
  const endpoint = process.env.TZP_S3_ENDPOINT;
  const accessKeyId = process.env.TZP_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.TZP_S3_SECRET_ACCESS_KEY;
  const region = process.env.TZP_S3_REGION || "auto";

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    bucket,
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
}

export function hasObjectStorage(): boolean {
  return Boolean(getStorageConfig());
}

export async function uploadAttachment(input: {
  crashReportId: string;
  fileName: string;
  contentType: string;
  contentBase64: string;
}) {
  const config = getStorageConfig();
  if (!config) {
    return null;
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
    forcePathStyle: true,
  });

  const key = `crash-reports/${input.crashReportId}/${randomToken(8)}-${input.fileName}`;
  const body = Buffer.from(input.contentBase64, "base64");

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: input.contentType,
    }),
  );

  return {
    key,
    byteSize: body.byteLength,
  };
}
