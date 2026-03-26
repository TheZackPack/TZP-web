import { NextResponse } from "next/server";

import { fetchLatestLauncherRelease } from "@/lib/github";

const FALLBACK_WINDOWS_URL =
  "https://github.com/TheZackPack/TZP-launcher/releases/latest/download/TZP-Launcher-Windows-Setup.exe";
const FALLBACK_UNIVERSAL_URL =
  "https://github.com/TheZackPack/TZP-launcher/releases/latest/download/TZP-Launcher-Universal-Python.zip";

export async function GET() {
  try {
    const release = await fetchLatestLauncherRelease();
    const assets: Array<{ name?: string; browser_download_url?: string }> = Array.isArray(release.assets)
      ? release.assets
      : [];
    const findAsset = (name: string) =>
      assets.find((asset) => asset.name === name)?.browser_download_url ?? null;

    return NextResponse.json({
      version: release.tag_name?.replace(/^v/i, "") ?? null,
      tagName: release.tag_name ?? null,
      title: release.name || release.tag_name || "TZP Launcher",
      summary: typeof release.body === "string" ? release.body.slice(0, 1200) : "",
      required: process.env.TZP_LAUNCHER_UPDATE_REQUIRED === "true",
      minimumSupportedVersion:
        process.env.TZP_MIN_SUPPORTED_LAUNCHER_VERSION || "1.1.0",
      windowsUrl: findAsset("TZP-Launcher-Windows-Setup.exe") ?? FALLBACK_WINDOWS_URL,
      universalUrl:
        findAsset("TZP-Launcher-Universal-Python.zip") ?? FALLBACK_UNIVERSAL_URL,
      releaseUrl: release.html_url ?? "https://github.com/TheZackPack/TZP-launcher/releases/latest",
      developerUrl: release.html_url ?? "https://github.com/TheZackPack/TZP-launcher/releases/latest",
      publishedAt: release.published_at ?? null,
    });
  } catch (error) {
    console.error("Launcher release lookup failed:", error);
    return NextResponse.json(
      {
        version: null,
        title: "TZP Launcher",
        summary: "",
        required: false,
        minimumSupportedVersion: process.env.TZP_MIN_SUPPORTED_LAUNCHER_VERSION || "1.1.0",
        windowsUrl: FALLBACK_WINDOWS_URL,
        universalUrl: FALLBACK_UNIVERSAL_URL,
        releaseUrl: "https://github.com/TheZackPack/TZP-launcher/releases/latest",
        developerUrl: "https://github.com/TheZackPack/TZP-launcher/releases/latest",
      },
      { status: 200 },
    );
  }
}
