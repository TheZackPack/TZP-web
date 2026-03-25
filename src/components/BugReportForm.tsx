"use client";

import { useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

const DESC_MAX = 5000;

export default function BugReportForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setStatus("error");
      setMessage("Title and description are required.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(`/api/bugs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(`Bug report #${data.issueNumber} created successfully.`);
        setTitle("");
        setDescription("");
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
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        {/* Animated checkmark */}
        <div className="w-16 h-16 rounded-full bg-green-400/10 border-2 border-green-400/40 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
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
        <p className="text-green-400 font-medium text-center">{message}</p>
        <button
          onClick={() => setStatus("idle")}
          className="text-sm text-accent hover:text-accent/80 font-mono transition-colors"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title field */}
      <div className="floating-input-group">
        <input
          id="bug-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          maxLength={200}
        />
        <label htmlFor="bug-title">Title</label>
      </div>

      {/* Description field */}
      <div>
        <div className="floating-input-group">
          <textarea
            id="bug-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={5}
            maxLength={DESC_MAX}
            style={{ resize: "none" }}
          />
          <label htmlFor="bug-desc">Description</label>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[11px] text-text-secondary/50 font-mono">
            Supports Markdown
          </span>
          <span
            className={`text-[11px] font-mono ${
              description.length > DESC_MAX * 0.9
                ? "text-red-400"
                : "text-text-secondary/50"
            }`}
          >
            {description.length} / {DESC_MAX}
          </span>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full px-4 py-3 bg-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 glow-purple"
      >
        {status === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Bug Report"
        )}
      </button>

      {/* Error message */}
      {status === "error" && message && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
          <svg
            className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-sm text-red-400">{message}</p>
        </div>
      )}
    </form>
  );
}
