import type {
  Angle,
  Campaign,
  Goal,
  ProductBrief,
  Script,
  TrendResearch,
} from "../types";
import { CampaignSchema, ScriptSchema } from "../types";
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
          ? `I keep putting off posting about ${brief.name}. Not this week.`
          : `Day ${day}: ${angle}, on camera, no theory.`,
      cta:
        goal === "waitlist"
          ? "Jump on the waitlist"
          : "Try it with your own URL",
      kpi: day % 2 === 0 ? "saves" : "click-through",
    };
  });

  return {
    positioning: `${brief.name} gets you a week of posts you can film yourself. ${brief.oneLiner}`,
    week,
    scripts: [
      {
        dayRef: 1,
        language: "en",
        hookText: `I built ${brief.name}. Nobody else was going to advertise it for me.`,
        runtimeSec: 22,
        beats: [
          {
            t: 0,
            visual: "Selfie at a messy desk",
            vo: `I built ${brief.name}. Still had to push it myself.`,
            onScreen: "No marketing hire",
          },
          {
            t: 6,
            visual: "Screen share of the product",
            vo: "So I filmed the loop: problem, fix, ask.",
            onScreen: "I am the ad",
          },
          {
            t: 12,
            visual: "Seven day cards on a board",
            vo: "Now I've got a week of hooks I can actually post.",
            onScreen: "7 days ready",
          },
          {
            t: 18,
            visual: "Point at CTA",
            vo: week[0].cta,
            onScreen: week[0].cta,
          },
        ],
        cta: week[0].cta,
      },
      {
        dayRef: 3,
        language: "en",
        hookText: `Agencies wanted weeks. I needed people trying ${brief.name} now.`,
        runtimeSec: 20,
        beats: [
          {
            t: 0,
            visual: "Split screen: agency vs phone",
            vo: "Their timeline versus mine.",
            onScreen: "Weeks vs today",
          },
          {
            t: 7,
            visual: "Phone filming a short clip",
            vo: "Three scripts. Phone camera. Done.",
            onScreen: "Shoot tonight",
          },
          {
            t: 14,
            visual: "CTA card",
            vo: week[0].cta,
            onScreen: week[0].cta,
          },
        ],
        cta: week[0].cta,
      },
      {
        dayRef: 5,
        language: "en",
        hookText: `I have a product. No marketing team. I advertise ${brief.name} myself.`,
        runtimeSec: 21,
        beats: [
          {
            t: 0,
            visual: "Balcony selfie",
            vo: "I have a product. I do not have a marketing team.",
            onScreen: "Just me",
          },
          {
            t: 7,
            visual: "Product screen recording",
            vo: "I film it myself: problem, fix, ask.",
            onScreen: "I film this",
          },
          {
            t: 14,
            visual: "Plan on a whiteboard",
            vo: "Seven days. Ready to post.",
            onScreen: "7 days",
          },
        ],
        cta: "Try it with your own URL",
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
      let language = asString(pick(s, ["language", "lang"]), "en")
        .toLowerCase()
        .slice(0, 2);
      if (language !== "sr" && language !== "en") language = "en";
      language = "en";

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

  // English-only board copy
  for (const script of scripts) {
    script.language = "en";
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

  const system = `You write promo plans for founders who sell their own product and have no marketing team.
Sound like a clear-headed builder, not a brand agency.
Never use em dashes or en dashes in any string. Use commas, periods, or colons instead.
No buzzwords like unlock, elevate, leverage, seamless, cutting-edge, delve, game-changer.
Write hooks and scripts in first person so the founder can say them on camera.
Return ONLY JSON with these top-level keys:
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
      "language": "en",
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
- Exactly 7 week days (1..7).
- Exactly 3 scripts. Every language must be "en". Write every spoken line in English.
- Use the Exa research when it helps.
- Every day should push the product toward the goal.
- JSON only. No markdown.`;

  const user = JSON.stringify({
    role: "founder_promoting_own_product",
    product: opts.brief,
    sellTo: opts.icp,
    goal: opts.goal,
    angles: opts.angles,
    trendResearch: opts.research
      ? {
          summary: opts.research.summary,
          trends: opts.research.trends,
          contentRecommendations: opts.research.recommendations,
        }
      : undefined,
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

const PRESET_COPY: Record<
  import("../types").RefinePreset,
  string
> = {
  sharper_hooks:
    "Sharpen every hook. First line must stop the scroll in under 2 seconds. Cut soft openers.",
  founder_on_camera:
    "Bias every day and script toward founder-on-camera UGC. Talking head first, then proof on screen.",
  louder_cta:
    "Make CTAs clearer and more direct. One ask per day. No vague soft closes.",
  shorter_scripts:
    "Tighten scripts to about 15 to 20 seconds. Fewer beats. Same punch.",
};

function applyPresetLocally(
  campaign: Campaign,
  preset: import("../types").RefinePreset,
  brief: ProductBrief,
): Campaign {
  const next: Campaign = structuredClone(campaign);
  if (preset === "sharper_hooks") {
    for (const d of next.week) {
      d.hook = d.hook.replace(/^(So |Well |Hey[, ]+)/i, "").trim();
      if (!d.hook.endsWith(".")) d.hook = `${d.hook}.`;
      if (d.hook.length > 90) d.hook = d.hook.slice(0, 87).trim() + "…";
    }
    for (const s of next.scripts) {
      s.hookText = s.hookText.replace(/^(So |Well |Hey[, ]+)/i, "").trim();
      if (s.beats[0]) {
        s.beats[0].vo = s.hookText;
      }
    }
  }
  if (preset === "founder_on_camera") {
    for (const d of next.week) {
      d.format = "UGC talking-head + screen proof";
      d.angle = `${d.angle} (you on camera)`;
    }
    for (const s of next.scripts) {
      if (s.beats[0]) s.beats[0].visual = "Selfie phone camera, founder face";
    }
  }
  if (preset === "louder_cta") {
    for (const d of next.week) {
      d.cta = d.cta.includes("Try")
        ? d.cta
        : `Try ${brief.name} today. Link in bio.`;
    }
    for (const s of next.scripts) {
      s.cta = `Try ${brief.name} today.`;
      if (s.beats.length) {
        s.beats[s.beats.length - 1].vo = s.cta;
        s.beats[s.beats.length - 1].onScreen = s.cta;
      }
    }
  }
  if (preset === "shorter_scripts") {
    for (const s of next.scripts) {
      s.beats = s.beats.slice(0, 3);
      s.runtimeSec = Math.min(s.runtimeSec, 18);
    }
  }
  next.positioning = `${next.positioning} Refined: ${PRESET_COPY[preset].slice(0, 60)}`;
  for (const s of next.scripts) s.language = "en";
  return next;
}

async function grokCampaignPass(opts: {
  systemExtra: string;
  userPayload: unknown;
  angles: Angle[];
  fallback: Campaign;
  label: string;
}): Promise<{ campaign: Campaign; mode: "live" | "mock"; log: string }> {
  const mode = providerMode().xai;
  if (mode === "mock") {
    return {
      campaign: opts.fallback,
      mode,
      log: `XAI_API_KEY missing → local ${opts.label}.`,
    };
  }

  const system = `You refine promo plans for founders selling their own product.
Never use em dashes or en dashes. No agency buzzwords.
Return ONLY JSON with keys positioning, week (exactly 7 days), scripts (exactly 3, language always "en").
${opts.systemExtra}
JSON only.`;

  const primary = process.env.XAI_MODEL || "grok-4.3";
  const first = await callGrok({
    model: primary,
    system,
    user: JSON.stringify(opts.userPayload),
  });
  if (first.ok) {
    const parsed = parseCampaign(first.content, opts.angles);
    if (parsed) {
      return {
        campaign: parsed,
        mode: "live",
        log: `Grok ${opts.label} (${primary})`,
      };
    }
  }

  return {
    campaign: opts.fallback,
    mode: "mock",
    log: `xAI ${opts.label} failed → local fallback.`,
  };
}

export async function refineCampaign(opts: {
  brief: ProductBrief;
  campaign: Campaign;
  angles: Angle[];
  preset: import("../types").RefinePreset;
  goal: Goal;
}): Promise<{ campaign: Campaign; mode: "live" | "mock"; log: string }> {
  const local = applyPresetLocally(opts.campaign, opts.preset, opts.brief);
  return grokCampaignPass({
    systemExtra: PRESET_COPY[opts.preset],
    userPayload: {
      task: "refine_existing_campaign",
      preset: opts.preset,
      instruction: PRESET_COPY[opts.preset],
      product: opts.brief,
      goal: opts.goal,
      currentCampaign: opts.campaign,
    },
    angles: opts.angles,
    fallback: local,
    label: `refine:${opts.preset}`,
  });
}

export async function generateWeek2(opts: {
  brief: ProductBrief;
  campaign: Campaign;
  angles: Angle[];
  research?: TrendResearch;
  goal: Goal;
  weekNumber: number;
}): Promise<{ campaign: Campaign; mode: "live" | "mock"; log: string }> {
  const nextWeek = opts.weekNumber;
  const local = structuredClone(opts.campaign);
  const startDay = (nextWeek - 1) * 7 + 1;
  local.week = local.week.map((d, i) => ({
    ...d,
    day: startDay + i,
    hook: `Week ${nextWeek}, day ${i + 1}: ${d.angle}. New proof, same product.`,
  }));
  local.scripts = local.scripts.map((s, i) => ({
    ...s,
    dayRef: startDay + (i === 0 ? 0 : i === 1 ? 2 : 4),
    hookText: `Week ${nextWeek}. ${s.hookText}`,
    language: "en" as const,
  }));
  local.positioning = `${opts.brief.name} week ${nextWeek}: double down on what you can film this week. ${opts.brief.oneLiner}`;

  return grokCampaignPass({
    systemExtra: `This is week ${nextWeek} of the same product campaign. Days should be numbered ${startDay} to ${startDay + 6}. Do not repeat week 1 hooks. Escalate proof, objections, and social proof. Exactly 3 English scripts with dayRef inside that range.`,
    userPayload: {
      task: "generate_next_week",
      weekNumber: nextWeek,
      dayStart: startDay,
      product: opts.brief,
      goal: opts.goal,
      previousCampaign: opts.campaign,
      trendResearch: opts.research,
      angles: opts.angles,
    },
    angles: opts.angles,
    fallback: local,
    label: `week${nextWeek}`,
  });
}

function parseScript(content: string, fallbackDay: number): Script | null {
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    const raw = JSON.parse(cleaned) as unknown;
    const obj =
      raw && typeof raw === "object" && "script" in raw
        ? (raw as { script: unknown }).script
        : raw;
    const normalized = normalizeCampaign(
      {
        positioning: "x",
        week: [
          {
            day: fallbackDay,
            platform: "tiktok",
            angle: "a",
            format: "UGC",
            hook: "h",
            cta: "c",
            kpi: "saves",
          },
        ],
        scripts: [obj],
      },
      [],
    );
    if (!normalized) return null;
    const parsed = CampaignSchema.safeParse(normalized);
    const script = parsed.success ? parsed.data.scripts[0] : null;
    if (!script) return null;
    script.language = "en";
    script.dayRef = fallbackDay;
    return ScriptSchema.parse(script);
  } catch {
    return null;
  }
}

export async function rewriteScript(opts: {
  brief: ProductBrief;
  script: Script;
  instruction: string;
}): Promise<{ script: Script; mode: "live" | "mock"; log: string }> {
  const mode = providerMode().xai;
  const local: Script = {
    ...structuredClone(opts.script),
    language: "en",
    hookText: `${opts.instruction.replace(/\.$/, "")}. ${opts.script.hookText}`.slice(
      0,
      160,
    ),
  };
  if (local.beats[0]) local.beats[0].vo = local.hookText;

  if (mode === "mock") {
    return {
      script: local,
      mode,
      log: "XAI_API_KEY missing → local script rewrite.",
    };
  }

  const system = `Rewrite one UGC script for a founder filming their own product.
Return ONLY JSON: either the script object, or { "script": { ... } }.
Fields: dayRef, language ("en"), hookText, runtimeSec, beats[{t,visual,vo,onScreen}], cta.
Never use em dashes or en dashes. English only. JSON only.`;

  const primary = process.env.XAI_MODEL || "grok-4.3";
  const first = await callGrok({
    model: primary,
    system,
    user: JSON.stringify({
      product: opts.brief,
      instruction: opts.instruction,
      currentScript: opts.script,
    }),
  });
  if (first.ok) {
    const parsed = parseScript(first.content, opts.script.dayRef);
    if (parsed) {
      return {
        script: parsed,
        mode: "live",
        log: `Grok rewrote Day ${opts.script.dayRef} script`,
      };
    }
  }

  return {
    script: local,
    mode: "mock",
    log: "xAI script rewrite failed → local tweak.",
  };
}

export async function adaptCampaignFromResults(opts: {
  brief: ProductBrief;
  campaign: Campaign;
  angles: Angle[];
  goal: Goal;
  notes?: string;
  signals: import("../types").ResultSignal[];
}): Promise<{ campaign: Campaign; mode: "live" | "mock"; log: string }> {
  const local = structuredClone(opts.campaign);
  const note = (opts.notes || "").trim();
  if (note) {
    local.positioning = `${local.positioning} Adapted from results: ${note.slice(0, 120)}`;
    for (const d of local.week) {
      d.hook = `Based on what worked: ${d.hook}`;
    }
  }

  return grokCampaignPass({
    systemExtra: `Adapt the next 7-day plan using campaign results the founder shared.
Double down on hooks/formats that worked. Drop what flopped.
If scrape excerpts are thin (common on Instagram/TikTok), lean on the founder's notes.
Keep days 1..7. Exactly 3 English scripts.`,
    userPayload: {
      task: "adapt_from_results",
      product: opts.brief,
      goal: opts.goal,
      founderNotes: opts.notes,
      resultSignals: opts.signals,
      currentCampaign: opts.campaign,
      angles: opts.angles,
      scrapeCaveat:
        "Social networks often block scrapers. Treat missing scrape data as normal.",
    },
    angles: opts.angles,
    fallback: local,
    label: "adapt_results",
  });
}
