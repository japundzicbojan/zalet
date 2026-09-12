import { RunForm } from "@/components/RunForm";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-16 pt-8 md:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[72vh] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55),transparent_68%)]" />
        <div className="runway-line absolute bottom-[28%] left-[8%] h-px w-[55%] bg-[var(--accent)]/50" />
        <div className="absolute bottom-[22%] left-[18%] h-px w-[48%] bg-[var(--ink)]/10" />
        <div className="absolute bottom-[16%] left-[28%] h-px w-[40%] bg-[var(--ink)]/8" />
      </div>

      <header className="animate-rise mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
            For solo founders
          </p>
          <h1 className="font-display mt-2 text-6xl leading-[0.92] tracking-tight md:text-7xl">
            Zalet
          </h1>
        </div>
        <p className="hidden max-w-[16rem] text-right text-xs leading-relaxed text-[var(--muted)] sm:block">
          Firecrawl · Exa · xAI · Fal · Daytona · Convex · Render
        </p>
      </header>

      <section className="grid flex-1 items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise-delay max-w-xl space-y-5 pb-2">
          <h2 className="font-display text-3xl leading-[1.12] tracking-tight md:text-[2.75rem]">
            Founders build. Zalet gives them{" "}
            <span className="text-[var(--accent)]">a push</span>.
          </h2>
          <p className="max-w-md text-[15px] leading-[1.65] text-[var(--muted)]">
            Paste your product URL and walk away with a UGC market strategy,
            day-by-day filming guide, on-camera scripts, stills, optional video,
            and a zip pack. Then refine hooks, rewrite a script, or generate next
            week on the same board.
          </p>
        </div>

        <div className="animate-rise-late border border-[var(--line)] bg-[var(--panel)] p-5 backdrop-blur-md md:p-6">
          <RunForm />
        </div>
      </section>
    </main>
  );
}
