"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefinePreset, Run, TraceEvent } from "@/lib/types";

const PHASES = [
  { id: "research", label: "Research", tools: ["firecrawl", "exa"] },
  { id: "strategy", label: "Plan", tools: ["xai"] },
  { id: "creatives", label: "Stills", tools: ["fal"] },
  { id: "pack", label: "Pack", tools: ["daytona"] },
] as const;

const REFINE_PRESETS: { id: RefinePreset; label: string; hint: string }[] = [
  {
    id: "sharper_hooks",
    label: "Sharper hooks",
    hint: "First two seconds have to stop the scroll",
  },
  {
    id: "founder_on_camera",
    label: "More founder-on-camera",
    hint: "Talking head first, then product proof",
  },
  {
    id: "louder_cta",
    label: "Louder CTA",
    hint: "One clear ask per day",
  },
  {
    id: "shorter_scripts",
    label: "Shorter scripts",
    hint: "Tighten to ~15–20s",
  },
];

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

const btnSecondary =
  "inline-flex h-10 items-center justify-center border border-[var(--line)] bg-white/80 px-3.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--ink)] visited:text-[var(--ink)]";
const btnPrimary =
  "inline-flex h-10 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] px-3.5 text-sm font-semibold text-[#f4fbfa] transition hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-[#f4fbfa] visited:bg-[var(--ink)] visited:text-[#f4fbfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

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
      className={btnSecondary}
    >
      {copied ? "Link copied" : "Copy board link"}
    </button>
  );
}

