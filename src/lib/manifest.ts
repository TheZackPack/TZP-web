import type { ManifestPayload } from "@/lib/types";

const MANIFEST_URL =
  process.env.TZP_MANIFEST_URL ||
  "https://raw.githubusercontent.com/TheZackPack/TZP-client/main/manifest.json";

let cachedManifest: ManifestPayload | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export async function getManifest(forceFresh = false): Promise<ManifestPayload> {
  const now = Date.now();
  if (!forceFresh && cachedManifest && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedManifest;
  }

  const response = await fetch(MANIFEST_URL, {
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Manifest fetch failed with status ${response.status}`);
  }

  cachedManifest = (await response.json()) as ManifestPayload;
  cacheTimestamp = now;
  return cachedManifest;
}
