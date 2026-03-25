import { Router } from "express";
import { Octokit } from "@octokit/rest";

export const bugsRouter = Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "Zack-Grogan";
const REPO_NAME = "TZP-server";

// Simple in-memory rate limiter: 1 request per IP per minute
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

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamp] of rateLimitMap) {
    if (now - timestamp > 60_000) {
      rateLimitMap.delete(ip);
    }
  }
}, 300_000);

bugsRouter.post("/", async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      res.status(503).json({ error: "Bug reporting is not configured" });
      return;
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    if (isRateLimited(ip)) {
      res.status(429).json({ error: "Rate limited. Try again in a minute." });
      return;
    }

    const { title, description, reporter } = req.body;

    if (!title || !description) {
      res
        .status(400)
        .json({ error: "Title and description are required" });
      return;
    }

    if (typeof title !== "string" || title.length > 200) {
      res.status(400).json({ error: "Title must be under 200 characters" });
      return;
    }

    if (typeof description !== "string" || description.length > 5000) {
      res
        .status(400)
        .json({ error: "Description must be under 5000 characters" });
      return;
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const issueBody = [
      `**Reported by:** ${reporter || "Anonymous"}`,
      `**Source:** TZP Web Dashboard`,
      "",
      "---",
      "",
      description,
    ].join("\n");

    const issue = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `[Bug Report] ${title}`,
      body: issueBody,
      labels: ["bug", "web-report"],
    });

    res.status(201).json({
      success: true,
      issueNumber: issue.data.number,
      issueUrl: issue.data.html_url,
    });
  } catch (err) {
    console.error("Bug report error:", err);
    res.status(500).json({ error: "Failed to create bug report" });
  }
});
