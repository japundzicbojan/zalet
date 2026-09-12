import { NextResponse } from "next/server";
import { isSafeRunId } from "@/lib/ids";
import { getPackPreviewHtml, getRun } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!isSafeRunId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const html = await getPackPreviewHtml(id);
  if (!html) {
    return NextResponse.json(
      { error: "Preview not ready yet" },
      { status: 404 },
    );
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
