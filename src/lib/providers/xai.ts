import type {
  Angle,
  Campaign,
  Goal,
  ProductBrief,
  TrendResearch,
} from "../types";
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

const PLATFORM = new Set(["tiktok", "ig-reels", "x", "linkedin"]);

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return fallback;
}

function pick<T = unknown>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

function normalizeCampaign(
  raw: unknown,
  angles: Angle[],
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const nested =
    (root.campaign as Record<string, unknown> | undefined) ||
    (root.data as Record<string, unknown> | undefined) ||
    root;

  const weekRaw =
    pick<unknown[]>(nested, ["week", "days", "plan", "calendar", "schedule"]) ||
    [];
  const scriptsRaw =
    pick<unknown[]>(nested, ["scripts", "ugcScripts", "videos"]) || [];

  const week = (Array.isArray(weekRaw) ? weekRaw : []).slice(0, 7).map((item, i) => {
    const d = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    let platform = asString(
      pick(d, ["platform", "channel", "network"]),
      "tiktok",
    ).toLowerCase();
    if (platform === "instagram" || platform === "reels" || platform === "ig") {
      platform = "ig-reels";
    }
    if (platform === "twitter" || platform === "twitter/x") platform = "x";
    if (!PLATFORM.has(platform)) platform = "tiktok";

    return {
      day: asNumber(pick(d, ["day", "dayNumber", "n"]), i + 1),
      platform,
      angle: asString(pick(d, ["angle", "theme", "topic"]), angles[i % angles.length]?.title || "Founder pain"),
      format: asString(pick(d, ["format", "type"]), "UGC talking-head"),
      hook: asString(pick(d, ["hook", "hookText", "headline", "title"])),
      cta: asString(pick(d, ["cta", "callToAction", "call_to_action"]), "Try it"),
      kpi: asString(pick(d, ["kpi", "metric"]), "saves"),
    };
  });

  const scripts = (Array.isArray(scriptsRaw) ? scriptsRaw : []).slice(0, 3).map(
    (item, i) => {
      const s = (item && typeof item === "object" ? item : {}) as Record<
        string,
        unknown
      >;
      let language = asString(pick(s, ["language", "lang"]), i === 2 ? "sr" : "en")
        .toLowerCase()
        .slice(0, 2);
      if (language !== "sr" && language !== "en") language = i === 2 ? "sr" : "en";

      const beatsRaw = pick<unknown[]>(s, ["beats", "scenes", "shots"]) || [];
      const beats = (Array.isArray(beatsRaw) ? beatsRaw : []).map((b, bi) => {
        const beat = (b && typeof b === "object" ? b : {}) as Record<
          string,
          unknown
        >;
        return {
          t: asNumber(pick(beat, ["t", "time", "sec", "second"]), bi * 6),
          visual: asString(pick(beat, ["visual", "shot", "scene"]), "Founder selfie"),
          vo: asString(pick(beat, ["vo", "voiceover", "dialogue", "line"])),
          onScreen: asString(
            pick(beat, ["onScreen", "onscreen", "text", "caption"]),
            "",
          ),
        };
      });

      return {
        dayRef: asNumber(pick(s, ["dayRef", "day", "dayNumber"]), i === 0 ? 1 : i === 1 ? 3 : 5),
        language,
        hookText: asString(pick(s, ["hookText", "hook", "opening", "title"])),
        runtimeSec: asNumber(pick(s, ["runtimeSec", "runtime", "duration", "seconds"]), 20),
        beats:
          beats.length > 0
            ? beats
            : [
                {
                  t: 0,
                  visual: "Founder selfie",
                  vo: asString(pick(s, ["hookText", "hook"]), "Hook"),
                  onScreen: "Hook",
                },
              ],
        cta: asString(pick(s, ["cta", "callToAction"]), "Try it"),
      };
    },
  );

  // Ensure one Serbian script
  if (scripts.length && !scripts.some((s) => s.language === "sr")) {
    scripts[scripts.length - 1].language = "sr";
  }

  return {
    positioning: asString(
      pick(nested, ["positioning", "position", "thesis", "summary", "tagline"]),
      "Founder-led UGC for the first week after launch.",
    ),
    week,
    scripts,
    angles,
  };
}

function parseCampaign(content: string, angles: Angle[]): Campaign | null {
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    const raw = JSON.parse(cleaned) as unknown;
    const normalized = normalizeCampaign(raw, angles);
    if (!normalized) return null;
    return CampaignSchema.parse(normalized);
  } catch {
    return null;
  }
}

async function callGrok(opts: {
  model: string;
  system: string;
  user: string;
}): Promise<{ ok: true; content: string } | { ok: false; status: number; text: string }> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, text: await res.text() };
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { ok: true, content: data.choices?.[0]?.message?.content || "{}" };
}

export async function generateCampaign(opts: {
  brief: ProductBrief;
  angles: Angle[];
  research?: TrendResearch;
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

  const system = `You are a sharp founder marketing strategist for early-stage products.
You MUST ground the 7-day plan in the provided Exa trend research and content recommendations.
Prefer the recommended formats/platforms/hooks when they fit the product.
Return ONLY a JSON object with EXACTLY these top-level keys:
{
  "positioning": string,
  "week": [
    {
      "day": 1-7,
      "platform": "tiktok" | "ig-reels" | "x" | "linkedin",
      "angle": string,
      "format": string,
      "hook": string,
      "cta": string,
      "kpi": string
    }
  ],
  "scripts": [
    {
      "dayRef": number,
      "language": "en" | "sr",
      "hookText": string,
      "runtimeSec": number,
      "beats": [
        { "t": number, "visual": string, "vo": string, "onScreen": string }
      ],
      "cta": string
    }
  ]
}
Rules:
- Exactly 7 items in week (days 1..7).
- Exactly 3 scripts; one MUST have language "sr" (Serbian), two "en".
- Map at least 3 week days to Exa content recommendations (format + platform + hook).
- No markdown, no commentary, JSON only.`;

  const user = JSON.stringify({
    product: opts.brief,
    angles: opts.angles,
    trendResearch: opts.research
      ? {
          summary: opts.research.summary,
          trends: opts.research.trends,
          contentRecommendations: opts.research.recommendations,
        }
      : undefined,
    icp: opts.icp,
    goal: opts.goal,
  });

  const primary = process.env.XAI_MODEL || "grok-4.3";
  const first = await callGrok({ model: primary, system, user });
  if (first.ok) {
    const parsed = parseCampaign(first.content, opts.angles);
    if (parsed) {
      return {
        campaign: parsed,
        mode: "live",
        log: `Grok (${primary}) generated strategy + scripts`,
      };
    }
  }

  if (!process.env.XAI_MODEL) {
    const retry = await callGrok({ model: "grok-4.6", system, user });
    if (retry.ok) {
      const parsed = parseCampaign(retry.content, opts.angles);
      if (parsed) {
        return {
          campaign: parsed,
          mode: "live",
          log: "Grok-4.6 (xAI) generated strategy + scripts",
        };
      }
    }
  }

  const failDetail = first.ok
    ? `JSON shape mismatch: ${first.content.slice(0, 160)}`
    : `${first.status}: ${first.text.slice(0, 160)}`;

  return {
    campaign: mockCampaign(opts.brief, opts.angles, opts.goal),
    mode: "mock",
    log: `xAI failed (${failDetail}) → mock.`,
  };
}
