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

export async function createAndRun(input: CreateRunInput): Promise<Run> {
  const modes = providerMode();
  const run: Run = {
    id: nanoid(12),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "running",
    input: {
      url: input.url,
      icp: input.icp,
      goal: input.goal ?? "launch",
    },
    creatives: [],
    events: [
      ev("init", "system", "info", `Run started for ${input.url}`),
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

  await saveRun(run);

  try {
    await appendEvent(
      run.id,
      ev("research", "firecrawl", "cmd", `scrape ${input.url}`),
    );
    const scraped = await scrapeProduct(input.url);
    await patchRun(run.id, {
      product: scraped.brief,
      providers: {
        ...(await currentProviders(run.id, run.providers)),
        firecrawl: scraped.mode,
      },
    });
    await appendEvent(
      run.id,
      ev(
        "research",
        "firecrawl",
        scraped.mode === "live" ? "success" : "info",
        scraped.log,
      ),
    );

    await appendEvent(
      run.id,
      ev(
        "research",
        "exa",
        "cmd",
        "Exa trend research + best content recommendations",
      ),
    );
    const researched = await researchTrends(scraped.brief, input.icp);
    await patchRun(run.id, {
      research: researched.research,
      providers: {
        ...(await currentProviders(run.id, run.providers)),
        exa: researched.mode,
      },
    });
    await appendEvent(
      run.id,
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
        run.id,
        ev(
          "research",
          "exa",
          "info",
          `Top content pick → ${top.format} on ${top.platform}: ${top.hookIdea}`,
        ),
      );
    }

    await appendEvent(
      run.id,
      ev("strategy", "xai", "cmd", "Grok: 7-day plan + UGC scripts"),
    );
    const strategy = await generateCampaign({
      brief: scraped.brief,
      angles: researched.research.angles,
      research: researched.research,
      icp: input.icp,
      goal: input.goal ?? "launch",
    });
    await patchRun(run.id, {
      campaign: strategy.campaign,
      providers: {
        ...(await currentProviders(run.id, run.providers)),
        xai: strategy.mode,
      },
    });
    await appendEvent(
      run.id,
      ev(
        "strategy",
        "xai",
        strategy.mode === "live" ? "success" : "info",
        strategy.log,
      ),
    );

    await appendEvent(
      run.id,
      ev("creatives", "fal", "cmd", "Fal flux/schnell × 3 UGC stills"),
    );
    const creatives = await generateCreatives(
      scraped.brief,
      strategy.campaign,
    );
    await patchRun(run.id, {
      creatives: creatives.creatives,
      providers: {
        ...(await currentProviders(run.id, run.providers)),
        fal: creatives.mode,
      },
    });
    await appendEvent(
      run.id,
      ev(
        "creatives",
        "fal",
        creatives.mode === "live" ? "success" : "info",
        creatives.log,
      ),
    );

    await appendEvent(
      run.id,
      ev("pack", "daytona", "cmd", "sandbox: write pack + zip + preview"),
    );
    const packed = await packInDaytona({
      brief: scraped.brief,
      campaign: strategy.campaign,
      creatives: creatives.creatives,
    });
    for (const line of packed.logs) {
      await appendEvent(
        run.id,
        ev("pack", "daytona", line.startsWith("$") ? "cmd" : "stdout", line),
      );
    }
    await patchRun(run.id, {
      daytona: {
        sandboxId: packed.sandboxId,
        previewUrl: packed.previewUrl,
        zipPath: packed.zipPath,
        mock: packed.mock,
      },
      providers: {
        ...(await currentProviders(run.id, run.providers)),
        daytona: packed.mode,
      },
    });
    await appendEvent(
      run.id,
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
      run.id,
      ev(
        "persist",
        "convex",
        "info",
        modes.convex === "live"
          ? "Convex is on. Board can update live."
          : "Saving runs to .data/runs until Convex URL is set",
      ),
    );

    return (await patchRun(run.id, { status: "completed" }))!;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Run failed";
    await appendEvent(run.id, ev("error", "system", "error", message));
    return (await patchRun(run.id, { status: "failed", error: message }))!;
  }
}
