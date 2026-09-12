import type { ProductBrief } from "../types";
import { providerMode } from "../env";

function hostName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "product";
  }
}

function mockBrief(url: string): ProductBrief {
  const host = hostName(url);
  const raw = host.split(".")[0]?.replace(/-/g, " ") || "Product";
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);
  return {
    url,
    name,
    oneLiner: `${name} helps founders get stuff shipped without drowning in busywork.`,
    audience: "early-stage founders and indie hackers",
    features: ["Fast onboarding", "Clear core loop", "Shareable output"],
    toneHints: ["direct", "founder-to-founder", "no fluff"],
    rawMarkdown: `# ${name}\n\nMock extract for ${url} (Firecrawl key missing).`,
  };
}

export async function scrapeProduct(url: string): Promise<{
  brief: ProductBrief;
  mode: "live" | "mock";
  log: string;
}> {
  const mode = providerMode().firecrawl;
  if (mode === "mock") {
    return {
      brief: mockBrief(url),
      mode,
      log: "FIRECRAWL_API_KEY missing → mock product brief from URL hostname.",
    };
  }

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "extract"],
      extract: {
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            oneLiner: { type: "string" },
            audience: { type: "string" },
            features: { type: "array", items: { type: "string" } },
          },
        },
        prompt:
          "Extract product name, one-liner, audience, and up to 5 features.",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      brief: mockBrief(url),
      mode: "mock",
      log: `Firecrawl failed (${res.status}): ${text.slice(0, 180)} → mock.`,
    };
  }

  const data = (await res.json()) as {
    data?: {
      markdown?: string;
      extract?: {
        name?: string;
        oneLiner?: string;
        audience?: string;
        features?: string[];
      };
    };
  };
  const extracted = data.data?.extract;
  const fallback = mockBrief(url);
  return {
    brief: {
      url,
      name: extracted?.name || fallback.name,
      oneLiner: extracted?.oneLiner || fallback.oneLiner,
      audience: extracted?.audience || fallback.audience,
      features: extracted?.features?.length
        ? extracted.features
        : fallback.features,
      toneHints: fallback.toneHints,
      rawMarkdown: data.data?.markdown?.slice(0, 12000),
    },
    mode: "live",
    log: `Firecrawl scraped ${url}`,
  };
}

/**
 * Best-effort scrape of a public post / page URL for campaign feedback.
 * Instagram, TikTok, LinkedIn and X often block or thin out scrapers.
 * Callers must treat scraped=false as normal and lean on founder notes.
 */
export async function scrapePublicPost(url: string): Promise<{
  signal: import("../types").ResultSignal;
  mode: "live" | "mock";
  log: string;
}> {
  const mode = providerMode().firecrawl;
  if (mode === "mock") {
    return {
      mode,
      log: "FIRECRAWL_API_KEY missing → cannot scrape post URL.",
      signal: {
        url,
        title: hostName(url),
        excerpt: "Scrape skipped (no Firecrawl key).",
        scraped: false,
      },
    };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        mode: "live",
        log: `Firecrawl post scrape failed (${res.status}) for ${url}`,
        signal: {
          url,
          title: hostName(url),
          excerpt: text.slice(0, 160),
          scraped: false,
        },
      };
    }

    const data = (await res.json()) as {
      data?: { markdown?: string; metadata?: { title?: string } };
    };
    const markdown = (data.data?.markdown || "").trim();
    const title = data.data?.metadata?.title || hostName(url);
    if (!markdown || markdown.length < 40) {
      return {
        mode: "live",
        log: `Firecrawl got little/no content from ${url} (common on social)`,
        signal: {
          url,
          title,
          excerpt: markdown.slice(0, 240) || undefined,
          scraped: false,
        },
      };
    }

    return {
      mode: "live",
      log: `Firecrawl scraped post signal from ${url}`,
      signal: {
        url,
        title,
        excerpt: markdown.slice(0, 900),
        scraped: true,
      },
    };
  } catch (err) {
    return {
      mode: "live",
      log: `Firecrawl post scrape error for ${url}`,
      signal: {
        url,
        title: hostName(url),
        excerpt: err instanceof Error ? err.message : "error",
        scraped: false,
      },
    };
  }
}

