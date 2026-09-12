import { RunForm } from "@/components/RunForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 pb-20 pt-10">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
            Grok Bot Serbia Hackathon
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl tracking-tight md:text-6xl">
            Zalet
          </h1>
        </div>
        <p className="max-w-xs text-right text-xs text-[var(--muted)]">
          Official stack: Firecrawl · Exa · xAI · Fal · Daytona · Convex · Render
        </p>
      </div>

      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-5">
          <h2 className="max-w-xl font-[family-name:var(--font-display)] text-3xl leading-tight md:text-4xl">
            For founders who need to advertise their product — without a marketing team.
          </h2>
          <p className="max-w-lg text-[var(--muted)]">
            Paste your product URL. The agent researches what content is working,
            writes a 7-day founder-led promo plan and scripts you can film,
            generates creatives, then packs the campaign in a Daytona sandbox.
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <RunForm />
        </div>
      </section>
    </main>
  );
}
