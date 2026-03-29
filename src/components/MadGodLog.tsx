"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface MadGodEvent {
  id: number;
  player: string;
  eventType: string;
  eventName: string | null;
  description: string | null;
  outcome: string | null;
  timestamp: string;
}

interface EventsResponse {
  events: MadGodEvent[];
  total: number;
  limit: number;
  offset: number;
}

// ── Color / icon config ───────────────────────────────────────────────────────

const EVENT_STYLES: Record<
  string,
  { icon: React.ReactNode; dot: string; label: string; textColor: string }
> = {
  combat: {
    dot: "bg-red-500",
    label: "Combat",
    textColor: "text-red-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
  },
  treasure: {
    dot: "bg-yellow-500",
    label: "Treasure",
    textColor: "text-yellow-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  story: {
    dot: "bg-purple-500",
    label: "Story",
    textColor: "text-purple-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  buff: {
    dot: "bg-green-500",
    label: "Buff",
    textColor: "text-green-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  sacrifice: {
    dot: "bg-pink-500",
    label: "Sacrifice",
    textColor: "text-pink-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  quest: {
    dot: "bg-blue-500",
    label: "Quest",
    textColor: "text-blue-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
};

const FALLBACK_STYLE = {
  dot: "bg-text-secondary",
  label: "Event",
  textColor: "text-text-secondary",
  icon: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function getEventStyle(eventType: string) {
  return EVENT_STYLES[eventType.toLowerCase()] ?? FALLBACK_STYLE;
}

// ── Time formatting ───────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  if (isNaN(diffMs)) return timestamp;

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ event, isNew }: { event: MadGodEvent; isNew: boolean }) {
  const style = getEventStyle(event.eventType);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 group transition-colors duration-150 hover:bg-white/[0.02] ${
        isNew ? "animate-fade-in-up" : ""
      }`}
    >
      {/* Type dot */}
      <div className="mt-0.5 shrink-0 flex items-center justify-center">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${style.dot}/20 ${style.textColor}`}>
          {style.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {/* Player */}
          <span className="text-sm font-semibold text-text-primary">
            {event.player}
          </span>
          {/* Event name */}
          {event.eventName && (
            <span className={`text-xs font-mono ${style.textColor}`}>
              {event.eventName}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Outcome */}
        {event.outcome && (
          <p className="text-xs text-text-secondary/60 mt-0.5 italic">
            → {event.outcome}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-right">
        <span className="text-[10px] font-mono text-text-secondary/50">
          {formatRelativeTime(event.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function MadGodLog() {
  const [events, setEvents] = useState<MadGodEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const prevTopId = useRef<number | null>(null);

  const fetchEvents = useCallback(
    async (currentOffset: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(
          `/api/madgod/events?limit=${PAGE_SIZE}&offset=${currentOffset}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data: EventsResponse = await res.json();

        if (isRefresh && currentOffset === 0) {
          // Find new events vs previous fetch
          const prevTop = prevTopId.current;
          if (prevTop !== null) {
            const fresh = new Set(
              data.events
                .filter((e) => e.id > prevTop)
                .map((e) => e.id)
            );
            if (fresh.size > 0) setNewIds(fresh);
          }
          if (data.events.length > 0) {
            prevTopId.current = data.events[0].id;
          }
          setEvents(data.events);
        } else {
          setEvents(data.events);
          if (data.events.length > 0 && currentOffset === 0) {
            prevTopId.current = data.events[0].id;
          }
        }

        setTotal(data.total);
        setLastRefreshed(new Date());
      } catch {
        // silently fail on refresh
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchEvents(0, false);
  }, [fetchEvents]);

  // Auto-refresh every 30s (only page 1)
  useEffect(() => {
    const interval = setInterval(() => {
      if (offset === 0) fetchEvents(0, true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchEvents, offset]);

  // Clear new-event highlights after 5s
  useEffect(() => {
    if (newIds.size === 0) return;
    const t = setTimeout(() => setNewIds(new Set()), 5000);
    return () => clearTimeout(t);
  }, [newIds]);

  function handlePageChange(dir: "prev" | "next") {
    const next = dir === "next" ? offset + PAGE_SIZE : Math.max(0, offset - PAGE_SIZE);
    setOffset(next);
    fetchEvents(next, false);
  }

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="flex flex-col rounded-xl border border-[#262626] bg-[#0d0d0d] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] bg-[#141414]">
        <div className="flex items-center gap-2">
          {/* Pulsing live dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          <span className="text-xs font-mono text-purple-400 font-semibold tracking-wider uppercase">
            MadGod Log
          </span>
          {total > 0 && (
            <span className="text-[10px] font-mono text-text-secondary/60">
              {total.toLocaleString()} events
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[10px] font-mono text-text-secondary/40">
              {refreshing ? "Refreshing..." : `Updated ${formatRelativeTime(lastRefreshed.toISOString())}`}
            </span>
          )}
          <button
            onClick={() => { setOffset(0); fetchEvents(0, true); }}
            disabled={refreshing}
            title="Refresh"
            className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04] bg-[#0f0f0f] overflow-x-auto">
        {Object.entries(EVENT_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            <span className="text-[10px] font-mono text-text-secondary/50 capitalize">
              {key}
            </span>
          </div>
        ))}
      </div>

      {/* Event list */}
      <div className="flex-1 font-mono overflow-y-auto" style={{ minHeight: "200px", maxHeight: "520px" }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-6 h-6 rounded-md bg-[#262626]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#262626] rounded w-1/3" />
                  <div className="h-2.5 bg-[#1a1a1a] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <svg className="w-8 h-8 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-xs">No events yet. MadGod is watching...</p>
          </div>
        ) : (
          <div>
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                isNew={newIds.has(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626] bg-[#141414]">
          <button
            onClick={() => handlePageChange("prev")}
            disabled={!hasPrev}
            className="flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>

          <span className="text-[10px] font-mono text-text-secondary/50">
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange("next")}
            disabled={!hasNext}
            className="flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
