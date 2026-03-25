"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface StatusData {
  online: boolean;
  players: { online: number; max: number; list?: string[] };
  version: string;
  tps?: number;
}

interface ServerStatusProps {
  compact?: boolean;
}

export default function ServerStatus({ compact = false }: ServerStatusProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${API_BASE}/api/status`);
        if (res.ok) {
          setStatus(await res.json());
        }
      } catch {
        setStatus(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-text-secondary animate-pulse" />
        {!compact && <span className="text-sm text-text-secondary">Checking...</span>}
      </div>
    );
  }

  const online = status?.online ?? false;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            online
              ? "bg-green-400 pulse-dot shadow-[0_0_8px_rgba(74,222,128,0.6)]"
              : "bg-red-400"
          }`}
        />
        <span className="text-xs text-text-secondary font-mono">
          {online ? "Online" : "Offline"}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-4 h-4 rounded-full ${
              online
                ? "bg-green-400 pulse-dot"
                : "bg-red-400"
            }`}
          />
          {online && (
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400/30 animate-ping" />
          )}
        </div>
        <span className="text-lg font-semibold">
          {online ? "Server Online" : "Server Offline"}
        </span>
        {online && (
          <span className="ml-auto px-2.5 py-0.5 text-xs font-mono rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
            {status?.tps ? `${status.tps} TPS` : "Healthy"}
          </span>
        )}
      </div>

      {status && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-light/50 rounded-lg p-4 border border-primary/10">
              <div className="text-text-secondary text-xs uppercase tracking-wide mb-1.5 font-mono">
                Players
              </div>
              <div className="text-xl font-bold font-mono">
                <span className="text-accent">{status.players.online}</span>
                <span className="text-text-secondary/60"> / {status.players.max}</span>
              </div>
            </div>
            <div className="bg-surface-light/50 rounded-lg p-4 border border-primary/10">
              <div className="text-text-secondary text-xs uppercase tracking-wide mb-1.5 font-mono">
                Version
              </div>
              <div className="text-xl font-bold font-mono text-text-primary">
                {status.version}
              </div>
            </div>
          </div>

          {/* Player avatars */}
          {status.players.list && status.players.list.length > 0 && (
            <div>
              <div className="text-text-secondary text-xs uppercase tracking-wide mb-2.5 font-mono">
                Online Now
              </div>
              <div className="flex flex-wrap gap-3">
                {status.players.list.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 bg-surface-light/50 rounded-lg px-3 py-2 border border-primary/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://mc-heads.net/avatar/${name}/24`}
                      alt={name}
                      width={24}
                      height={24}
                      className="rounded-sm"
                    />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* IP */}
      <div className="flex items-center gap-2 text-xs text-text-secondary font-mono pt-1 border-t border-primary/10">
        <span className="text-accent/60">$</span>
        <span>connect 15.204.117.31 // NeoForge 1.21.1</span>
      </div>
    </div>
  );
}
