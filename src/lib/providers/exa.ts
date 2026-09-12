import type { Angle, ProductBrief } from "../types";
import { providerMode } from "../env";

function mockAngles(brief: ProductBrief): Angle[] {
  return [
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
}

export async function researchAngles(
  brief: ProductBrief,
  icp?: string,
): Promise<{ angles: Angle[]; mode: "live" | "mock"; log: string }> {
  const mode = providerMode().exa;
  if (mode === "mock") {
    return {
      angles: mockAngles(brief),
      mode,
      log: "EXA_API_KEY missing → mock market angles.",
    };
  }

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
      contents: { text: { maxCharacters: 500 } },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      angles: mockAngles(brief),
      mode: "mock",
      log: `Exa failed (${res.status}): ${text.slice(0, 180)} → mock.`,
    };
  }

  const data = (await res.json()) as {
    results?: { title?: string; url?: string; text?: string }[];
  };

  const angles =
    data.results?.slice(0, 5).map((r) => ({
      title: r.title || "Market signal",
      why: (r.text || "Relevant competitor/content signal.").slice(0, 240),
      source: r.url,
    })) || mockAngles(brief);

  return { angles, mode: "live", log: `Exa returned ${angles.length} angles` };
}
