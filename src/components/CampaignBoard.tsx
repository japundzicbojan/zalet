"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Run, TraceEvent } from "@/lib/types";

const PHASES = [
  { id: "research", label: "Research", tools: ["firecrawl", "exa"] },
  { id: "strategy", label: "Plan", tools: ["xai"] },
  { id: "creatives", label: "Stills", tools: ["fal"] },
  { id: "pack", label: "Pack", tools: ["daytona"] },
] as const;

function phaseState(run: Run, phaseTools: readonly string[]) {
  const related = run.events.filter((e) => phaseTools.includes(e.tool));
  if (!related.length) {
    if (run.status === "failed") return "idle" as const;
    if (run.status === "completed") return "done" as const;
    return "idle" as const;
  }
  if (related.some((e) => e.level === "error")) return "error" as const;
  if (
    related.some((e) => e.level === "success") ||
    (run.status === "completed" && related.length)
  ) {
    return "done" as const;
  }
  return "active" as const;
}

function statusLabel(status: Run["status"]) {
  if (status === "running" || status === "queued") return "Running";
  if (status === "completed") return "Ready";
  return "Failed";
}

function eventTone(level: TraceEvent["level"]) {
  if (level === "success") return "text-[var(--ok)]";
  if (level === "error" || level === "stderr") return "text-[var(--danger)]";
  if (level === "cmd") return "text-[var(--accent)]";
  return "text-[var(--muted)]";
}

function CopyBoardLink({ runId }: { runId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const link = `${window.location.origin}/c/${runId}`;
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}
      className="border border-[var(--line)] bg-white/70 px-3 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
    >
      {copied ? "Link copied" : "Copy board link"}
    </button>
  );
}