export function CampaignBoard({ runId }: { runId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openScript, setOpenScript] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [iterateBusy, setIterateBusy] = useState(false);
  const [iterateError, setIterateError] = useState<string | null>(null);
  const [scriptEdits, setScriptEdits] = useState<Record<number, string>>({});
  const [resultUrls, setResultUrls] = useState("");
  const [resultNotes, setResultNotes] = useState("");
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

  const stills = useMemo(
    () => (run?.creatives || []).filter((c) => c.kind === "still"),
    [run],
  );
  const videos = useMemo(
    () => (run?.creatives || []).filter((c) => c.kind === "video"),
    [run],
  );

  async function onGenerateVideo() {
    if (!run || videoBusy) return;
    setVideoBusy(true);
    setVideoError(null);
    try {
      // Fal minimax often takes 2–3 minutes. Keep the request open.
      const res = await fetch(`/api/runs/${run.id}/video`, {
        method: "POST",
        signal: AbortSignal.timeout(290_000),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Could not generate video",
        );
      }
      if (data.run) setRun(data.run);
      const last = [...(data.run?.creatives || [])]
        .reverse()
        .find((c: { kind?: string }) => c.kind === "video");
      if (last?.mock) {
        setVideoError(
          "Video fell back to a placeholder. Check FAL_KEY / Fal model access.",
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Video failed";
      setVideoError(
        msg.includes("Timeout") || msg.includes("abort")
          ? "Video timed out after ~5 minutes. Try again, or use a warm board for the demo."
          : msg,
      );
    } finally {
      setVideoBusy(false);
    }
  }

  async function postIterate(body: Record<string, unknown>) {
    if (!run || iterateBusy) return;
    setIterateBusy(true);
    setIterateError(null);
    try {
      const res = await fetch(`/api/runs/${run.id}/iterate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Iterate failed",
        );
      }
      if (data.run) setRun(data.run);
    } catch (err) {
      setIterateError(err instanceof Error ? err.message : "Iterate failed");
    } finally {
      setIterateBusy(false);
    }
  }

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

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {run.daytona?.zipReady || run.daytona?.previewUrl ? (
                <a
                  href={`/api/runs/${run.id}/preview`}
                  target="_blank"
                  rel="noreferrer"
                  className={btnPrimary}
                >
                  Open pack preview
                </a>
              ) : null}
              {run.daytona?.zipReady ? (
                <a href={`/api/runs/${run.id}/zip`} className={btnSecondary}>
                  Download zip
                </a>
              ) : null}
              {run.status === "completed" || run.product ? (
                <button
                  type="button"
                  onClick={onGenerateVideo}
                  disabled={videoBusy || !run.campaign}
                  className={`${btnSecondary} disabled:cursor-wait disabled:opacity-60`}
                >
                  {videoBusy ? "Generating video…" : "Generate video"}
                </button>
              ) : null}
              <CopyBoardLink runId={run.id} />
              <a
                href={run.input.url}
                target="_blank"
                rel="noreferrer"
                className={btnSecondary}
              >
                Open product site
              </a>
            </div>
            {videoBusy ? (
              <p className="text-xs text-[var(--muted)]">
                Fal video usually takes 2–3 minutes. Leave this tab open.
              </p>
            ) : null}
            {videoError ? (
              <p className="text-xs text-[var(--danger)]">{videoError}</p>
            ) : null}
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

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl tracking-tight">Stills</h2>
              {run.status === "completed" ? (
                <button
                  type="button"
                  onClick={onGenerateVideo}
                  disabled={videoBusy || !run.campaign}
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)] disabled:opacity-50"
                >
                  {videoBusy ? "Generating…" : "Generate video"}
                </button>
              ) : null}
            </div>
            {stills.length ? (
              <div className="grid grid-cols-3 gap-2">
                {stills.map((c) => (
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
                    ? "Fal is generating the stills."
                    : "No stills on this run."}
                </p>
              </div>
            )}
          </div>

          {videos.length ? (
            <div>
              <h2 className="mb-3 font-display text-2xl tracking-tight">
                Video
              </h2>
              <div className="grid gap-3">
                {videos.map((c) => (
                  <div
                    key={c.id}
                    className="overflow-hidden border border-[var(--line)] bg-black"
                  >
                    {c.url.startsWith("data:") ? (
                      <div className="flex aspect-[9/16] max-h-[420px] items-center justify-center bg-[#1a2428] p-4 text-center text-sm text-[#f4fbfa]">
                        Video placeholder (Fal fallback)
                      </div>
                    ) : (
                      <video
                        src={c.url}
                        controls
                        playsInline
                        className="aspect-[9/16] max-h-[420px] w-full object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl tracking-tight">
              {run.iteration?.weekNumber && run.iteration.weekNumber > 1
                ? `Week ${run.iteration.weekNumber} posts`
                : "Seven days of posts"}
            </h2>
            {run.iteration?.lastAction ? (
              <p className="text-xs text-[var(--muted)]">
                Last iterate: {run.iteration.lastAction}
              </p>
            ) : null}
          </div>
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

      {run.status === "completed" && run.campaign ? (
        <section className="space-y-6 border border-[var(--line)] bg-white/60 p-5 md:p-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl tracking-tight">
              Keep going on this board
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
              Refine with Grok, ship week{" "}
              {(run.iteration?.weekNumber ?? 1) + 1}, or feed back what
              actually performed. Same board, not a new paste.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Refine with Grok
            </h3>
            <div className="flex flex-wrap gap-2">
              {REFINE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.hint}
                  disabled={iterateBusy}
                  onClick={() =>
                    postIterate({ action: "refine", preset: p.id })
                  }
                  className={`${btnSecondary} disabled:cursor-wait disabled:opacity-60`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                disabled={iterateBusy}
                onClick={() => postIterate({ action: "week2" })}
                className={`${btnPrimary} disabled:cursor-wait disabled:opacity-60`}
              >
                {iterateBusy
                  ? "Working…"
                  : `Generate week ${(run.iteration?.weekNumber ?? 1) + 1}`}
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--line)] pt-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Adapt from results
            </h3>
            <p className="max-w-2xl text-sm text-[var(--muted)]">
              Paste public post URLs if you have them. Instagram, TikTok, and
              similar often block scrapers, so your notes matter more than the
              scrape. Firecrawl tries anyway; Grok adapts from what we get plus
              what you write.
            </p>
            <textarea
              value={resultUrls}
              onChange={(e) => setResultUrls(e.target.value)}
              rows={2}
              placeholder="https://… post URLs, one per line"
              className="w-full border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <textarea
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              rows={3}
              placeholder="What worked? What flopped? Views, comments, saves, what people replied…"
              className="w-full border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              disabled={iterateBusy}
              onClick={() => {
                const postUrls = resultUrls
                  .split(/[\n,\s]+/)
                  .map((u) => u.trim())
                  .filter((u) => /^https?:\/\//i.test(u))
                  .slice(0, 5);
                postIterate({
                  action: "adapt_results",
                  postUrls,
                  notes: resultNotes.trim() || undefined,
                });
              }}
              className={`${btnPrimary} disabled:cursor-wait disabled:opacity-60`}
            >
              {iterateBusy ? "Adapting…" : "Adapt next plan"}
            </button>
            {run.iteration?.resultSignals?.length ? (
              <ul className="space-y-1 text-xs text-[var(--muted)]">
                {run.iteration.resultSignals.map((s) => (
                  <li key={s.url}>
                    {s.scraped ? "scraped" : "thin/blocked"} · {s.title || s.url}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {iterateError ? (
            <p className="text-sm text-[var(--danger)]">{iterateError}</p>
          ) : null}
          {iterateBusy ? (
            <p className="text-xs text-[var(--accent)]">
              Grok is iterating. Trace updates live above.
            </p>
          ) : null}
        </section>
      ) : null}

      {run.campaign?.scripts?.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Scripts
          </h2>
          <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-white/55">
            {run.campaign.scripts.map((s, scriptIndex) => {
              const key = `${s.dayRef}-${s.language}-${scriptIndex}`;
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
                        Day {s.dayRef} · English · {s.runtimeSec}s
                      </p>
                      <p className="mt-1 font-semibold">{s.hookText}</p>
                    </div>
                    <span className="text-sm text-[var(--muted)]">
                      {open ? "Close" : "Show beats"}
                    </span>
                  </button>
                  {open ? (
                    <div className="space-y-3 border-t border-[var(--line)] bg-[var(--panel-solid)] px-4 py-3">
                      <ul className="space-y-2 text-sm text-[var(--muted)]">
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
                      {run.status === "completed" ? (
                        <div className="space-y-2 border-t border-[var(--line)] pt-3">
                          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Rewrite this script
                          </label>
                          <input
                            value={scriptEdits[s.dayRef] || ""}
                            onChange={(e) =>
                              setScriptEdits((prev) => ({
                                ...prev,
                                [s.dayRef]: e.target.value,
                              }))
                            }
                            placeholder="e.g. Make it punchier / shorter CTA / more skeptical tone"
                            className="w-full border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                iterateBusy ||
                                !(scriptEdits[s.dayRef] || "").trim()
                              }
                              onClick={() =>
                                postIterate({
                                  action: "rewrite_script",
                                  dayRef: s.dayRef,
                                  instruction: (
                                    scriptEdits[s.dayRef] || ""
                                  ).trim(),
                                })
                              }
                              className={`${btnPrimary} disabled:cursor-wait disabled:opacity-60`}
                            >
                              Rewrite with Grok
                            </button>
                            <button
                              type="button"
                              disabled={iterateBusy}
                              onClick={() =>
                                postIterate({
                                  action: "new_still",
                                  dayRef: s.dayRef,
                                  scriptIndex,
                                })
                              }
                              className={`${btnSecondary} disabled:cursor-wait disabled:opacity-60`}
                            >
                              New still for this script
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
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
