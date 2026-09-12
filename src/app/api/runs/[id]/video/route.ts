import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isSafeRunId } from "@/lib/ids";
import { generateVideoClip } from "@/lib/providers/fal";
import { appendEvent, getRun, patchRun } from "@/lib/store";
import type { TraceEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function ev(
  phase: string,
  tool: TraceEvent["tool"],
  level: TraceEvent["level"],
  msg: string,
): TraceEvent {
  return { id: nanoid(10), ts: Date.now(), phase, tool, level, msg };
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!isSafeRunId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!run.product || !run.campaign) {
    return NextResponse.json(
      { error: "Run is not ready for video yet" },
      { status: 409 },
    );
  }

  await appendEvent(
    id,
    ev("creatives", "fal", "cmd", "Fal minimax video clip"),
  );

  const result = await generateVideoClip({
    brief: run.product,
    campaign: run.campaign,
  });

  const creatives = [...(run.creatives || []), result.creative];
  const updated = await patchRun(id, {
    creatives,
    providers: {
      ...run.providers,
      fal: result.mode === "live" ? "live" : run.providers.fal,
    },
  });

  await appendEvent(
    id,
    ev(
      "creatives",
      "fal",
      result.mode === "live" ? "success" : "info",
      result.log,
    ),
  );

  return NextResponse.json({ run: updated, creative: result.creative });
}
