import { NextResponse } from "next/server";
import { createAndRun } from "@/lib/pipeline";
import { listRuns } from "@/lib/store";
import { CreateRunInputSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
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
    const body = await req.json();
    const parsed = CreateRunInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const run = await createAndRun(parsed.data);
    return NextResponse.json({ run });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
