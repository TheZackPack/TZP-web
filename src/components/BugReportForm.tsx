"use client";

import { useEffect, useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";
type SessionPayload = {
  authenticated: boolean;
  configured?: boolean;
};
type ModCatalogEntry = {
  modId: string;
  displayName: string;
};
type ItemCatalogEntry = {
  itemId: string;
  displayName: string;
};

const DESC_MAX = 5000;

export default function BugReportForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [launcherVersion, setLauncherVersion] = useState("");
  const [packVersion, setPackVersion] = useState("");
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedItemOther, setSelectedItemOther] = useState("");
  const [otherContext, setOtherContext] = useState("");
  const [mods, setMods] = useState<ModCatalogEntry[]>([]);
  const [items, setItems] = useState<ItemCatalogEntry[]>([]);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadContext() {
      try {
        const sessionResponse = await fetch("/api/session", {
          credentials: "include",
        });
        const sessionPayload = (await sessionResponse.json()) as SessionPayload;
        if (active) {
          setSession(sessionPayload);
        }

        const modsResponse = await fetch("/api/mods");
        const modsPayload = await modsResponse.json();
        if (active) {
          setMods(Array.isArray(modsPayload.mods) ? modsPayload.mods : []);
          if (modsPayload.packVersion) {
            setPackVersion((current) => current || modsPayload.packVersion);
            const itemsResponse = await fetch(
              `/api/items?packVersion=${encodeURIComponent(modsPayload.packVersion)}`,
            );
            const itemsPayload = await itemsResponse.json();
            if (active) {
              setItems(Array.isArray(itemsPayload.items) ? itemsPayload.items : []);
            }
          }
        }
      } catch {
        if (active) {
          setSession({ authenticated: false, configured: false });
          setMods([]);
          setItems([]);
        }
      }
    }

    loadContext();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!session?.authenticated) {
      setStatus("error");
      setMessage("Redeem a claim code from the dashboard before filing bug reports.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setStatus("error");
      setMessage("Title and description are required.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          launcherVersion: launcherVersion.trim(),
          packVersion: packVersion.trim(),
          selectedMods,
          selectedItemId: selectedItemId === "__other__" ? null : selectedItemId || null,
          selectedItemOther: selectedItemId === "__other__" ? selectedItemOther.trim() : null,
          otherContext: otherContext.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(
          data.mirrored?.issueNumber
            ? `Bug report saved and mirrored to GitHub issue #${data.mirrored.issueNumber}.`
            : "Bug report saved successfully.",
        );
        setTitle("");
        setDescription("");
        setSelectedMods([]);
        setSelectedItemId("");
        setSelectedItemOther("");
        setOtherContext("");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to submit bug report.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-400/40 bg-green-400/10">
          <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: 24,
                animation: "checkmark-draw 0.4s ease-out 0.2s forwards",
              }}
            />
          </svg>
        </div>
        <p className="text-center font-medium text-green-400">{message}</p>
        <button
          onClick={() => setStatus("idle")}
          className="font-mono text-sm text-accent transition-colors hover:text-accent/80"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="floating-input-group">
          <input
            id="bug-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            maxLength={200}
          />
          <label htmlFor="bug-title">Title</label>
        </div>

        <div className="floating-input-group">
          <input
            value={launcherVersion}
            onChange={(event) => setLauncherVersion(event.target.value)}
            placeholder="Launcher version"
          />
          <label>Launcher Version</label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="floating-input-group">
          <input
            value={packVersion}
            onChange={(event) => setPackVersion(event.target.value)}
            placeholder="Pack version"
          />
          <label>Pack Version</label>
        </div>

        <div className="rounded-lg border border-[#262626] bg-[#141414] px-4 py-3">
          <label className="mb-2 block text-[11px] font-mono uppercase tracking-wider text-text-secondary/60">
            Affected Item / Block
          </label>
          <select
            value={selectedItemId}
            onChange={(event) => setSelectedItemId(event.target.value)}
            className="w-full bg-transparent text-sm text-text-primary outline-none"
          >
            <option value="">Select an item or block</option>
            {items.map((item) => (
              <option key={item.itemId} value={item.itemId}>
                {item.displayName}
              </option>
            ))}
            <option value="__other__">Other</option>
          </select>
        </div>
      </div>

      {selectedItemId === "__other__" ? (
        <div className="floating-input-group">
          <input
            value={selectedItemOther}
            onChange={(event) => setSelectedItemOther(event.target.value)}
            placeholder="Other item or block"
          />
          <label>Other Item / Block</label>
        </div>
      ) : null}

      <div className="rounded-lg border border-[#262626] bg-[#141414] px-4 py-3">
        <label className="mb-3 block text-[11px] font-mono uppercase tracking-wider text-text-secondary/60">
          Related Mods
        </label>
        <div className="grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {mods.map((mod) => {
            const checked = selectedMods.includes(mod.modId);
            return (
              <label key={mod.modId} className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    setSelectedMods((current) =>
                      event.target.checked
                        ? [...current, mod.modId]
                        : current.filter((entry) => entry !== mod.modId),
                    )
                  }
                />
                <span>{mod.displayName}</span>
              </label>
            );
          })}
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={selectedMods.includes("__other__")}
              onChange={(event) =>
                setSelectedMods((current) =>
                  event.target.checked
                    ? [...current, "__other__"]
                    : current.filter((entry) => entry !== "__other__"),
                )
              }
            />
            <span>Other / missing mod</span>
          </label>
        </div>
      </div>

      <div>
        <div className="floating-input-group">
          <textarea
            id="bug-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            rows={5}
            maxLength={DESC_MAX}
            style={{ resize: "none" }}
          />
          <label htmlFor="bug-desc">Description</label>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1">
          <span className="text-[11px] font-mono text-text-secondary/50">Supports Markdown</span>
          <span
            className={`text-[11px] font-mono ${
              description.length > DESC_MAX * 0.9 ? "text-red-400" : "text-text-secondary/50"
            }`}
          >
            {description.length} / {DESC_MAX}
          </span>
        </div>
      </div>

      <div className="floating-input-group">
        <textarea
          value={otherContext}
          onChange={(event) => setOtherContext(event.target.value)}
          placeholder="Extra context"
          rows={3}
          style={{ resize: "none" }}
        />
        <label>Extra Context</label>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Submit Bug Report"}
      </button>

      {status === "error" && message ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-sm text-red-400">{message}</p>
        </div>
      ) : null}
    </form>
  );
}
