"use client";

import { useEffect, useState } from "react";
import PatchNotesTabbed from "@/components/PatchNotesTabbed";
import MadGodLog from "@/components/MadGodLog";
import BugReportForm from "@/components/BugReportForm";
import DownloadButton from "@/components/DownloadButton";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "servers" | "patches" | "downloads" | "bugs";

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

interface ServerInfo {
  name: string;
  label: string;
  ip: string;
  port: number;
  version: string;
  modCount: number;
  description: string;
}

// ── Server definitions ──────────────────────────────────────────────────────

const SERVERS: ServerInfo[] = [
  {
    name: "stable",
    label: "TZP (Stable)",
    ip: "15.204.117.31",
    port: 25565,
    version: "v1.1.9",
    modCount: 195,
    description: "Production server — stable, tested, live for all players.",
  },
  {
    name: "beta",
    label: "TZP Beta",
    ip: "",  // PebbleHost IP — set when available
    port: 25565,
    version: "v2.0.0-alpha",
    modCount: 261,
    description: "Beta server — testing v2.0 features, new mods, EMC rework.",
  },
];

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
    clamped >= 70 ? "bg-green-500" : clamped >= 40 ? "bg-amber-500" : "bg-red-500";
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

const navItems: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "servers", label: "Servers" },
  { id: "patches", label: "Patch Notes" },
  { id: "downloads", label: "Downloads" },
  { id: "bugs", label: "Bug Report" },
];

// ── Server Card ──────────────────────────────────────────────────────────────

