"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface PatchNote {
  version: string;
  date: string;
  changes: string[];
}

interface PatchNotesProps {
  limit?: number;
}

export default function PatchNotes({ limit }: PatchNotesProps) {
  const [notes, setNotes] = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(`${API_BASE}/api/patchnotes`);
        if (res.ok) {
          const data: PatchNote[] = await res.json();
          setNotes(limit ? data.slice(0, limit) : data);
        }
      } catch {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, [limit]);

  function toggleExpand(version: string) {
    setExpanded((prev) => ({ ...prev, [version]: !prev[version] }));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-primary/20 rounded w-32 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-primary/10 rounded w-full" />
              <div className="h-4 bg-primary/10 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return <p className="text-text-secondary">No patch notes available.</p>;
  }

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="timeline-line" />

      <div className="space-y-8">
        {notes.map((note, index) => {
          const isFirst = index === 0;
          const isExpanded = expanded[note.version] ?? isFirst;
          const showToggle = !isFirst && note.changes.length > 3;

          return (
            <div key={note.version} className="relative">
              {/* Timeline dot */}
              <div
                className="absolute -left-6 top-1"
                style={{ left: "-1px" }}
              >
                <div
                  className={`timeline-dot ${
                    isFirst ? "!bg-accent glow-purple" : ""
                  }`}
                />
              </div>

              {/* Card */}
              <div className="ml-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-3 py-1 text-sm font-bold font-mono rounded-full ${
                      isFirst
                        ? "bg-accent/20 text-accent glow-purple"
                        : "bg-primary/15 text-accent/80"
                    }`}
                  >
                    v{note.version}
                  </span>
                  <span className="text-sm text-text-secondary font-mono">
                    {note.date}
                  </span>
                  {isFirst && (
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded bg-accent/10 text-accent border border-accent/20">
                      Latest
                    </span>
                  )}
                </div>

                <ul className="space-y-2">
                  {(isExpanded ? note.changes : note.changes.slice(0, 3)).map(
                    (change, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm leading-relaxed"
                        style={{
                          animation: `slide-in-left 0.3s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        <span className="text-text-primary">{change}</span>
                      </li>
                    )
                  )}
                </ul>

                {showToggle && (
                  <button
                    onClick={() => toggleExpand(note.version)}
                    className="mt-3 text-xs text-accent/70 hover:text-accent transition-colors font-mono flex items-center gap-1"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    {isExpanded
                      ? "Show less"
                      : `+${note.changes.length - 3} more changes`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
