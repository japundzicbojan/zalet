import { NextResponse } from "next/server";
import { providerMode } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    providers: providerMode(),
    stack: [
      "firecrawl",
      "exa",
      "xai",
      "fal",
      "daytona",
      "convex",
      "render",
    ],
  });
}