function ServerCard({ server }: { server: ServerInfo }) {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");
  const [players, setPlayers] = useState({ online: 0, max: 20 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!server.ip) {
      setStatus("offline");
      return;
    }
    // Try to ping via our status API
    fetch(`/api/status?ip=${server.ip}&port=${server.port}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.online) {
          setStatus("online");
          setPlayers({ online: data.players?.online ?? 0, max: data.players?.max ?? 20 });
        } else {
          setStatus("offline");
        }
      })
      .catch(() => setStatus("offline"));
  }, [server.ip, server.port]);

  function handleCopy() {
    if (!server.ip) return;
    const addr = server.port !== 25565 ? `${server.ip}:${server.port}` : server.ip;
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isBeta = server.name === "beta";
  const borderClass = isBeta
    ? "border-purple-500/20 hover:border-purple-500/40"
    : "border-[#262626] hover:border-accent/40";

  return (
    <div className={`surface rounded-xl p-6 border transition-colors ${borderClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">{server.label}</h3>
          {isBeta && (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Beta
            </span>
          )}
          {!isBeta && (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded bg-green-500/10 text-green-400 border border-green-500/20">
              Stable
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <span className="w-2 h-2 rounded-full bg-[#525252] animate-pulse" />
          ) : status === "online" ? (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-red-500/60" />
          )}
          <span className="text-xs font-mono text-text-secondary">
            {status === "loading" ? "Checking..." : status === "online" ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4">{server.description}</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-[10px] font-mono text-text-secondary/60 uppercase tracking-wider mb-1">
            Players
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {status === "online" ? (
              <>
                {players.online}
                <span className="text-text-secondary font-normal text-sm"> / {players.max}</span>
              </>
            ) : (
              <span className="text-text-secondary text-sm">—</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-text-secondary/60 uppercase tracking-wider mb-1">
            Version
          </div>
          <div className="text-sm font-mono text-white">{server.version}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-text-secondary/60 uppercase tracking-wider mb-1">
            Mods
          </div>
          <div className="text-sm font-mono text-white">{server.modCount}</div>
        </div>
      </div>

      {/* IP + Copy */}
      {server.ip ? (
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/30 border border-[#262626] hover:border-accent/30 transition-colors group"
        >
          <code className="text-xs font-mono text-text-secondary group-hover:text-text-primary transition-colors">
            {server.port !== 25565 ? `${server.ip}:${server.port}` : server.ip}
          </code>
          <span className="text-[10px] font-mono text-accent/70">
            {copied ? "Copied!" : "Click to copy"}
          </span>
        </button>
      ) : (
        <div className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-[#262626] text-center">
          <span className="text-xs font-mono text-text-secondary/50">
            Server IP coming soon
          </span>
        </div>
      )}
    </div>
  );
}

// ── Players section ──────────────────────────────────────────────────────────

function PlayersSection() {
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
      <div className="surface rounded-xl p-8 text-center text-text-secondary">
        <p className="text-sm">No player data yet. Stats appear once MadGod comes online.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
          className="surface rounded-xl px-4 py-3 md:grid md:grid-cols-[minmax(0,1fr)_80px_60px_60px_80px_160px] md:items-center gap-4"
        >
          <div className="flex items-center gap-3 mb-2 md:mb-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc-heads.net/avatar/${p.username}/28`}
              alt={p.username}
              width={28}
              height={28}
              className="rounded-sm shrink-0"
            />
            <span className="text-sm font-semibold text-text-primary">{p.username}</span>
          </div>
          <span className="text-sm font-mono text-text-primary">{formatPlaytime(p.playtime)}</span>
          <span className="text-sm font-mono text-red-400/70">{p.deaths}</span>
          <span className="text-sm font-mono text-text-primary">{p.kills}</span>
          <span className="text-sm font-mono text-green-400/70">{p.quests_completed}</span>
          <RelationshipBar value={p.madgod_relationship} />
        </div>
      ))}
    </div>
  );
}

// ── Downloads section ────────────────────────────────────────────────────────

const RELEASE_BASE = "https://github.com/TheZackPack/TZP-launcher/releases/latest/download";

function DownloadsSection() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Launcher */}
      <div className="surface rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">TZP Launcher</h3>
        <p className="text-sm text-text-secondary">
          Official launcher with version picker, auto-updates, and crash detection.
        </p>
        <div className="space-y-3">
          <a
            href={`${RELEASE_BASE}/TZP-Launcher-Windows-Setup.exe`}
            className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/15 px-4 py-3 transition-all"
          >
            <span className="w-8 h-8 rounded bg-black/30 flex items-center justify-center text-xs font-bold font-mono text-white">W</span>
            <div>
              <div className="text-sm font-medium text-text-primary">Windows Installer</div>
              <div className="text-xs text-text-secondary">Recommended — .exe setup</div>
            </div>
          </a>
          <a
            href={`${RELEASE_BASE}/TZP-Launcher-Universal-Python.zip`}
            className="flex items-center gap-3 rounded-lg border border-[#262626] bg-[#141414] hover:border-white/20 px-4 py-3 transition-all"
          >
            <span className="w-8 h-8 rounded bg-black/30 flex items-center justify-center text-xs font-bold font-mono text-white">P</span>
            <div>
              <div className="text-sm font-medium text-text-primary">Universal Python</div>
              <div className="text-xs text-text-secondary">macOS, Linux, Python 3.11+</div>
            </div>
          </a>
        </div>
        <p className="text-xs text-text-secondary/60 font-mono">
          Requires Java 21 · NeoForge 1.21.1
        </p>
      </div>

      {/* Server ZIP */}
      <div className="surface rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Server Package</h3>
        <p className="text-sm text-text-secondary">
          Self-host TZP on your own machine. All configs, scripts, and a clean world included.
        </p>
        <a
          href="https://github.com/TheZackPack/TZP-server/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#262626] bg-[#141414] text-text-primary hover:border-white/20 transition-all text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          View Server Releases
        </a>
        <p className="text-xs text-text-secondary/60 font-mono">
          16 GB RAM minimum · Java 21
        </p>
      </div>

      {/* System Requirements */}
      <div className="surface rounded-xl p-6 md:col-span-2">
        <h3 className="text-base font-semibold text-white mb-4">System Requirements</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-secondary font-mono text-xs">Java:</span>
            <span className="text-text-primary text-xs ml-2">21 (temurin)</span>
          </div>
          <div>
            <span className="text-text-secondary font-mono text-xs">Minecraft:</span>
            <span className="text-text-primary text-xs ml-2">1.21.1</span>
          </div>
          <div>
            <span className="text-text-secondary font-mono text-xs">Loader:</span>
            <span className="text-text-primary text-xs ml-2">NeoForge 21.1.220</span>
          </div>
          <div>
            <span className="text-text-secondary font-mono text-xs">RAM (client):</span>
            <span className="text-text-primary text-xs ml-2">8 GB min, 12 GB rec</span>
          </div>
          <div>
            <span className="text-text-secondary font-mono text-xs">RAM (server):</span>
            <span className="text-text-primary text-xs ml-2">12 GB min, 16 GB rec</span>
          </div>
          <div>
            <span className="text-text-secondary font-mono text-xs">Mods:</span>
            <span className="text-text-primary text-xs ml-2">250+ managed by launcher</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Link Account Card ────────────────────────────────────────────────────────

function LinkAccountCard() {
  return (
    <div className="surface rounded-xl p-8 border border-[#262626] text-center">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Link Your Minecraft Account</h3>
      <p className="text-sm text-text-secondary mb-6">
        Bug reporting requires a linked Minecraft account. It takes 10 seconds:
      </p>
      <ol className="text-left text-sm text-text-secondary space-y-3 max-w-xs mx-auto">
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5">1</span>
          <span>Join the TZP Minecraft server</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5">2</span>
          <span>Type <code className="px-1.5 py-0.5 rounded bg-[#262626] font-mono text-xs text-accent">/link</code> in chat</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5">3</span>
          <span>Click the link you receive</span>
        </li>
      </ol>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
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

  async function handleCrashSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!crashTitle.trim() || !crashDescription.trim() || !crashLog.trim()) {
      setCrashStatus("error");
      setCrashMessage("All fields required.");
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
        setCrashMessage(data.error || "Failed.");
        return;
      }
      setCrashStatus("success");
      setCrashMessage(data.reportId ? `Stored as ${data.reportId}.` : "Stored.");
      setCrashTitle("");
      setCrashDescription("");
      setCrashLog("");
    } catch {
      setCrashStatus("error");
      setCrashMessage("Network error.");
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header with navigation tabs */}
      <nav className="sticky top-0 z-50 surface-elevated border-b border-[#262626]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center h-14">
            {/* Logo */}
            <a href="/" className="text-xl font-extrabold tracking-tight text-white mr-8 shrink-0">
              TZP
            </a>

            {/* Tab navigation — scrollable on mobile */}
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === item.id
                        ? "bg-white/[0.08] text-white"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status dot */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-text-secondary hidden sm:inline">Online</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Overview ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in-up">
            <div>
              <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
              <p className="text-text-secondary text-sm">Server status, events, and quick actions.</p>
            </div>

            {/* Server cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {SERVERS.map((s) => (
                <ServerCard key={s.name} server={s} />
              ))}
            </div>

            {/* MadGod preview */}
            <div className="surface rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">MadGod Activity</h3>
                <span className="text-xs text-text-secondary/50 font-mono">Live feed</span>
              </div>
              <MadGodLog />
            </div>

            {/* Players */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4">Players</h3>
              <PlayersSection />
            </div>
          </div>
        )}

        {/* ── Servers ────────────────────────────────────────────────── */}
        {activeTab === "servers" && (
          <div className="space-y-8 animate-fade-in-up">
            <div>
              <h1 className="text-2xl font-bold mb-2">Servers</h1>
              <p className="text-text-secondary text-sm">
                Two servers available — stable for regular play, beta for testing v2.0 features.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {SERVERS.map((s) => (
                <ServerCard key={s.name} server={s} />
              ))}
            </div>

            {/* Players */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4">Online Players</h3>
              <PlayersSection />
            </div>
          </div>
        )}

        {/* ── Patch Notes ────────────────────────────────────────────── */}
        {activeTab === "patches" && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Patch Notes</h1>
              <p className="text-text-secondary text-sm">
                Update history across all components — launcher, client, server, and live.
              </p>
            </div>
            <PatchNotesTabbed />
          </div>
        )}

        {/* ── Downloads ──────────────────────────────────────────────── */}
        {activeTab === "downloads" && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Downloads</h1>
              <p className="text-text-secondary text-sm">
                Get the launcher or host your own server.
              </p>
            </div>
            <DownloadsSection />
          </div>
        )}

        {/* ── Bug Report ─────────────────────────────────────────────── */}
        {activeTab === "bugs" && (
          <div className="max-w-2xl animate-fade-in-up">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Report a Bug</h1>
              <p className="text-text-secondary text-sm">
                Found something broken? Submit a report below.
              </p>
            </div>

            {sessionLoading ? (
              <div className="surface rounded-xl p-8 text-center text-text-secondary">
                <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Checking account...</p>
              </div>
            ) : !session ? (
              <LinkAccountCard />
            ) : (
              <div className="space-y-6">
                <div className="surface rounded-xl p-6">
                  <BugReportForm />
                </div>

                <form onSubmit={handleCrashSubmit} className="surface rounded-xl p-6 space-y-4">
                  <h3 className="text-base font-semibold text-white">Crash Report</h3>
                  <p className="text-sm text-text-secondary">Paste the crash log and a short description.</p>
                  <input
                    value={crashTitle}
                    onChange={(e) => setCrashTitle(e.target.value)}
                    placeholder="Crash title"
                    className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent text-sm"
                  />
                  <textarea
                    value={crashDescription}
                    onChange={(e) => setCrashDescription(e.target.value)}
                    placeholder="What happened?"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent text-sm"
                  />
                  <textarea
                    value={crashLog}
                    onChange={(e) => setCrashLog(e.target.value)}
                    placeholder="Paste crash log"
                    rows={5}
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
                    <div className={`text-sm ${crashStatus === "error" ? "text-red-400" : "text-green-400"}`}>
                      {crashMessage}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
