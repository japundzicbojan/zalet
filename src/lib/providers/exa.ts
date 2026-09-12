import type {
  Angle,
  ContentRec,
  ProductBrief,
  TrendResearch,
  TrendSignal,
} from "../types";
import { providerMode } from "../env";

function mockResearch(brief: ProductBrief): TrendResearch {
  const angles: Angle[] = [
    {
      title: "No time for a content machine",
      why: `${brief.name} is for people who would rather ship than babysit a content calendar.`,
      source: "mock",
    },
    {
      title: "Show the work",
      why: "People click when they see the product doing something real, not a slogan.",
      source: "mock",
    },
    {
      title: "Phone-camera energy",
      why: "Rough founder clips usually beat slick brand ads early on.",
      source: "mock",
    },
  ];

  return {
    summary: `If you're promoting ${brief.name} yourself, keep it simple: film the painful moment, show the fix in the product, end with one clear ask.`,
    trends: [
      {
        title: "Founder on camera still wins",
        insight:
          "People believe a founder talking from their desk more than a polished studio spot, especially before you're famous.",
        source: "mock",
      },
      {
        title: "Open on the headache",
        insight:
          "The clips that travel start with a concrete pain in the first two seconds, then cut to the product.",
        source: "mock",
      },
      {
        title: "Screen recordings get saved",
        insight:
          "A quick walkthrough of the real workflow gets more saves than a talking head with nothing on screen.",
        source: "mock",
      },
    ],
    recommendations: [
      {
        format: "You on camera, then screen share (about 40s)",
        platform: "tiktok / ig-reels",
        why: "Your face builds trust. The screen proves the product.",
        hookIdea: `I built ${brief.name} because I was sick of [pain]. Watch this 20-second fix.`,
        priority: "high",
      },
      {
        format: "Three short posts, then a soft ask",
        platform: "x / linkedin",
        why: "Teach something useful first. Pitch at the end.",
        hookIdea: `Three mistakes I made before ${brief.name}, and what I do now.`,
        priority: "high",
      },
      {
        format: "Before / after split",
        platform: "ig-reels",
        why: "Easy to shoot on a phone. Clear without a script rewrite.",
        hookIdea: "Left: the mess. Right: same job with our product.",
        priority: "medium",
      },
    ],
    angles,
  };
}

const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "trends", "recommendations"],
  properties: {
    summary: { type: "string" },
    trends: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "insight"],
        properties: {
          title: { type: "string" },
          insight: { type: "string" },
        },
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["format", "platform", "why", "hookIdea", "priority"],
        properties: {
          format: { type: "string" },
          platform: { type: "string" },
          why: { type: "string" },
          hookIdea: { type: "string" },
          priority: { type: "string" },
        },
      },
    },
  },
} as const;

function asTrends(raw: unknown): TrendSignal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => {
      const o = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
      return {
        title: String(o.title || "Trend"),
        insight: String(o.insight || o.why || ""),
        source: o.source ? String(o.source) : undefined,
      };
    })
    .filter((t) => t.insight);
}

function asRecs(raw: unknown): ContentRec[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
      return {
        format: String(o.format || "UGC talking-head"),
        platform: String(o.platform || "tiktok"),
        why: String(o.why || ""),
        hookIdea: String(o.hookIdea || o.hook || ""),
        priority: String(o.priority || "medium"),
      };
    })
    .filter((r) => r.why || r.hookIdea);
}

async function searchAngles(
  brief: ProductBrief,
  icp?: string,
): Promise<Angle[]> {
  const query = `Organic promo ideas for a founder advertising "${brief.name}" (${brief.oneLiner}) to ${
    icp || brief.audience || "their buyers"
  }. Prefer clips the founder can film alone on a phone, not agency ads.`;

  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": process.env.EXA_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      type: "neural",
      numResults: 5,
      contents: { text: { maxCharacters: 400 } },
    }),
  });

  if (!res.ok) return mockResearch(brief).angles;

  const data = (await res.json()) as {
    results?: { title?: string; url?: string; text?: string }[];
  };

  return (
    data.results?.slice(0, 5).map((r) => ({
      title: r.title || "Market signal",
      why: (r.text || "Relevant competitor/content signal.").slice(0, 240),
      source: r.url,
    })) || mockResearch(brief).angles
  );
}

