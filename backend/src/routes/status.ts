import { Router } from "express";
import net from "net";

export const statusRouter = Router();

const MC_HOST = process.env.MC_SERVER_HOST || "15.204.117.31";
const MC_PORT = parseInt(process.env.MC_SERVER_PORT || "25565", 10);

interface ServerStatus {
  online: boolean;
  players: { online: number; max: number };
  version: string;
}

let cachedStatus: ServerStatus | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

function checkServer(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(MC_PORT, MC_HOST);
  });
}

statusRouter.get("/", async (_req, res) => {
  try {
    const now = Date.now();
    if (cachedStatus && now - cacheTimestamp < CACHE_TTL) {
      res.json(cachedStatus);
      return;
    }

    const online = await checkServer();

    cachedStatus = {
      online,
      players: { online: 0, max: 20 },
      version: "1.21.1",
    };
    cacheTimestamp = now;

    res.json(cachedStatus);
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
