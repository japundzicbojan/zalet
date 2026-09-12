import { NextResponse } from "next/server";
import { isSafeRunId } from "@/lib/ids";
import { iterateRun } from "@/lib/iterate";
import { IterateActionSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!isSafeRunId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IterateActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad iterate payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const run = await iterateRun(id, parsed.data);
    return NextResponse.json({ run });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Iterate failed";
    const status =
      message.includes("already iterating") ||
      message.includes("Finish the first")
        ? 409
        : message.includes("not found") || message.includes("Run not found")
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