async function answerTrends(
  brief: ProductBrief,
  icp?: string,
): Promise<{
  summary: string;
  trends: TrendSignal[];
  recommendations: ContentRec[];
  citations: { title?: string; url?: string }[];
} | null> {
  const query = `I'm a founder with no marketing team. I need to promote "${brief.name}" (${brief.oneLiner}) to ${
    icp || brief.audience || "my buyers"
  }. What short-form posts are working right now that I can film myself this week? Give formats, platforms, and hook lines.`;

  const res = await fetch("https://api.exa.ai/answer", {
    method: "POST",
    headers: {
      "x-api-key": process.env.EXA_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      text: true,
      model: "exa",
      systemPrompt:
        "Write like a sharp friend who ships products. No em dashes. No marketing jargon. Concrete formats and platforms only. Skip agency advice.",
      outputSchema,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    answer?:
      | string
      | {
          summary?: string;
          trends?: unknown;
          recommendations?: unknown;
        };
    citations?: { title?: string; url?: string }[];
  };

  const answer = data.answer;
  if (!answer || typeof answer === "string") {
    return {
      summary:
        typeof answer === "string"
          ? answer.slice(0, 500)
          : "Trend research completed.",
      trends: (data.citations || []).slice(0, 4).map((c) => ({
        title: c.title || "Signal",
        insight: "Cited market source for current content patterns.",
        source: c.url,
      })),
      recommendations: mockResearch(brief).recommendations,
      citations: data.citations || [],
    };
  }

  const trends = asTrends(answer.trends).map((t, i) => ({
    ...t,
    source: t.source || data.citations?.[i]?.url,
  }));

  return {
    summary: String(answer.summary || "Trend research completed."),
    trends,
    recommendations: asRecs(answer.recommendations),
    citations: data.citations || [],
  };
}

/** @deprecated prefer researchTrends  -  kept for callers that only need angles */
export async function researchAngles(
  brief: ProductBrief,
  icp?: string,
): Promise<{ angles: Angle[]; mode: "live" | "mock"; log: string }> {
  const full = await researchTrends(brief, icp);
  return { angles: full.research.angles, mode: full.mode, log: full.log };
}

export async function researchTrends(
  brief: ProductBrief,
  icp?: string,
): Promise<{ research: TrendResearch; mode: "live" | "mock"; log: string }> {
  const mode = providerMode().exa;
  if (mode === "mock") {
    return {
      research: mockResearch(brief),
      mode,
      log: "EXA_API_KEY missing → mock trend research + content recommendations.",
    };
  }

  try {
    const [answered, angles] = await Promise.all([
      answerTrends(brief, icp),
      searchAngles(brief, icp),
    ]);

    if (!answered) {
      const fallback = mockResearch(brief);
      return {
        research: { ...fallback, angles },
        mode: "mock",
        log: "Exa /answer failed → mock trends, live search angles kept if available.",
      };
    }

    const research: TrendResearch = {
      summary: answered.summary,
      trends:
        answered.trends.length > 0
          ? answered.trends
          : mockResearch(brief).trends,
      recommendations:
        answered.recommendations.length > 0
          ? answered.recommendations.slice(0, 5)
          : mockResearch(brief).recommendations,
      angles: angles.length ? angles : mockResearch(brief).angles,
    };

    return {
      research,
      mode: "live",
      log: `Exa trends: ${research.trends.length} signals, ${research.recommendations.length} content picks, ${research.angles.length} angles`,
    };
  } catch (err) {
    return {
      research: mockResearch(brief),
      mode: "mock",
      log: `Exa error (${err instanceof Error ? err.message : "unknown"}) → mock.`,
    };
  }
}
