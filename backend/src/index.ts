import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { manifestRouter } from "./routes/manifest.js";
import { statusRouter } from "./routes/status.js";
import { bugsRouter } from "./routes/bugs.js";
import { patchnotesRouter } from "./routes/patchnotes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// API routes
app.use("/api/manifest", manifestRouter);
app.use("/api/status", statusRouter);
app.use("/api/bugs", bugsRouter);
app.use("/api/patchnotes", patchnotesRouter);

// Health check (API)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "tzp-web-backend" });
});

// Serve Next.js static export
const frontendPath = path.join(__dirname, "../../frontend/out");
app.use(express.static(frontendPath, { extensions: ["html"] }));

// Catch-all: serve index.html for client-side routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`TZP backend listening on port ${PORT}`);
  console.log(`Serving frontend from ${frontendPath}`);
});
