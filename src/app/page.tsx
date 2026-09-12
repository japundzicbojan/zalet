import { RunForm } from "@/components/RunForm";

const STEPS = [
  {
    n: "01",
    title: "Paste the product",
    body: "Drop your live product URL. Zalet reads the page and market context so the plan is about your offer, not a generic niche.",
  },
  {
    n: "02",
    title: "Get the week pack",
    body: "Receive a 7-day UGC strategy, filming guide, scripts, stills, optional video, and a downloadable zip on one shareable board.",
  },
  {
    n: "03",
    title: "Iterate on the board",
    body: "Rewrite a hook, swap a still, extend to week two, or adapt from results without starting over.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[72vh] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55),transparent_68%)]" />
        <div className="runway-line absolute bottom-[28%] left-[8%] h-px w-[42%] bg-[var(--accent)]/45" />
        <div className="absolute bottom-[22%] left-[14%] h-px w-[36%] bg-[var(--ink)]/10" />
        <div className="absolute bottom-[16%] left-[22%] h-px w-[28%] bg-[var(--ink)]/8" />
      </div>

      <nav className="animate-rise mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[1.75rem] leading-none tracking-tight text-[var(--ink)]">
            Zalet
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
            for founders
          </span>
        </div>
        <div className="flex items-center gap-5 sm:gap-7">
          <a
            href="#how-it-works"
            className="hidden text-[13px] text-[var(--muted)] transition hover:text-[var(--ink)] sm:inline"
          >
            How it works
          </a>
          <a
            href="#start"
            className="inline-flex h-10 items-center justify-center bg-[var(--accent)] px-[18px] text-[13px] font-medium text-white transition hover:bg-[var(--ink)]"
          >
            Paste product URL
          </a>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-6xl items-end gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-12">
        <div className="animate-rise-delay max-w-xl space-y-5 pb-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
            For solo founders
          </p>
          <h1 className="font-display text-6xl leading-[0.9] tracking-tight text-[var(--ink)] md:text-[5.5rem]">
            Zalet
          </h1>
          <h2 className="font-display max-w-[32rem] text-3xl leading-[1.12] tracking-tight text-[var(--ink)] md:text-[2.5rem]">
            Founders build. Zalet gives them{" "}
            <span className="text-[var(--accent)]">a push</span>.
          </h2>
          <p className="max-w-md text-[15px] leading-[1.65] text-[var(--muted)]">
            Paste your product URL and walk away with a UGC market strategy,
            day-by-day filming guide, on-camera scripts, stills, optional video,
            and a zip pack. Then refine on the same board.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <a
              href="#start"
              className="inline-flex h-12 items-center justify-center bg-[var(--accent)] px-[22px] text-[14px] font-medium text-white transition hover:bg-[var(--ink)]"
            >
              Start with a URL
            </a>
            <span className="text-[13px] text-[var(--muted)]">
              No signup. One paste.
            </span>
          </div>
        </div>

        <div
          id="start"
          className="animate-rise-late scroll-mt-24 border border-[var(--line)] bg-[var(--panel)] p-5 backdrop-blur-md md:p-7"
        >
          <RunForm />
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-[var(--line)]/70 bg-[var(--bg-deep)]/70"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-9 px-6 py-16 md:py-20">
          <div className="max-w-xl space-y-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
              The run
            </p>
            <h2 className="font-display text-4xl leading-[1.08] tracking-tight text-[var(--ink)] md:text-[2.75rem]">
              From product URL to a board you can film.
            </h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3 md:gap-10">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="flex flex-col gap-3.5 border-t border-[var(--ink)]/20 pt-5"
              >
                <span className="text-[12px] font-medium tracking-[0.2em] text-[var(--accent)]">
                  {step.n}
                </span>
                <h3 className="font-display text-[1.75rem] leading-[1.15] tracking-tight text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:py-20">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-xl space-y-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#5EE0C8]">
                Ready when you are
              </p>
              <h2 className="font-display text-4xl leading-[1.08] tracking-tight text-[#F4F8FA] md:text-5xl">
                Your product is live. Give the content a push.
              </h2>
              <p className="max-w-md text-[15px] leading-[1.6] text-[#9BB0B8]">
                Paste a URL, get a board, film the week, then iterate without
                leaving the run.
              </p>
            </div>
            <a
              href="#start"
              className="inline-flex h-[52px] shrink-0 items-center justify-center bg-[var(--accent)] px-6 text-[14px] font-medium text-white transition hover:bg-white hover:text-[var(--ink)]"
            >
              Paste product URL
            </a>
          </div>
          <div className="flex flex-col items-start justify-between gap-3 border-t border-white/12 pt-8 sm:flex-row sm:items-center">
            <span className="font-display text-[22px] text-[#F4F8FA]">Zalet</span>
            <span className="text-[12px] text-[#9BB0B8]">
              UGC strategy, scripts, stills, video, zip — same board.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
