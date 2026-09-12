import type { Angle, Campaign, Goal, ProductBrief } from "../types";
import { CampaignSchema } from "../types";
import { providerMode } from "../env";

function mockCampaign(
  brief: ProductBrief,
  angles: Angle[],
  goal: Goal,
): Campaign {
  const platforms = [
    "tiktok",
    "ig-reels",
    "x",
    "linkedin",
    "tiktok",
    "ig-reels",
    "x",
  ] as const;
  const week = platforms.map((platform, i) => {
    const day = i + 1;
    const angle = angles[i % angles.length]?.title || "Founder pain";
    return {
      day,
      platform,
      angle,
      format: platform === "x" ? "thread" : "UGC talking-head",
      hook:
        day === 1
          ? `Stop guessing your first week of content for ${brief.name}.`
          : `Day ${day}: ${angle} — shown, not theorized.`,
      cta:
        goal === "waitlist"
          ? "Join the waitlist"
          : "Try it on your product URL",
      kpi: day % 2 === 0 ? "saves" : "click-through",
    };
  });

  return {
    positioning: `${brief.name} is the run-up before launch — ${brief.oneLiner}`,
    week,
    scripts: [
      {
        dayRef: 1,
        language: "en",
        hookText: week[0].hook,
        runtimeSec: 22,
        beats: [
          {
            t: 0,
            visual: "Phone selfie, messy desk",
            vo: week[0].hook,
            onScreen: "No marketing team?",
          },
          {
            t: 6,
            visual: "Screen record: paste URL",
            vo: `I dropped ${brief.name}'s URL into Zalet.`,
            onScreen: "URL → campaign",
          },
          {
            t: 12,
            visual: "Board with 7 cards",
            vo: "Got a week of hooks, scripts, and creatives.",
            onScreen: "7-day board",
          },
          {
            t: 18,
            visual: "Point to CTA",
            vo: week[0].cta,
            onScreen: week[0].cta,
          },
        ],
        cta: week[0].cta,
      },
      {
        dayRef: 3,
        language: "en",
        hookText: `Agencies charge weeks. ${brief.name} founders need today.`,
        runtimeSec: 20,
        beats: [
          {
            t: 0,
            visual: "Split: agency vs solo",
            vo: "Agency timeline vs founder timeline.",
            onScreen: "2 weeks vs 90s",
          },
          {
            t: 7,
            visual: "UGC stills grid",
            vo: "Zalet ships scripts and creatives in one pass.",
            onScreen: "Scripts + creatives",
          },
          {
            t: 14,
            visual: "CTA card",
            vo: "Paste your URL. Steal the week.",
            onScreen: "Paste URL",
          },
        ],
        cta: "Paste your URL",
      },
      {
        dayRef: 5,
        language: "sr",
        hookText: `Imam proizvod. Nemam marketing tim. ${brief.name} treba zalet.`,
        runtimeSec: 21,
        beats: [
          {
            t: 0,
            visual: "Selfie, balcony",
            vo: "Imam proizvod, nemam marketing tim.",
            onScreen: "Founder mode",
          },
          {
            t: 7,
            visual: "Trace: Firecrawl → Daytona",
            vo: "Agent istraži, napiše plan, spakuje kampanju.",
            onScreen: "Agent + Daytona",
          },
          {
            t: 14,
            visual: "Board + zip",
            vo: "Sedam dana sadržaja. Spreman za objavu.",
            onScreen: "7 dana",
          },
        ],
        cta: "Probaj sa svojim URL-om",
      },
    ],
    angles,
  };
}

export async function generateCampaign(opts: {
  brief: ProductBrief;
  angles: Angle[];
  icp?: string;
  goal: Goal;
}): Promise<{ campaign: Campaign; mode: "live" | "mock"; log: string }> {
  const mode = providerMode().xai;
  if (mode === "mock") {
    return {
      campaign: mockCampaign(opts.brief, opts.angles, opts.goal),
      mode,
      log: "XAI_API_KEY missing → mock Grok strategy/scripts.",
    };
  }

  const system = `You are a sharp founder marketing strategist. Return ONLY valid JSON. One script must be language:"sr". Platforms: tiktok|ig-reels|x|linkedin. Exactly 7 days and 3 scripts.`;
  const user = JSON.stringify({
    product: opts.brief,
    angles: opts.angles,
    icp: opts.icp,
    goal: opts.goal,
  });

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      campaign: mockCampaign(opts.brief, opts.angles, opts.goal),
      mode: "mock",
      log: `xAI failed (${res.status}): ${text.slice(0, 180)} → mock.`,
    };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    const parsed = CampaignSchema.parse({
      ...JSON.parse(content),
      angles: opts.angles,
    });
    return {
      campaign: parsed,
      mode: "live",
      log: "Grok (xAI) generated strategy + scripts",
    };
  } catch (err) {
    return {
      campaign: mockCampaign(opts.brief, opts.angles, opts.goal),
      mode: "mock",
      log: `Grok JSON invalid (${err instanceof Error ? err.message : "error"}) → mock.`,
    };
  }
}
