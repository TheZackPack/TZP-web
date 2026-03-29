"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type ChangeEntry = { category: string; text: string } | string;

interface PatchNote {
  version: string;
  date: string;
  title?: string;
  type?: "hotfix" | "feature" | "major" | "patch";
  changes: ChangeEntry[];
  component?: string;
}

type ComponentKey = "launcher" | "client" | "server" | "live" | "all";

const TABS: { id: ComponentKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "launcher", label: "Launcher" },
  { id: "client", label: "Client" },
  { id: "server", label: "Server ZIP" },
  { id: "live", label: "Live Server" },
];

const TYPE_BADGE: Record<string, { label: string; classes: string }> = {
  hotfix: {
    label: "Hotfix",
    classes: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  },
  major: {
    label: "Major",
    classes: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  },
  feature: {
    label: "Feature",
    classes: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  },
  patch: {
    label: "Patch",
    classes: "bg-[#262626] text-text-secondary border border-[#333]",
  },
};

const CATEGORY_TAG: Record<string, string> = {
  balance: "bg-amber-500/10 text-amber-400/80",
  performance: "bg-cyan-500/10 text-cyan-400/80",
  content: "bg-purple-500/10 text-purple-400/80",
  fix: "bg-red-500/10 text-red-400/80",
  mods: "bg-blue-500/10 text-blue-400/80",
  magic: "bg-indigo-500/10 text-indigo-400/80",
  tech: "bg-teal-500/10 text-teal-400/80",
  economy: "bg-yellow-500/10 text-yellow-400/80",
  quests: "bg-green-500/10 text-green-400/80",
  ai: "bg-pink-500/10 text-pink-400/80",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getChangeCategory(change: ChangeEntry): string | null {
  if (typeof change === "object" && change.category) {
    return change.category.toLowerCase();
  }
  return null;
}

function getChangeText(change: ChangeEntry): string {
  return typeof change === "string" ? change : change.text;
}

function matchesSearch(note: PatchNote, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (note.version.toLowerCase().includes(lower)) return true;
  if (note.title?.toLowerCase().includes(lower)) return true;
  if (note.date.includes(lower)) return true;
  return note.changes.some((c) =>
    getChangeText(c).toLowerCase().includes(lower)
  );
}

function filterChanges(changes: ChangeEntry[], q: string): ChangeEntry[] {
  if (!q) return changes;
  const lower = q.toLowerCase();
  return changes.filter((c) => getChangeText(c).toLowerCase().includes(lower));
}

// ── Sub-components ───────────────────────────────────────────────────────────

function VersionBadge({ type }: { type?: string }) {
  const info = TYPE_BADGE[type ?? "patch"] ?? TYPE_BADGE.patch;
  return (
    <span
      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded ${info.classes}`}
    >
      {info.label}
    </span>
  );
}

function ComponentLabel({ component }: { component?: string }) {
  if (!component) return null;
  const map: Record<string, string> = {
    launcher: "Launcher",
    client: "Client",
    server: "Server ZIP",
    live: "Live",
  };
  return (
    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/[0.05] text-text-secondary border border-white/[0.06]">
      {map[component] ?? component}
    </span>
  );
}

function AccordionItem({
  note,
  isFirst,
  searchQuery,
}: {
  note: PatchNote;
  isFirst: boolean;
  searchQuery: string;
}) {
  const [open, setOpen] = useState(isFirst);

  const visibleChanges = searchQuery
    ? filterChanges(note.changes, searchQuery)
    : note.changes;

  const isHotfix = note.type === "hotfix";

  return (
    <div
      className={`rounded-xl border transition-colors duration-150 ${
        isHotfix
          ? "border-amber-500/20 bg-amber-500/[0.03]"
          : isFirst
            ? "border-blue-500/20 bg-blue-500/[0.03]"
            : "border-[#262626] bg-[#141414]"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        {/* Version */}
        <span
          className={`text-sm font-bold font-mono ${
            isHotfix
              ? "text-amber-400"
              : isFirst
                ? "text-blue-400"
                : "text-text-secondary"
          }`}
        >
          v{note.version}
        </span>

        {/* Title */}
        {note.title && (
          <span className="text-sm font-medium text-text-primary truncate">
            {note.title}
          </span>
        )}

        {/* Date */}
        <span className="text-xs font-mono text-text-secondary ml-auto shrink-0">
          {note.date}
        </span>

        {/* Type badge */}
        <VersionBadge type={note.type} />

        {/* Component label (shown in "All" tab context) */}
        {note.component && <ComponentLabel component={note.component} />}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-text-secondary shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
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
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 border-t border-white/[0.04]">
          {visibleChanges.length === 0 ? (
            <p className="text-text-secondary text-sm pt-4">
              No changes match your search.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {visibleChanges.map((change, i) => {
                const cat = getChangeCategory(change);
                const text = getChangeText(change);
                const tagClass = cat ? (CATEGORY_TAG[cat] ?? "bg-white/[0.05] text-text-secondary") : null;

                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm leading-relaxed"
                    style={{
                      animation: `slide-in-left 0.25s ease-out ${i * 0.04}s both`,
                    }}
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
                    {cat && tagClass && (
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wide ${tagClass}`}
                      >
                        {cat}
                      </span>
                    )}
                    <span className="text-text-primary">{text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PatchNotesTabbed() {
  const [activeTab, setActiveTab] = useState<ComponentKey>("all");
  const [notesByComponent, setNotesByComponent] = useState<
    Record<ComponentKey, PatchNote[]>
  >({
    all: [],
    launcher: [],
    client: [],
    server: [],
    live: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const components: Exclude<ComponentKey, "all">[] = [
        "launcher",
        "client",
        "server",
        "live",
      ];

      const results = await Promise.all(
        components.map((c) =>
          fetch(`/api/patchnotes?component=${c}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((notes: PatchNote[]) =>
              notes.map((n) => ({ ...n, component: c }))
            )
            .catch(() => [] as PatchNote[])
        )
      );

      const [launcher, client, server, live] = results;

      const all = [...launcher, ...client, ...server, ...live].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setNotesByComponent({ all, launcher, client, server, live });
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const visibleNotes = notesByComponent[activeTab].filter((n) =>
    matchesSearch(n, searchQuery)
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patch notes..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#141414] border border-[#262626] text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent/60 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#141414] border border-[#262626] overflow-x-auto">
        {TABS.map((tab) => {
          const count = notesByComponent[tab.id].length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/[0.08] text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
              {!loading && count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-accent/20 text-accent"
                      : "bg-white/[0.06] text-text-secondary"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-[#141414] border border-[#262626] animate-pulse"
            />
          ))}
        </div>
      ) : visibleNotes.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {searchQuery
            ? `No results for "${searchQuery}"`
            : "No patch notes available."}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotes.map((note, i) => (
            <AccordionItem
              key={`${note.component ?? "all"}-${note.version}-${i}`}
              note={note}
              isFirst={i === 0 && !searchQuery}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
