import { Router } from "express";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export const patchnotesRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, "..", "data", "patchnotes.json");

let cachedNotes: unknown = null;

patchnotesRouter.get("/", async (_req, res) => {
  try {
    if (!cachedNotes) {
      const raw = await readFile(DATA_PATH, "utf-8");
      cachedNotes = JSON.parse(raw);
    }
    res.json(cachedNotes);
  } catch (err) {
    console.error("Patchnotes read error:", err);
    res.status(500).json({ error: "Failed to load patch notes" });
  }
});
