"use client";

import { useState } from "react";
import ServerStatus from "@/components/ServerStatus";
import PatchNotes from "@/components/PatchNotes";
import BugReportForm from "@/components/BugReportForm";
import Particles from "@/components/Particles";

type Tab = "overview" | "bugs" | "patches";

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
      className="flex items-center gap-3 w-full px-4 py-3 glass rounded-lg hover:border-accent/40 transition-all duration-200 text-left group"
    >
      <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-accent group-hover:glow-purple transition-shadow">
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

  return (
    <main className="min-h-screen relative">
      <Particles />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-extrabold tracking-tight gradient-text-animated"
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
              <a
                href="https://github.com/TheZackPack/TZP-launcher/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 glass rounded-lg hover:border-accent/40 transition-all duration-200 text-left group"
              >
                <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-accent group-hover:glow-purple transition-shadow">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Download</div>
                  <div className="text-xs text-text-secondary">Launcher</div>
                </div>
              </a>
            </div>
          </aside>

          {/* Mobile tab bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-primary/20 flex justify-around py-2 px-4">
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
                <div className="glass rounded-xl p-6 glow-border-animated">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="font-mono text-accent text-sm">01</span>
                    Server Status
                  </h2>
                  <ServerStatus />
                </div>

                {/* Quick Actions (mobile) */}
                <div className="lg:hidden glass rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="font-mono text-accent text-sm">02</span>
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <CopyIPButton />
                    <a
                      href="https://github.com/TheZackPack/TZP-launcher/releases/latest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3 glass rounded-lg hover:border-accent/40 transition-all duration-200 text-left group"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-accent">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">Download Launcher</div>
                        <div className="text-xs text-text-secondary">Latest release</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Recent patches preview */}
                <div className="glass rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="font-mono text-accent text-sm">03</span>
                    Recent Updates
                  </h2>
                  <PatchNotes limit={2} />
                </div>
              </div>
            )}

            {/* Bug Report tab */}
            {activeTab === "bugs" && (
              <div className="max-w-2xl animate-fade-in-up">
                <div className="glass rounded-xl p-8">
                  <p className="text-text-secondary text-sm mb-6">
                    Found something broken? Let us know. Supports Markdown in the description field.
                  </p>
                  <BugReportForm />
                </div>
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
