import { after, NextResponse } from "next/server";
import { authorizeRunSecret, runSecretConfigured } from "@/lib/auth-api";
import { createQueuedRun, executeRun } from "@/lib/pipeline";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { listRuns } from "@/lib/store";
import { CreateRunInputSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Listing is private. Requires ZALET_RUN_SECRET when set; otherwise 404. */
export async function GET(req: Request) {
  if (!runSecretConfigured() || !authorizeRunSecret(req)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const runs = await listRuns();
  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      url: r.input.url,
      name: r.product?.name,
    })),
  });
}

export async function POST(req: Request) {
  try {
    // Public form is rate-limited. Optional ZALET_RUN_SECRET is for listing / ops, not create.
    const limited = rateLimit(`run:${clientKey(req)}`, 5, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many runs. Try again in a minute." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = await req.json();
    const parsed = CreateRunInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const run = await createQueuedRun(parsed.data);

    after(async () => {
      try {
        await executeRun(run.id);
      } catch (err) {
        console.error("Background run failed", run.id, err);
      }
    });

    return NextResponse.json({ run, id: run.id }, { status: 202 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
