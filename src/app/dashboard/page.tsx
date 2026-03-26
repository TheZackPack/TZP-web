"use client";

import { useEffect, useState } from "react";
import ServerStatus from "@/components/ServerStatus";
import PatchNotes from "@/components/PatchNotes";
import BugReportForm from "@/components/BugReportForm";
import DownloadButton from "@/components/DownloadButton";

type Tab = "overview" | "bugs" | "patches";
type ClaimSession = {
  sub: string;
  role: string;
  exp: number;
};

type AccountSession = {
  accountId: string;
  playerId: string;
  minecraftUuid: string;
  username: string;
  displayName: string;
};

type Session = ClaimSession | AccountSession;

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
    id: "bugs",
    label: "Bug Report",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
];

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

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setSession(data.session || null);
        }
      } catch {
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setSessionLoading(false);
        }
      }
    }

    loadSession();
    return () => {
      mounted = false;
    };
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

  function renderAccessCard() {
    const isClaimSession =
      session && "role" in session && typeof session.role === "string";
    const expiresAt =
      session && "exp" in session ? new Date(session.exp * 1000).toLocaleString() : "Managed";
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
                {isClaimSession ? session.role : "account"}
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
              placeholder="Enter claim code"
              className="flex-1 px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleClaimCode}
              disabled={claimStatus === "loading"}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60"
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

  return (
    <main className="min-h-screen relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 surface-elevated">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-extrabold tracking-tight text-white"
          >
            TZP
          </a>
          <span className="text-sm text-text-secondary font-mono">// dashboard</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10">
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
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 surface-elevated border-t border-[#262626] flex justify-around py-2 px-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-8 animate-fade-in-up">
              {activeTab === "overview" && "Overview"}
              {activeTab === "bugs" && "Report a Bug"}
              {activeTab === "patches" && "Patch Notes"}
            </h1>

            {/* Overview tab */}
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

                {renderAccessCard()}

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

                {/* Recent patches preview */}
                <div className="surface rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="font-mono text-accent text-sm">04</span>
                    Recent Updates
                  </h2>
                  <PatchNotes limit={2} />
                </div>
              </div>
            )}

            {/* Bug Report tab */}
            {activeTab === "bugs" && (
              <div className="max-w-2xl animate-fade-in-up">
                {!session ? (
                  <div className="space-y-6">
                    {renderAccessCard()}
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
                          Paste the crash log and a short description. This stores an internal crash report tied to your TZP account.
                        </p>
                      </div>
                      <input
                        value={crashTitle}
                        onChange={(e) => setCrashTitle(e.target.value)}
                        placeholder="Crash title"
                        className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent"
                      />
                      <textarea
                        value={crashDescription}
                        onChange={(e) => setCrashDescription(e.target.value)}
                        placeholder="What happened right before the crash?"
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-text-primary focus:outline-none focus:border-accent"
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
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60"
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

            {/* Patch Notes tab */}
            {activeTab === "patches" && (
              <div className="animate-fade-in-up">
                <PatchNotes />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
