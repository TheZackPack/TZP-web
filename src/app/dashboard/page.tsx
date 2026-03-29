"use client";

import { useEffect, useState } from "react";
import ServerStatus from "@/components/ServerStatus";
import PatchNotesTabbed from "@/components/PatchNotesTabbed";
import MadGodLog from "@/components/MadGodLog";
import BugReportForm from "@/components/BugReportForm";
import DownloadButton from "@/components/DownloadButton";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "madgod" | "patches" | "players" | "downloads" | "bugs";

type ClaimSession = { sub: string; role: string; exp: number };
type AccountSession = {
  accountId: string;
  playerId: string;
  minecraftUuid: string;
  username: string;
  displayName: string;
};
type Session = ClaimSession | AccountSession;

interface PlayerStat {
  id: string;
  username: string;
  playtime: number;
  deaths: number;
  kills: number;
  quests_completed: number;
  madgod_relationship: number;
  last_seen: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}

function RelationshipBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const color =
    clamped >= 70
      ? "bg-green-500"
      : clamped >= 40
        ? "bg-amber-500"
        : "bg-red-500";
  const label =
    clamped >= 70 ? "Favored" : clamped >= 40 ? "Neutral" : "Despised";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#262626] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-text-secondary shrink-0">
        {label}
      </span>
    </div>
  );
}

// ── Nav items ────────────────────────────────────────────────────────────────

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "madgod",
    label: "MadGod Log",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "patches",
    label: "Patch Notes",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "players",
    label: "Players",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "downloads",
    label: "Downloads",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
  {
    id: "bugs",
    label: "Bug Report",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
];

// ── Copy IP button ────────────────────────────────────────────────────────────

function CopyIPButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText("15.204.117.31").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 w-full px-4 py-3 surface rounded-lg hover:border-accent/40 transition-all duration-200 text-left group"
    >
      <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-accent">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-medium text-text-primary">
          {copied ? "Copied!" : "Join Server"}
        </div>
        <div className="text-xs font-mono text-text-secondary">15.204.117.31</div>
      </div>
    </button>
  );
}

// ── Players tab ───────────────────────────────────────────────────────────────

