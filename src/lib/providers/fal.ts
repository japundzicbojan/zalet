import { fal } from "@fal-ai/client";
import { nanoid } from "nanoid";
import type { Campaign, Creative, ProductBrief } from "../types";
import { falKey, providerMode } from "../env";

function svgDataUrl(label: string, hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1344" viewBox="0 0 768 1344">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},70%,18%)"/>
        <stop offset="100%" stop-color="hsl(${hue + 40},65%,32%)"/>
      </linearGradient>
    </defs>
    <rect width="768" height="1344" fill="url(#g)"/>
    <text x="48" y="120" fill="#f5f0e8" font-family="Georgia, serif" font-size="42">Zalet UGC</text>
    <foreignObject x="48" y="200" width="672" height="900">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color:#f5f0e8;font:600 36px/1.25 system-ui;white-space:pre-wrap">${label.replace(/[<>&]/g, "")}</div>
    </foreignObject>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function stillPrompts(brief: ProductBrief, campaign: Campaign): string[] {
  const hooks = campaign.scripts.map((s) => s.hookText).slice(0, 3);
  while (hooks.length < 3) hooks.push(`${brief.name} UGC hook`);
  return hooks.map(
    (hook) =>
      `Vertical UGC selfie still, natural light, authentic founder vibe, phone camera, soft grain, text-safe negative space, product vibe for ${brief.name}: ${hook}`,
  );
}

export async function generateCreatives(
  brief: ProductBrief,
  campaign: Campaign,
): Promise<{ creatives: Creative[]; mode: "live" | "mock"; log: string }> {
  const mode = providerMode().fal;
  const prompts = stillPrompts(brief, campaign);

  if (mode === "mock") {
    return {
      mode,
      log: "FAL_KEY missing → mock SVG UGC stills.",
      creatives: prompts.map((prompt, i) => ({
        id: nanoid(8),
        kind: "still" as const,
        prompt,
        url: svgDataUrl(prompt.slice(0, 120), 18 + i * 40),
        provider: "fal" as const,
        mock: true,
      })),
    };
  }

  fal.config({ credentials: falKey() });
  const creatives: Creative[] = [];
  const errors: string[] = [];

  await Promise.all(
    prompts.map(async (prompt, i) => {
      try {
        const result = await fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt,
            // Explicit 9:16 UGC still (avoid ambiguous portrait_16_9 enum).
            image_size: { width: 768, height: 1344 },
            num_images: 1,
          },
        });
        const url =
          (result.data as { images?: { url: string }[] })?.images?.[0]?.url ||
          "";
        if (!url) throw new Error("No image URL from Fal");
        creatives[i] = {
          id: nanoid(8),
          kind: "still",
          prompt,
          url,
          provider: "fal",
          mock: false,
        };
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "fal error");
        creatives[i] = {
          id: nanoid(8),
          kind: "still",
          prompt,
          url: svgDataUrl(prompt.slice(0, 120), 18 + i * 40),
          provider: "fal",
          mock: true,
        };
      }
    }),
  );

  return {
    creatives,
    mode: errors.length === prompts.length ? "mock" : "live",
    log:
      errors.length === 0
        ? `Fal generated ${creatives.length} stills`
        : `Fal partial/fallback (${errors[0]})`,
  };
}