export function CampaignBoard({ runId }: { runId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openScript, setOpenScript] = useState<string | null>(null);
  const traceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
      const data = await res.json();
      if (!alive) return;
      if (!res.ok) {
        setError(data.error || "No board with that id");
        return;
      }
      setRun(data.run);
    }
    load();
    const t = setInterval(load, 1400);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [runId]);

  useEffect(() => {
    const el = traceRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [run?.events.length]);

  const phases = useMemo(() => {
    if (!run) return [];
    return PHASES.map((p) => ({
      ...p,
      state: phaseState(run, p.tools),
    }));
  }, [run]);

  if (error) {
    return (
      <div className="border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-5">
        <p className="font-display text-2xl">
          Couldn’t open this board
        </p>
        <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-12 w-2/3 max-w-xl" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const running = run.status === "running" || run.status === "queued";

  return (
    <div className="space-y-10">
      <header className="space-y-5 border-b border-[var(--line)] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em]">
          <span
            className={
              run.status === "failed"
                ? "text-[var(--danger)]"
                : run.status === "completed"
                  ? "text-[var(--ok)]"
                  : "text-[var(--accent)]"
            }
          >
            {statusLabel(run.status)}
          </span>
          <span className="text-[var(--muted)]">Your promo board</span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">
              {run.product?.name || "Still reading your product"}
            </h1>
            <p className="text-[15px] leading-relaxed text-[var(--muted)]">
              {run.campaign?.positioning ||
                run.product?.oneLiner ||
                run.input.url}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {run.daytona?.previewUrl ? (
              <a
                href={run.daytona.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-[#f4fbfa] transition hover:bg-[var(--accent)] hover:text-[#f4fbfa]"
              >
                Open pack preview
              </a>
            ) : null}
            {run.daytona?.zipReady ? (
              <a
                href={`/api/runs/${run.id}/zip`}
                className="border border-[var(--line)] bg-white/70 px-3 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
              >
                Download zip
              </a>
            ) : null}
            <CopyBoardLink runId={run.id} />
            <a
              href={run.input.url}
              target="_blank"
              rel="noreferrer"
              className="border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--accent)]"
            >
              Open product site
            </a>
          </div>
        </div>

        <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {phases.map((p) => (
            <li
              key={p.id}
              className={`border px-3 py-2 text-sm ${
                p.state === "done"
                  ? "border-[var(--ok)]/35 bg-[var(--accent-soft)]"
                  : p.state === "active"
                    ? "border-[var(--accent)] bg-white"
                    : p.state === "error"
                      ? "border-[var(--danger)]/40 bg-[var(--danger)]/5"
                      : "border-[var(--line)] bg-white/40 text-[var(--muted)]"
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                {p.state === "active" && running
                  ? "now"
                  : p.state === "done"
                    ? "done"
                    : p.state === "error"
                      ? "error"
                      : "next"}
              </p>
              <p className="font-semibold">{p.label}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          {Object.entries(run.providers).map(([k, v]) => (
            <span key={k}>
              {k}{" "}
              <span
                className={
                  v === "live" ? "text-[var(--ok)]" : "text-[var(--warn)]"
                }
              >
                {v}
              </span>
            </span>
          ))}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl tracking-tight">
              What the agent did
            </h2>
            {running ? (
              <span className="text-xs text-[var(--accent)]">live</span>
            ) : null}
          </div>
          <div
            ref={traceRef}
            className="max-h-[420px] space-y-0 overflow-auto border border-[var(--line)] bg-white/55 font-mono text-[12px] leading-relaxed"
          >
            {run.events.length ? (
              run.events.map((e) => (
                <div
                  key={e.id}
                  className="grid grid-cols-[72px_56px_1fr] gap-2 border-b border-[var(--line)]/70 px-3 py-2"
                >
                  <span className="text-[var(--accent)]">{e.tool}</span>
                  <span className={eventTone(e.level)}>{e.level}</span>
                  <span className="text-[var(--ink)]/90">{e.msg}</span>
                </div>
              ))
            ) : (
              <p className="px-3 py-6 text-sm text-[var(--muted)]">
                Nothing yet. First step should show up soon.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-2xl tracking-tight">
            Stills
          </h2>
          {run.creatives.length ? (
            <div className="grid grid-cols-3 gap-2">
              {run.creatives.map((c) => (
                <a
                  key={c.id}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden border border-[var(--line)] bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.url}
                    alt={c.prompt}
                    className="aspect-[9/16] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-end border border-dashed border-[var(--line)] bg-white/40 p-4">
              <p className="text-sm text-[var(--muted)]">
                {running
                  ? "Fal is cooking the stills."
                  : "No stills on this run."}
              </p>
            </div>
          )}
        </div>
      </section>

      {run.research ? (
        <section className="space-y-5">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl tracking-tight">
              What you should post
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
              {run.research.summary}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Trends (Exa)
              </h3>
              <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {run.research.trends.map((t) => (
                  <article key={t.title} className="py-4">
                    <h4 className="font-semibold">{t.title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                      {t.insight}
                    </p>
                  </article>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Formats that fit
              </h3>
              <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {run.research.recommendations.map((r) => (
                  <article key={`${r.format}-${r.hookIdea}`} className="py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      {r.priority} · {r.platform}
                    </p>
                    <h4 className="mt-1 font-semibold">{r.format}</h4>
                    <p className="mt-1.5 text-sm text-[var(--muted)]">{r.why}</p>
                    <p className="mt-2 text-sm">
                      <span className="text-[var(--accent)]">Hook:</span>{" "}
                      {r.hookIdea}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : running ? (
        <section>
          <h2 className="font-display text-2xl tracking-tight">
            What you should post
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Exa is looking up what’s working right now.
          </p>
        </section>
      ) : null}

      {run.campaign ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Seven days of posts
          </h2>
          <div className="overflow-x-auto border border-[var(--line)] bg-white/50">
            <div className="flex min-w-[720px] divide-x divide-[var(--line)]">
              {run.campaign.week.map((d) => (
                <article key={d.day} className="w-[180px] shrink-0 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
                    Day {d.day}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{d.platform}</p>
                  <h3 className="mt-2 text-sm font-semibold leading-snug">
                    {d.angle}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                    {d.hook}
                  </p>
                  <p className="mt-3 text-[11px] font-medium">CTA: {d.cta}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {run.campaign?.scripts?.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Scripts
          </h2>
          <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-white/55">
            {run.campaign.scripts.map((s) => {
              const key = `${s.dayRef}-${s.language}`;
              const open = openScript === key;
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenScript(open ? null : key)}
                    className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/80"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
                        Day {s.dayRef} · {s.language} · {s.runtimeSec}s
                      </p>
                      <p className="mt-1 font-semibold">{s.hookText}</p>
                    </div>
                    <span className="text-sm text-[var(--muted)]">
                      {open ? "Close" : "Show beats"}
                    </span>
                  </button>
                  {open ? (
                    <ul className="space-y-2 border-t border-[var(--line)] bg-[var(--panel-solid)] px-4 py-3 text-sm text-[var(--muted)]">
                      {s.beats.map((b) => (
                        <li key={`${key}-${b.t}`} className="flex gap-3">
                          <span className="w-10 shrink-0 font-mono text-[var(--ink)]">
                            {b.t}s
                          </span>
                          <span>
                            <span className="text-[var(--ink)]">{b.vo}</span>
                            <span className="mt-0.5 block text-xs opacity-70">
                              {b.visual} · on screen: {b.onScreen}
                            </span>
                          </span>
                        </li>
                      ))}
                      <li className="pt-1 text-[var(--accent)]">
                        CTA: {s.cta}
                      </li>
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {run.status === "failed" && run.error ? (
        <p className="border border-[var(--danger)]/25 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {run.error}
        </p>
      ) : null}
    </div>
  );
}
