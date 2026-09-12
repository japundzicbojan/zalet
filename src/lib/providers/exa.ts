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
    summary: `For ${brief.name}, lean into raw founder UGC: show the before/after of the product loop, not polished brand ads.`,
    trends: [
      {
        title: "Problem-first hooks",
        insight:
          "Top short-form posts open on a specific pain in the first 2 seconds, then reveal the product.",
        source: "mock",
      },
      {
        title: "Screen-record demos",
        insight:
          "Workflow walkthroughs with voiceover outperform talking-head-only clips for tooling products.",
        source: "mock",
      },
      {
        title: "Build-in-public cadence",
        insight:
          "Weekly shipped-update clips build trust faster than one-off launch dumps.",
        source: "mock",
      },
    ],
    recommendations: [
      {
        format: "Talking-head + screen record hybrid (30–45s)",
        platform: "tiktok / ig-reels",
        why: "Best mix of trust (face) and proof (product).",
        hookIdea: `I used to burn nights on launch content — then I tried ${brief.name}.`,
        priority: "high",
      },
      {
        format: "3-post carousel / thread",
        platform: "x / linkedin",
        why: "Lets you teach one insight and soft-CTA the waitlist.",
        hookIdea: `3 things founders get wrong in week-1 content (and what ${brief.name} fixes).`,
        priority: "high",
      },
      {
        format: "Before/after split",
        platform: "ig-reels",
        why: "Visual contrast travels well without heavy editing.",
        hookIdea: "Left: blank calendar. Right: 7 days packed.",
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
  const query = `UGC marketing angles for ${brief.name} targeting ${
    icp || brief.audience || "founders"
  }: ${brief.oneLiner}`;

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
  const query = `What short-form UGC and social content trends are working right now for a product like "${brief.name}" (${brief.oneLiner}) targeting ${
    icp || brief.audience || "early-stage founders"
  }? Recommend the best content formats, platforms, and hook ideas for the next 7 days.`;

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
        "Focus on actionable short-form / UGC marketing trends. Prefer recent sources. Be specific about formats and platforms.",
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
