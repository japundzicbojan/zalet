import { CampaignBoard } from "@/components/CampaignBoard";
import Link from "next/link";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Zalet
        </Link>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          /c/{id}
        </p>
      </div>
      <CampaignBoard runId={id} />
    </main>
  );
}
