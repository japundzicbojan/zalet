import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { isSafeRunId } from "@/lib/ids";
import { getPackZipPath, getRun } from "@/lib/store";

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

  const zipPath = await getPackZipPath(id);
  if (!zipPath) {
    return NextResponse.json(
      { error: "Zip not ready yet" },
      { status: 404 },
    );
  }

  const bytes = await fs.readFile(zipPath);
  const name = (run.product?.name || "zalet-campaign")
    .replace(/[^\w.-]+/g, "-")
    .slice(0, 48);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}-campaign.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
