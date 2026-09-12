import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import type { Run } from "./types";

const upsertRef = makeFunctionReference<"mutation">("runs:upsert");

/**
 * Best-effort dual-write when Convex is configured + deployed.
 * Local `.data` (or ZALET_DATA_DIR) remains the working store for this build.
 */
export async function syncRunToConvex(run: Run): Promise<void> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url) return;

  try {
    const client = new ConvexHttpClient(url);
    await client.mutation(upsertRef, {
      runId: run.id,
      status: run.status,
      payload: run,
      updatedAt: run.updatedAt,
    });
  } catch {
    /* ignore until Convex is deployed */
  }
}
