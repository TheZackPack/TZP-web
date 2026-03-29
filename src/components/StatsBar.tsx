"use client";

import { useEffect, useState } from "react";

interface ModpackInfo {
  version: string;
  mcVersion: string;
  modCount: number;
  questCount: number;
  emcCount: number;
}

interface Stat {
  label: string;
  value: string;
  sub?: string;
}

export default function StatsBar() {
  const [info, setInfo] = useState<ModpackInfo | null>(null);

  useEffect(() => {
    fetch("/api/modpack/info")
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo)
      .catch(() => null);
  }, []);

  const stats: Stat[] = [
    {
      label: "Mods",
      value: info ? `${info.modCount}+` : "250+",
      sub: "NeoForge 1.21.1",
    },
    {
      label: "Quests",
      value: info ? `${info.questCount.toLocaleString()}+` : "600+",
      sub: "Story-driven",
    },
    {
      label: "EMC Entries",
      value: info ? `${(info.emcCount / 1000).toFixed(0)}k+` : "20k+",
      sub: "Transmutation",
    },
    {
      label: "MC Version",
      value: info ? info.mcVersion : "1.21.1",
      sub: "Java 21",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div
            className="text-3xl md:text-4xl font-black font-mono gradient-text"
            style={{ animation: "count-up 0.6s ease-out both" }}
          >
            {stat.value}
          </div>
          <div className="mt-1 text-sm font-semibold text-text-primary">
            {stat.label}
          </div>
          {stat.sub && (
            <div className="text-xs text-text-secondary font-mono">
              {stat.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
