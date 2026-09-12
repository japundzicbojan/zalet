"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOALS = [
  { value: "launch", label: "Launch week" },
  { value: "waitlist", label: "Waitlist" },
  { value: "first_100", label: "First 100 users" },
] as const;

export function RunForm() {
  const router = useRouter();
  const [url, setUrl] = useState("https://www.notion.so");
  const [icp, setIcp] = useState("solo founders buying tools to ship faster");
  const [goal, setGoal] = useState<(typeof GOALS)[number]["value"]>("launch");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, icp, goal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Run failed — check URL / server logs",
        );
      }
      router.push(`/c/${data.run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Product URL
        </span>
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourproduct.com"
          className="w-full rounded-xl border border-[var(--line)] bg-[#171410] px-4 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Who you sell to
          </span>
          <input
            value={icp}
            onChange={(e) => setIcp(e.target.value)}
            placeholder="e.g. PMs at Series A startups"
            className="w-full rounded-xl border border-[var(--line)] bg-[#171410] px-4 py-3 outline-none ring-[var(--accent)] focus:ring-2"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Goal
          </span>
          <select
            value={goal}
            onChange={(e) =>
              setGoal(e.target.value as (typeof GOALS)[number]["value"])
            }
            className="w-full rounded-xl border border-[var(--line)] bg-[#171410] px-4 py-3 outline-none ring-[var(--accent)] focus:ring-2"
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#1a1208] transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Building your promo week…" : "Napravi zalet"}
      </button>
      <p className="text-xs text-[var(--muted)]">
        Built for founders advertising their own product. Firecrawl → Exa → Grok
        → Fal → Daytona.
      </p>
    </form>
  );
}
