import Link from "next/link";
import { CampaignBoard } from "@/components/CampaignBoard";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 md:py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
        >
          Back to Zalet
        </Link>
        <p className="font-mono text-[11px] tracking-wide text-[var(--muted)]">
          {id}
        </p>
      </div>
      <CampaignBoard runId={id} />
    </main>
  );
}
