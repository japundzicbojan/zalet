"use client";

import { useEffect, useState } from "react";
import type { Run } from "@/lib/types";

export function CampaignBoard({ runId }: { runId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
      const data = await res.json();
      if (!alive) return;
      if (!res.ok) {
        setError(data.error || "Not found");
        return;
      }
      setRun(data.run);
    }
    load();
    const t = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [runId]);

  if (error) return <p className="text-red-200">{error}</p>;
  if (!run) return <p className="text-[var(--muted)]">Loading campaign…</p>;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
          Campaign board · {run.status}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-5xl">
          {run.product?.name || "Zalet run"}
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          {run.campaign?.positioning ||
            run.product?.oneLiner ||
            run.input.url}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(run.providers).map(([k, v]) => (
            <span
              key={k}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--muted)]"
            >
              {k}: <span className="text-[var(--ink)]">{v}</span>
            </span>
          ))}
        </div>
        {run.daytona?.previewUrl ? (
          <a
            href={run.daytona.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm text-[var(--accent)] underline"
          >
            Daytona sandbox preview
          </a>
        ) : null}
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Agent trace
          </h2>
          <div className="max-h-[420px] space-y-2 overflow-auto font-mono text-xs">
            {run.events.map((e) => (
              <div
                key={e.id}
                className="flex gap-2 border-b border-[var(--line)]/60 pb-2"
              >
                <span className="w-16 shrink-0 text-[var(--accent)]">
                  {e.tool}
                </span>
                <span className="w-14 shrink-0 text-[var(--muted)]">
                  {e.level}
                </span>
                <span>{e.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            UGC creatives (Fal)
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {run.creatives.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-[var(--line)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.url}
                  alt={c.prompt}
                  className="aspect-[9/16] w-full object-cover"
                />
              </div>
            ))}
            {!run.creatives.length ? (
              <p className="col-span-3 text-sm text-[var(--muted)]">
                Waiting for Fal…
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {run.campaign ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            7-day plan
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {run.campaign.week.map((d) => (
              <article
                key={d.day}
                className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                  Day {d.day} · {d.platform}
                </p>
                <h3 className="mt-2 font-semibold">{d.angle}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{d.hook}</p>
                <p className="mt-3 text-xs">CTA: {d.cta}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {run.campaign?.scripts?.length ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Scripts
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {run.campaign.scripts.map((s) => (
              <article
                key={`${s.dayRef}-${s.language}`}
                className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                  Day {s.dayRef} · {s.language} · {s.runtimeSec}s
                </p>
                <h3 className="mt-2 font-semibold">{s.hookText}</h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {s.beats.map((b) => (
                    <li key={`${s.dayRef}-${b.t}`}>
                      <span className="text-[var(--ink)]">[{b.t}s]</span> {b.vo}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
