import { Router } from "express";

export const manifestRouter = Router();

const MANIFEST_URL =
  process.env.MANIFEST_URL ||
  "https://github.com/Zack-Grogan/TZP-client/releases/latest/download/manifest.json";

let cachedManifest: unknown = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

manifestRouter.get("/", async (_req, res) => {
  try {
    const now = Date.now();
    if (cachedManifest && now - cacheTimestamp < CACHE_TTL) {
      res.json(cachedManifest);
      return;
    }

    const response = await fetch(MANIFEST_URL);
    if (!response.ok) {
      res.status(502).json({ error: "Failed to fetch manifest" });
      return;
    }

    cachedManifest = await response.json();
    cacheTimestamp = now;
    res.json(cachedManifest);
  } catch (err) {
    console.error("Manifest fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
