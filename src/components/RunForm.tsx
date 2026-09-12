"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOALS = [
  { value: "launch", label: "Launch week" },
  { value: "waitlist", label: "Waitlist signups" },
  { value: "first_100", label: "First 100 users" },
] as const;

const fieldClass =
  "w-full border border-[var(--line)] bg-white/80 px-3.5 py-3 text-[15px] text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)] focus:bg-white";

export function RunForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [icp, setIcp] = useState("");
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
        body: JSON.stringify({
          url,
          icp: icp.trim() || undefined,
          goal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Couldn’t start. Check the URL and try again.",
        );
      }
      const id = data.run?.id || data.id;
      if (!id) throw new Error("Started, but no board id came back.");
      router.push(`/c/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something broke");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
          Start a zalet
        </p>
        <p className="text-sm text-[var(--muted)]">
          Board opens instantly. Trace fills as partners finish.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Product URL
        </span>
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourproduct.com"
          className={fieldClass}
          autoComplete="url"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Who buys this
          </span>
          <input
            value={icp}
            onChange={(e) => setIcp(e.target.value)}
            placeholder="PMs at Series A startups"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Goal
          </span>
          <select
            value={goal}
            onChange={(e) =>
              setGoal(e.target.value as (typeof GOALS)[number]["value"])
            }
            className={fieldClass}
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
        <p
          role="alert"
          className="border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-3 py-2 text-sm text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center bg-[var(--ink)] px-5 py-3.5 text-sm font-semibold text-[#f4fbfa] transition hover:bg-[var(--accent)] hover:text-[#f4fbfa] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-[1px] bg-white" />
            Opening your board
          </span>
        ) : (
          "Napravi zalet"
        )}
      </button>

      <p className="text-xs leading-relaxed text-[var(--muted)]">
        You land on the live board right away while research, plan, stills, and
        the Daytona pack fill in.
      </p>
    </form>
  );
}
