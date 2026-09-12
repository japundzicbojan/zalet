import { nanoid } from "nanoid";
import { scrapePublicPost } from "./providers/firecrawl";
import { generateStillForScript } from "./providers/fal";
import { packInDaytona } from "./providers/daytona";
import {
  adaptCampaignFromResults,
  generateWeek2,
  refineCampaign,
  rewriteScript,
} from "./providers/xai";
import { appendEvent, getRun, patchRun } from "./store";
import type { IterateAction, Run, TraceEvent } from "./types";

const busy = new Set<string>();

function ev(
  phase: string,
  tool: TraceEvent["tool"],
  level: TraceEvent["level"],
  msg: string,
): TraceEvent {
  return { id: nanoid(10), ts: Date.now(), phase, tool, level, msg };
}

async function repack(run: Run): Promise<Run> {
  if (!run.product || !run.campaign) return run;
  await appendEvent(
    run.id,
    ev("pack", "daytona", "cmd", "Repack campaign after iterate"),
  );
  const packed = await packInDaytona({
    runId: run.id,
    brief: run.product,
    campaign: run.campaign,
    creatives: run.creatives || [],
  });
  for (const line of packed.logs) {
    await appendEvent(
      run.id,
      ev("pack", "daytona", line.startsWith("$") ? "cmd" : "stdout", line),
    );
  }
  return (
    (await patchRun(run.id, {
      daytona: {
        sandboxId: packed.sandboxId,
        previewUrl: packed.previewUrl,
        zipPath: packed.zipPath,
        zipReady: packed.zipReady,
        mock: packed.mock,
      },
      providers: {
        ...run.providers,
        daytona: packed.mode,
      },
    })) || run
  );
}

