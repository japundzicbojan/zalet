import { nanoid } from "nanoid";
import { providerMode } from "./env";
import { scrapeProduct } from "./providers/firecrawl";
import { researchTrends } from "./providers/exa";
import { generateCampaign } from "./providers/xai";
import { generateCreatives } from "./providers/fal";
import { packInDaytona } from "./providers/daytona";
import { appendEvent, getRun, patchRun, saveRun } from "./store";
import type { CreateRunInput, Run, TraceEvent } from "./types";

function ev(
  phase: string,
  tool: TraceEvent["tool"],
  level: TraceEvent["level"],
  msg: string,
): TraceEvent {
  return { id: nanoid(10), ts: Date.now(), phase, tool, level, msg };
}

async function currentProviders(id: string, fallback: Run["providers"]) {
  return (await getRun(id))?.providers || fallback;
}

/** Create a queued run and persist it. Does not execute the pipeline. */
export async function createQueuedRun(input: CreateRunInput): Promise<Run> {
  const modes = providerMode();
  const run: Run = {
    id: nanoid(12),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "queued",
    input: {
      url: input.url,
      icp: input.icp,
      goal: input.goal ?? "launch",
    },
    creatives: [],
    events: [
      ev("init", "system", "info", `Queued for ${input.url}`),
      ev(
        "init",
        "system",
        "info",
        `Stack → Firecrawl:${modes.firecrawl} Exa:${modes.exa} xAI:${modes.xai} Fal:${modes.fal} Daytona:${modes.daytona} Convex:${modes.convex}`,
      ),
    ],
    providers: {
      firecrawl: modes.firecrawl,
      exa: modes.exa,
      xai: modes.xai,
      fal: modes.fal,
      daytona: modes.daytona,
    },
  };

  return saveRun(run);
}

/** Execute the full partner pipeline for an existing run id. */
export async function executeRun(runId: string): Promise<Run> {
  const existing = await getRun(runId);
  if (!existing) throw new Error("Run not found");

  const input = existing.input;
  const modes = providerMode();

  await patchRun(runId, { status: "running" });
  await appendEvent(
    runId,
    ev("init", "system", "info", `Run started for ${input.url}`),
  );

  try {
    await appendEvent(
      runId,
      ev("research", "firecrawl", "cmd", `scrape ${input.url}`),
    );
    const scraped = await scrapeProduct(input.url);
    await patchRun(runId, {
      product: scraped.brief,
      providers: {
        ...(await currentProviders(runId, existing.providers)),
        firecrawl: scraped.mode,
      },
    });
    await appendEvent(
      runId,
      ev(
        "research",
        "firecrawl",
        scraped.mode === "live" ? "success" : "info",
        scraped.log,
      ),
    );

    await appendEvent(
      runId,
      ev(
        "research",
        "exa",
        "cmd",
        "Exa trend research + best content recommendations",
      ),
    );
    const researched = await researchTrends(scraped.brief, input.icp);
    await patchRun(runId, {
      research: researched.research,
      providers: {
        ...(await currentProviders(runId, existing.providers)),
        exa: researched.mode,
      },
    });
    await appendEvent(
      runId,
      ev(
        "research",
        "exa",
        researched.mode === "live" ? "success" : "info",
        researched.log,
      ),
    );
    if (researched.research.recommendations[0]) {
      const top = researched.research.recommendations[0];
      await appendEvent(
        runId,
        ev(
          "research",
          "exa",
          "info",
          `Top content pick → ${top.format} on ${top.platform}: ${top.hookIdea}`,
        ),
      );
    }

    await appendEvent(
      runId,
      ev("strategy", "xai", "cmd", "Grok: 7-day plan + UGC scripts"),
    );
    const strategy = await generateCampaign({
      brief: scraped.brief,
      angles: researched.research.angles,
      research: researched.research,
      icp: input.icp,
      goal: input.goal ?? "launch",
    });
    await patchRun(runId, {
      campaign: strategy.campaign,
      providers: {
        ...(await currentProviders(runId, existing.providers)),
        xai: strategy.mode,
      },
    });
    await appendEvent(
      runId,
      ev(
        "strategy",
        "xai",
        strategy.mode === "live" ? "success" : "info",
        strategy.log,
      ),
    );

    await appendEvent(
      runId,
      ev("creatives", "fal", "cmd", "Fal flux/schnell × 3 UGC stills"),
    );
    const creatives = await generateCreatives(
      scraped.brief,
      strategy.campaign,
    );
    await patchRun(runId, {
      creatives: creatives.creatives,
      providers: {
        ...(await currentProviders(runId, existing.providers)),
        fal: creatives.mode,
      },
    });
    await appendEvent(
      runId,
      ev(
        "creatives",
        "fal",
        creatives.mode === "live" ? "success" : "info",
        creatives.log,
      ),
    );

    await appendEvent(
      runId,
      ev("pack", "daytona", "cmd", "sandbox: write pack + zip + preview"),
    );
    const packed = await packInDaytona({
      runId,
      brief: scraped.brief,
      campaign: strategy.campaign,
      creatives: creatives.creatives,
    });
    for (const line of packed.logs) {
      await appendEvent(
        runId,
        ev("pack", "daytona", line.startsWith("$") ? "cmd" : "stdout", line),
      );
    }
    await patchRun(runId, {
      daytona: {
        sandboxId: packed.sandboxId,
        previewUrl: packed.previewUrl,
        zipPath: packed.zipPath,
        zipReady: packed.zipReady,
        mock: packed.mock,
      },
      providers: {
        ...(await currentProviders(runId, existing.providers)),
        daytona: packed.mode,
      },
    });
    await appendEvent(
      runId,
      ev(
        "pack",
        "daytona",
        packed.mode === "live" ? "success" : "info",
        packed.mode === "live"
          ? `Sandbox ${packed.sandboxId} packed campaign`
          : "Daytona mock pack complete",
      ),
    );

    await appendEvent(
      runId,
      ev(
        "persist",
        "convex",
        "info",
        modes.convex === "live"
          ? "Convex dual-write on (file store still primary until board is wired to Convex queries)"
          : "Saving runs under .data (set NEXT_PUBLIC_CONVEX_URL + npx convex deploy for durable cloud board)",
      ),
    );

    return (await patchRun(runId, { status: "completed" }))!;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Run failed";
    await appendEvent(runId, ev("error", "system", "error", message));
    return (await patchRun(runId, { status: "failed", error: message }))!;
  }
}

/** @deprecated Prefer createQueuedRun + executeRun for async boards. */
export async function createAndRun(input: CreateRunInput): Promise<Run> {
  const run = await createQueuedRun(input);
  return executeRun(run.id);
}
