"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [username, setUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No link token provided. Run /link in-game to get a link.");
      return;
    }

    fetch("/api/link/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setUsername(data.username);
          setTimeout(() => router.push("/dashboard"), 2000);
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Link verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      });
  }, [token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <a
          href="/"
          className="text-3xl font-extrabold tracking-tight text-white mb-8 block"
        >
          TZP
        </a>

        {status === "loading" && (
          <div className="surface rounded-xl p-8 border border-[#262626]">
            <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">
              Linking your account...
            </h2>
            <p className="text-sm text-text-secondary">
              Verifying your Minecraft identity.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="surface rounded-xl p-8 border border-green-500/20">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Welcome, {username}!
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Your Minecraft account is now linked. Redirecting to dashboard...
            </p>
            <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full animate-[grow_2s_ease-in-out]"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="surface rounded-xl p-8 border border-red-500/20">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Link Failed
            </h2>
            <p className="text-sm text-red-400 mb-4">{errorMsg}</p>
            <div className="text-sm text-text-secondary space-y-2">
              <p>To link your account:</p>
              <ol className="text-left list-decimal list-inside space-y-1">
                <li>Join the TZP Minecraft server</li>
                <li>
                  Type{" "}
                  <code className="px-1.5 py-0.5 rounded bg-[#262626] font-mono text-xs text-accent">
                    /link
                  </code>{" "}
                  in chat
                </li>
                <li>Click the new link you receive</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LinkPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </main>
      }
    >
      <LinkContent />
    </Suspense>
  );
}
