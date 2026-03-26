"use client";

import { useEffect, useState } from "react";

type Platform = "windows" | "universal" | "unknown";

const RELEASE_BASE =
  "https://github.com/TheZackPack/TZP-launcher/releases/latest/download";
const WINDOWS_URL = `${RELEASE_BASE}/TZP-Launcher-Windows-Setup.exe`;
const UNIVERSAL_URL =
  `${RELEASE_BASE}/TZP-Launcher-Universal-Python.zip`;
const GUIDE_URL = "https://github.com/TheZackPack/TZP-launcher#universal-python-package";

const DOWNLOADS: Record<string, { label: string; file: string; icon: string }> = {
  windows: {
    label: "Windows installer",
    file: WINDOWS_URL,
    icon: "W",
  },
  universal: {
    label: "Universal Python package",
    file: UNIVERSAL_URL,
    icon: "P",
  },
};

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac") || ua.includes("linux")) return "universal";
  return "universal";
}

export default function DownloadButton() {
  const [showPicker, setShowPicker] = useState(false);
  const [detected, setDetected] = useState<Platform>("unknown");

  useEffect(() => {
    setDetected(detectPlatform());
  }, []);

  if (showPicker) {
    return (
      <div className="w-full max-w-2xl space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(DOWNLOADS).map(([key, { label, file, icon }]) => (
            <a
              key={key}
              href={file}
              className={`group relative flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 ${
                key === detected
                  ? "border-blue-500/50 bg-blue-600/10 text-white"
                  : "border-[#262626] bg-[#141414] text-text-primary hover:border-blue-500/40 hover:bg-[#1a1a1a]"
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20 text-lg font-bold tracking-[0.25em]">
                {icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-text-secondary">
                  {key === "windows"
                    ? key === detected
                      ? "Recommended for this device"
                      : "Official Windows installer"
                    : key === detected
                      ? "Recommended for this device"
                      : "macOS, Linux, and development package"}
                </span>
              </span>
            </a>
          ))}
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] px-5 py-4 text-left">
          <p className="text-sm font-medium text-text-primary">
            Windows is the only officially packaged platform.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            macOS and Linux use the universal Python package with Python 3.11+ and Java 21.
            It installs the modpack into its own launcher-managed game directory outside the repo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a
            href={UNIVERSAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent/80 hover:text-accent underline underline-offset-4"
          >
            Download universal package
          </a>
          <a
            href={GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent/80 hover:text-accent underline underline-offset-4"
          >
            macOS and Linux instructions
          </a>
          <button
            onClick={() => setShowPicker(false)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPicker(true)}
      className="group relative inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-blue-500 cursor-pointer"
    >
      <span className="relative z-10 flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download Launcher
      </span>
    </button>
  );
}