export async function iterateRun(
  runId: string,
  action: IterateAction,
): Promise<Run> {
  if (busy.has(runId)) {
    throw new Error("This board is already iterating. Wait a moment.");
  }

  const existing = await getRun(runId);
  if (!existing) throw new Error("Run not found");
  if (existing.status !== "completed") {
    throw new Error("Finish the first campaign before iterating.");
  }
  if (!existing.product || !existing.campaign) {
    throw new Error("Board is missing product or campaign data.");
  }

  busy.add(runId);
  try {
    const angles =
      existing.campaign.angles?.length
        ? existing.campaign.angles
        : existing.research?.angles || [];
    const goal = existing.input.goal ?? "launch";

    if (action.action === "refine") {
      await appendEvent(
        runId,
        ev("iterate", "xai", "cmd", `Refine: ${action.preset}`),
      );
      const result = await refineCampaign({
        brief: existing.product,
        campaign: existing.campaign,
        angles,
        preset: action.preset,
        goal,
      });
      const updated = (await patchRun(runId, {
        campaign: result.campaign,
        providers: {
          ...existing.providers,
          xai: result.mode === "live" ? "live" : existing.providers.xai,
        },
        iteration: {
          weekNumber: existing.iteration?.weekNumber ?? 1,
          lastAction: `refine:${action.preset}`,
          resultsNotes: existing.iteration?.resultsNotes,
          resultSignals: existing.iteration?.resultSignals,
        },
      }))!;
      await appendEvent(
        runId,
        ev(
          "iterate",
          "xai",
          result.mode === "live" ? "success" : "info",
          result.log,
        ),
      );
      return repack(updated);
    }

    if (action.action === "week2") {
      const weekNumber = (existing.iteration?.weekNumber ?? 1) + 1;
      await appendEvent(
        runId,
        ev("iterate", "xai", "cmd", `Generate week ${weekNumber}`),
      );
      const result = await generateWeek2({
        brief: existing.product,
        campaign: existing.campaign,
        angles,
        research: existing.research,
        goal,
        weekNumber,
      });
      const updated = (await patchRun(runId, {
        campaign: result.campaign,
        providers: {
          ...existing.providers,
          xai: result.mode === "live" ? "live" : existing.providers.xai,
        },
        iteration: {
          weekNumber,
          lastAction: `week${weekNumber}`,
          resultsNotes: existing.iteration?.resultsNotes,
          resultSignals: existing.iteration?.resultSignals,
        },
      }))!;
      await appendEvent(
        runId,
        ev(
          "iterate",
          "xai",
          result.mode === "live" ? "success" : "info",
          result.log,
        ),
      );
      return repack(updated);
    }

    if (action.action === "rewrite_script") {
      const scripts = existing.campaign.scripts;
      const idx = scripts.findIndex((s) => s.dayRef === action.dayRef);
      if (idx < 0) throw new Error(`No script for day ${action.dayRef}`);
      await appendEvent(
        runId,
        ev(
          "iterate",
          "xai",
          "cmd",
          `Rewrite Day ${action.dayRef}: ${action.instruction.slice(0, 80)}`,
        ),
      );
      const result = await rewriteScript({
        brief: existing.product,
        script: scripts[idx],
        instruction: action.instruction,
      });
      const nextScripts = [...scripts];
      nextScripts[idx] = result.script;
      const updated = (await patchRun(runId, {
        campaign: { ...existing.campaign, scripts: nextScripts },
        providers: {
          ...existing.providers,
          xai: result.mode === "live" ? "live" : existing.providers.xai,
        },
        iteration: {
          weekNumber: existing.iteration?.weekNumber ?? 1,
          lastAction: `rewrite_script:${action.dayRef}`,
          resultsNotes: existing.iteration?.resultsNotes,
          resultSignals: existing.iteration?.resultSignals,
        },
      }))!;
      await appendEvent(
        runId,
        ev(
          "iterate",
          "xai",
          result.mode === "live" ? "success" : "info",
          result.log,
        ),
      );
      return repack(updated);
    }

    if (action.action === "new_still") {
      const scripts = existing.campaign.scripts;
      let script = scripts[0];
      if (typeof action.scriptIndex === "number") {
        script = scripts[action.scriptIndex] || script;
      } else if (typeof action.dayRef === "number") {
        script = scripts.find((s) => s.dayRef === action.dayRef) || script;
      }
      if (!script) throw new Error("No script to base a still on");

      await appendEvent(
        runId,
        ev("iterate", "fal", "cmd", `New still for Day ${script.dayRef}`),
      );
      const result = await generateStillForScript({
        brief: existing.product,
        hookText: script.hookText,
      });
      const creatives = [...(existing.creatives || []), result.creative];
      const updated = (await patchRun(runId, {
        creatives,
        providers: {
          ...existing.providers,
          fal: result.mode === "live" ? "live" : existing.providers.fal,
        },
        iteration: {
          weekNumber: existing.iteration?.weekNumber ?? 1,
          lastAction: `new_still:${script.dayRef}`,
          resultsNotes: existing.iteration?.resultsNotes,
          resultSignals: existing.iteration?.resultSignals,
        },
      }))!;
      await appendEvent(
        runId,
        ev(
          "iterate",
          "fal",
          result.mode === "live" ? "success" : "info",
          result.log,
        ),
      );
      return repack(updated);
    }

    // adapt_results
    const urls = action.postUrls || [];
    if (!urls.length && !(action.notes || "").trim()) {
      throw new Error("Add post URLs and/or notes about what worked.");
    }

    await appendEvent(
      runId,
      ev(
        "iterate",
        "firecrawl",
        "cmd",
        urls.length
          ? `Scrape ${urls.length} result URL(s) (social often blocks)`
          : "Adapt from founder notes only",
      ),
    );

    const signals = [];
    for (const url of urls) {
      const scraped = await scrapePublicPost(url);
      signals.push(scraped.signal);
      await appendEvent(
        runId,
        ev(
          "iterate",
          "firecrawl",
          scraped.signal.scraped ? "success" : "info",
          scraped.log,
        ),
      );
    }

    await appendEvent(
      runId,
      ev("iterate", "xai", "cmd", "Adapt next week from results"),
    );
    const result = await adaptCampaignFromResults({
      brief: existing.product,
      campaign: existing.campaign,
      angles,
      goal,
      notes: action.notes,
      signals,
    });
    const updated = (await patchRun(runId, {
      campaign: result.campaign,
      providers: {
        ...existing.providers,
        xai: result.mode === "live" ? "live" : existing.providers.xai,
      },
      iteration: {
        weekNumber: existing.iteration?.weekNumber ?? 1,
        lastAction: "adapt_results",
        resultsNotes: action.notes,
        resultSignals: signals,
      },
    }))!;
    await appendEvent(
      runId,
      ev(
        "iterate",
        "xai",
        result.mode === "live" ? "success" : "info",
        result.log,
      ),
    );
    return repack(updated);
  } finally {
    busy.delete(runId);
  }
}