function PlayersTab() {
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/madgod/players")
      .then((r) => (r.ok ? r.json() : { players: [] }))
      .then((data) => {
        if (mounted) setPlayers(data.players ?? []);
      })
      .catch(() => {
        if (mounted) setPlayers([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface rounded-xl p-4 animate-pulse">
            <div className="h-5 bg-[#262626] rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="surface rounded-xl p-12 text-center text-text-secondary">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">No player data yet.</p>
        <p className="text-xs mt-1 text-text-secondary/50">
          Stats appear once players connect and MadGod comes online.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[minmax(0,1fr)_80px_60px_60px_80px_160px] gap-4 px-4 py-2 text-xs font-mono text-text-secondary/60 uppercase tracking-wider border-b border-[#262626]">
        <span>Player</span>
        <span>Playtime</span>
        <span>Deaths</span>
        <span>Kills</span>
        <span>Quests</span>
        <span>MadGod Rep</span>
      </div>

      {players.map((p) => (
        <div
          key={p.id}
          className="surface rounded-xl px-4 py-4 md:grid md:grid-cols-[minmax(0,1fr)_80px_60px_60px_80px_160px] md:items-center gap-4"
        >
          {/* Player */}
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc-heads.net/avatar/${p.username}/32`}
              alt={p.username}
              width={32}
              height={32}
              className="rounded-sm shrink-0"
            />
            <div>
              <div className="text-sm font-semibold text-text-primary">
                {p.username}
              </div>
              {p.last_seen && (
                <div className="text-[10px] text-text-secondary/50 font-mono">
                  Last seen {new Date(p.last_seen).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Stats — mobile shows inline labels */}
          <div className="grid grid-cols-2 gap-2 md:contents">
            <StatCell label="Playtime" value={formatPlaytime(p.playtime)} mono />
            <StatCell label="Deaths" value={p.deaths.toString()} color="text-red-400/70" mono />
            <StatCell label="Kills" value={p.kills.toString()} mono />
            <StatCell label="Quests" value={p.quests_completed.toString()} color="text-green-400/70" mono />
            <div className="col-span-2 md:col-span-1">
              <div className="text-[10px] font-mono text-text-secondary/60 mb-1 md:hidden">
                MadGod Rep
              </div>
              <RelationshipBar value={p.madgod_relationship} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCell({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono text-text-secondary/60 mb-0.5 md:hidden">
        {label}
      </div>
      <span
        className={`text-sm ${mono ? "font-mono" : ""} ${color ?? "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Downloads tab ─────────────────────────────────────────────────────────────

const RELEASE_BASE =
  "https://github.com/TheZackPack/TZP-launcher/releases/latest/download";

function DownloadsTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Launcher */}
      <div className="surface rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">TZP Launcher</h3>
          <p className="text-sm text-text-secondary">
            The official launcher with one-click install, automatic updates, and crash detection.
            Download the version for your platform.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DownloadButton />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <DownloadCard
            icon="W"
            label="Windows Installer"
            sub="Recommended — .exe setup"
            href={`${RELEASE_BASE}/TZP-Launcher-Windows-Setup.exe`}
            primary
          />
          <DownloadCard
            icon="P"
            label="Universal Python"
            sub="macOS, Linux, Python 3.11+"
            href={`${RELEASE_BASE}/TZP-Launcher-Universal-Python.zip`}
          />
        </div>
        <p className="text-xs text-text-secondary/60 font-mono">
          Requires Java 21 · NeoForge 1.21.1 · 16 GB RAM recommended
        </p>
      </div>

      {/* Server ZIP */}
      <div className="surface rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Server Package</h3>
          <p className="text-sm text-text-secondary">
            Self-host the TZP modpack on your own machine. Includes all server configs,
            scripts, and a clean world. No world data or secrets included.
          </p>
        </div>
        <a
          href="https://github.com/Zack-Grogan/TZP-server/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#262626] bg-[#141414] text-text-primary hover:border-white/20 hover:bg-white/[0.04] transition-all text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          View Server Releases on GitHub
        </a>
        <p className="text-xs text-text-secondary/60 font-mono">
          16 GB RAM server minimum · NeoForge 1.21.1 · Java 21
        </p>
      </div>

      {/* Requirements */}
      <div className="surface rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">System Requirements</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <RequirementRow label="Java" value="21 (temurin recommended)" />
          <RequirementRow label="Minecraft" value="1.21.1 (Java Edition)" />
          <RequirementRow label="Loader" value="NeoForge 1.21.1-21.1.220" />
          <RequirementRow label="RAM (client)" value="8 GB minimum, 12 GB recommended" />
          <RequirementRow label="RAM (server)" value="12 GB minimum, 16 GB recommended" />
          <RequirementRow label="Mods" value="250+ — all managed by launcher" />
        </div>
      </div>
    </div>
  );
}

function DownloadCard({
  icon,
  label,
  sub,
  href,
  primary,
}: {
  icon: string;
  label: string;
  sub: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
        primary
          ? "border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/15"
          : "border-[#262626] bg-[#141414] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      <span className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-sm font-bold font-mono text-text-primary shrink-0">
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-secondary">{sub}</div>
      </div>
    </a>
  );
}

function RequirementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-secondary shrink-0 font-mono text-xs mt-0.5">{label}:</span>
      <span className="text-text-primary text-xs">{value}</span>
    </div>
  );
}

// ── Access / claim card ────────────────────────────────────────────────────────

function AccessCard({
  session,
  sessionLoading,
  claimCode,
  setClaimCode,
  claimStatus,
  claimMessage,
  handleClaimCode,
}: {
  session: Session | null;
  sessionLoading: boolean;
  claimCode: string;
  setClaimCode: (v: string) => void;
  claimStatus: "idle" | "loading" | "success" | "error";
  claimMessage: string;
  handleClaimCode: () => void;
}) {
  const isClaimSession = session && "role" in session;
  const expiresAt =
    session && "exp" in session
      ? new Date(session.exp * 1000).toLocaleString()
      : "Managed";
  const sessionLabel =
    session && "displayName" in session
      ? `${session.displayName} (${session.username})`
      : session && "sub" in session
        ? session.sub
        : "Unknown";

  return (
    <div className="surface rounded-xl p-6 border border-[#262626]">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="font-mono text-accent text-sm">02</span>
        Access Pass
      </h2>
      <p className="text-sm text-text-secondary mb-4">
        Claim codes unlock bug and crash reporting without making the dashboard private.
      </p>
      {sessionLoading ? (
        <div className="text-sm text-text-secondary">Checking access...</div>
      ) : session ? (
        <div className="space-y-2">
          <div className="text-sm text-text-primary">
            Access unlocked for{" "}
            <span className="text-accent">
              {isClaimSession ? (session as ClaimSession).role : "account"}
            </span>
          </div>
          <div className="text-xs text-text-secondary font-mono">
            Session: {sessionLabel} · Expires: {expiresAt}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleClaimCode()}
            placeholder="Enter claim code"
            className="flex-1 px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent text-sm"
          />
          <button
            onClick={handleClaimCode}
            disabled={claimStatus === "loading"}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60 text-sm"
          >
            {claimStatus === "loading" ? "Checking..." : "Redeem"}
          </button>
        </div>
      )}
      {claimMessage && (
        <div
          className={`mt-3 text-sm ${
            claimStatus === "error" ? "text-red-400" : "text-green-400"
          }`}
        >
          {claimMessage}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [claimCode, setClaimCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [claimMessage, setClaimMessage] = useState("");
  const [crashTitle, setCrashTitle] = useState("");
  const [crashDescription, setCrashDescription] = useState("");
  const [crashLog, setCrashLog] = useState("");
  const [crashStatus, setCrashStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [crashMessage, setCrashMessage] = useState("");

  // Session load
  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setSession(data.session || null);
      } catch {
        if (mounted) setSession(null);
      } finally {
        if (mounted) setSessionLoading(false);
      }
    }
    loadSession();
    return () => { mounted = false; };
  }, []);

  async function handleClaimCode() {
    if (!claimCode.trim()) {
      setClaimStatus("error");
      setClaimMessage("Enter a claim code to unlock reporting.");
      return;
    }
    setClaimStatus("loading");
    setClaimMessage("");
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: claimCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimStatus("error");
        setClaimMessage(data.error || "Claim code rejected.");
        return;
      }
      setClaimStatus("success");
      setClaimMessage("Access unlocked.");
      setSession(data.session || null);
      setClaimCode("");
    } catch {
      setClaimStatus("error");
      setClaimMessage("Network error. Try again.");
    }
  }

  async function handleCrashSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!crashTitle.trim() || !crashDescription.trim() || !crashLog.trim()) {
      setCrashStatus("error");
      setCrashMessage("Title, description, and log are required.");
      return;
    }
    setCrashStatus("loading");
    setCrashMessage("");
    try {
      const res = await fetch("/api/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: crashTitle.trim(),
          description: crashDescription.trim(),
          log: crashLog.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCrashStatus("error");
        setCrashMessage(data.error || "Crash report failed.");
        return;
      }
      setCrashStatus("success");
      setCrashMessage(
        data.reportId
          ? `Crash report stored as ${data.reportId}.`
          : "Crash report stored successfully.",
      );
      setCrashTitle("");
      setCrashDescription("");
      setCrashLog("");
    } catch {
      setCrashStatus("error");
      setCrashMessage("Network error. Try again.");
    }
  }

  const tabTitle: Record<Tab, string> = {
    overview: "Overview",
    madgod: "MadGod Log",
    patches: "Patch Notes",
    players: "Players",
    downloads: "Downloads",
    bugs: "Report a Bug",
  };

  return (
    <main className="min-h-screen relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 surface-elevated">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-extrabold tracking-tight text-white">
            TZP
          </a>
          <span className="text-sm text-text-secondary font-mono">// dashboard</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 lg:pb-16 relative z-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              <div className="text-xs font-mono text-text-secondary/60 uppercase tracking-wider px-3 mb-3">
                Navigation
              </div>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-item flex items-center gap-3 w-full text-left ${
                    activeTab === item.id ? "active" : ""
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}

              <div className="!mt-8 text-xs font-mono text-text-secondary/60 uppercase tracking-wider px-3 mb-3">
                Quick Actions
              </div>
              <CopyIPButton />
              <div className="px-2">
                <DownloadButton />
              </div>
            </div>
          </aside>

          {/* Mobile tab bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 surface-elevated border-t border-[#262626] flex justify-around py-2 px-2 overflow-x-auto gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors shrink-0 ${
                  activeTab === item.id
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.icon}
                <span className="text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-8 animate-fade-in-up">
              {tabTitle[activeTab]}
            </h1>

            {/* ── Overview ──────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Server Status */}
                <div className="surface rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="font-mono text-accent text-sm">01</span>
                    Server Status
                  </h2>
                  <ServerStatus />
                </div>

                <AccessCard
                  session={session}
                  sessionLoading={sessionLoading}
                  claimCode={claimCode}
                  setClaimCode={setClaimCode}
                  claimStatus={claimStatus}
                  claimMessage={claimMessage}
                  handleClaimCode={handleClaimCode}
                />

                {/* Quick Actions (mobile) */}
                <div className="lg:hidden surface rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="font-mono text-accent text-sm">03</span>
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <CopyIPButton />
                    <DownloadButton />
                  </div>
                </div>

                {/* MadGod preview */}
                <div className="surface rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="font-mono text-accent text-sm">04</span>
                      MadGod Activity
                    </h2>
                    <button
                      onClick={() => setActiveTab("madgod")}
                      className="text-xs text-accent/70 hover:text-accent transition-colors font-mono"
                    >
                      View all →
                    </button>
                  </div>
                  <MadGodLog />
                </div>
              </div>
            )}

            {/* ── MadGod Log ─────────────────────────────────────────────── */}
            {activeTab === "madgod" && (
              <div className="animate-fade-in-up">
                <p className="text-text-secondary text-sm mb-6">
                  Live feed of MadGod events — combat, treasure, story encounters, buffs, sacrifices, and more.
                  Auto-refreshes every 30 seconds.
                </p>
                <MadGodLog />
              </div>
            )}

            {/* ── Patch Notes ────────────────────────────────────────────── */}
            {activeTab === "patches" && (
              <div className="animate-fade-in-up">
                <p className="text-text-secondary text-sm mb-6">
                  All update streams — Launcher, Client modpack, Server ZIP, and Live server.
                </p>
                <PatchNotesTabbed />
              </div>
            )}

            {/* ── Players ───────────────────────────────────────────────── */}
            {activeTab === "players" && (
              <div className="animate-fade-in-up">
                <p className="text-text-secondary text-sm mb-6">
                  Player statistics tracked by MadGod — playtime, deaths, quests completed, and relationship score.
                </p>
                <PlayersTab />
              </div>
            )}

            {/* ── Downloads ─────────────────────────────────────────────── */}
            {activeTab === "downloads" && (
              <div className="animate-fade-in-up">
                <DownloadsTab />
              </div>
            )}

            {/* ── Bug Report ─────────────────────────────────────────────── */}
            {activeTab === "bugs" && (
              <div className="max-w-2xl animate-fade-in-up">
                {!session ? (
                  <div className="space-y-6">
                    <AccessCard
                      session={session}
                      sessionLoading={sessionLoading}
                      claimCode={claimCode}
                      setClaimCode={setClaimCode}
                      claimStatus={claimStatus}
                      claimMessage={claimMessage}
                      handleClaimCode={handleClaimCode}
                    />
                    <div className="surface rounded-xl p-6 text-sm text-text-secondary">
                      Bug and crash reports are gated behind claim codes. Redeem one above to
                      unlock submissions.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="surface rounded-xl p-8">
                      <p className="text-text-secondary text-sm mb-6">
                        Found something broken? Let us know. Supports Markdown in the description field.
                      </p>
                      <BugReportForm />
                    </div>

                    <form onSubmit={handleCrashSubmit} className="surface rounded-xl p-8 space-y-4">
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Crash Report</h2>
                        <p className="text-text-secondary text-sm">
                          Paste the crash log and a short description.
                          This stores an internal crash report tied to your TZP account.
                        </p>
                      </div>
                      <input
                        value={crashTitle}
                        onChange={(e) => setCrashTitle(e.target.value)}
                        placeholder="Crash title"
                        className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent text-sm"
                      />
                      <textarea
                        value={crashDescription}
                        onChange={(e) => setCrashDescription(e.target.value)}
                        placeholder="What happened right before the crash?"
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent text-sm"
                      />
                      <textarea
                        value={crashLog}
                        onChange={(e) => setCrashLog(e.target.value)}
                        placeholder="Paste crash log here"
                        rows={6}
                        className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
                      />
                      <button
                        type="submit"
                        disabled={crashStatus === "loading"}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60 text-sm"
                      >
                        {crashStatus === "loading" ? "Submitting..." : "Submit Crash Report"}
                      </button>
                      {crashMessage && (
                        <div
                          className={`text-sm ${
                            crashStatus === "error" ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {crashMessage}
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
