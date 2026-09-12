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
      title: "Founder time tax",
      why: `${brief.name} attacks hours wasted on repetitive launch chores.`,
      source: "mock",
    },
    {
      title: "Proof over polish",
      why: "Buyers want a concrete week of content, not another strategy PDF.",
      source: "mock",
    },
    {
      title: "UGC native",
      why: "Short-form hooks beat brand ads for early traction.",
      source: "mock",
    },
  ];

  return {
    summary: `For founders promoting ${brief.name} themselves: skip polished brand ads. Film raw founder UGC that shows the product loop, pain → fix, and a clear CTA.`,
    trends: [
      {
        title: "Founder-as-creator beats brand ads",
        insight:
          "Audiences trust a founder on camera more than a studio spot — especially for early products.",
        source: "mock",
      },
      {
        title: "Problem-first hooks",
        insight:
          "Top short-form promo opens on a specific buyer pain in 2 seconds, then shows your product solving it.",
        source: "mock",
      },
      {
        title: "Screen-record proof",
        insight:
          "Founders who screen-record the real workflow get more saves than talking-head-only pitches.",
        source: "mock",
      },
    ],
    recommendations: [
      {
        format: "Founder talking-head + screen record (30–45s)",
        platform: "tiktok / ig-reels",
        why: "You (the founder) are the ad — face for trust, product for proof.",
        hookIdea: `I built ${brief.name} because I was tired of [pain]. Here's the 20-second fix.`,
        priority: "high",
      },
      {
        format: "3-post teach + soft CTA",
        platform: "x / linkedin",
        why: "Founders win distribution by teaching, then pitching their product.",
        hookIdea: `3 mistakes I made before ${brief.name} — and what I ship instead.`,
        priority: "high",
      },
      {
        format: "Before/after split",
        platform: "ig-reels",
        why: "Simple visual promo founders can film on a phone.",
        hookIdea: "Left: chaos. Right: same job with our product.",
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
  const query = `Founder-led UGC and organic promo angles for advertising "${brief.name}" (${brief.oneLiner}) to ${
    icp || brief.audience || "their ideal customers"
  }. Focus on content the product's founder can film themselves — not agency ads.`;

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
  const query = `A founder wants to advertise their own product "${brief.name}" (${brief.oneLiner}) to ${
    icp || brief.audience || "their ideal customers"
  } with no marketing team. What short-form UGC and organic social trends work right now for founder-led product promotion? Recommend formats, platforms, and hook ideas they can film themselves over the next 7 days.`;

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
        "Audience is founders promoting THEIR OWN product (self-serve marketing / organic ads). Prefer actionable short-form UGC they can create alone. Avoid agency/brand-campaign advice. Be specific about formats and platforms.",
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

/** @deprecated prefer researchTrends — kept for callers that only need angles */
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
