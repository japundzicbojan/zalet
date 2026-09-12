# Zalet  -  Zalet Lite (official partner stack)

**One-liner:** Paste a product URL → agent researches (Firecrawl + Exa), plans with Grok (xAI), generates UGC creatives (Fal), packs the campaign in a **Daytona** sandbox, saves the shareable board (file store + optional Convex dual-write), ships on **Render**.

## Partner mapping (must use)

| Partner | Role in Zalet |
| --- | --- |
| **Firecrawl** | Scrape product page → clean markdown/JSON |
| **Exa** | Trend research + best content format recommendations |
| **xAI (Grok)** | 7-day strategy + UGC scripts (structured JSON) |
| **Fal.ai** | 3 UGC stills (9:16) |
| **Daytona** | Run pack pipeline: write artifacts, zip, download pack, cleanup sandbox |
| **Convex** | Optional durable dual-write (`convex/runs.ts`). File store is primary until Convex is deployed |
| **Render** | Public live URL (attach a disk or set Convex for persistence) |
| Grok Bot / Cursor | Build environment |
| Wispr Flow | Voice while building (not in product) |
| Wonder | Optional UI polish later  -  not on critical path |

## MVP IN

1. URL + optional ICP/goal
2. Async run: board opens immediately, agent trace streams via polling
3. Firecrawl extract + Exa trends/recommendations
4. Grok 7-day calendar + 3 English scripts
5. Fal 3 stills at 9:16 (+ optional Generate video)
6. Daytona packs campaign + local zip download + preview route
7. Shareable board `/c/[runId]`
8. Deployable on Render
9. Board iterate: refine / week 2 / rewrite script / new still / adapt from results

## MVP OUT

Auth (beyond optional list token + rate limits), multi-product, posting to socials, Wonder-first design, Wispr-in-app, native social analytics APIs, lip-sync video on critical path.

## Demo golden path

Paste URL → redirect to `/c/[id]` while queued/running → trace shows Firecrawl/Exa/Grok/Fal/Daytona → board fills → download zip → open pack preview → share link.
