# Zalet  -  Zalet Lite (official partner stack)

**One-liner:** Paste a product URL → agent researches (Firecrawl + Exa), plans with Grok (xAI), generates UGC creatives (Fal), packs the campaign in a **Daytona** sandbox, persists the board on **Convex**, ships on **Render**.

## Partner mapping (must use)

| Partner | Role in Zalet |
| --- | --- |
| **Firecrawl** | Scrape product page → clean markdown/JSON |
| **Exa** | Trend research + best content format recommendations |
| **xAI (Grok)** | 7-day strategy + UGC scripts (structured JSON) |
| **Fal.ai** | 3 UGC stills (+ optional 1 short hook video) |
| **Daytona** | Run pack pipeline: write artifacts, zip, stream logs, optional preview |
| **Convex** | Live run state, events, shareable `/c/[runId]` board |
| **Render** | Public live URL |
| Grok Bot / Cursor | Build environment |
| Wispr Flow | Voice while building (not in product) |
| Wonder | Optional UI polish later  -  not on critical path |

## MVP IN

1. URL + optional ICP/goal
2. Visible agent trace (partner tools named)
3. Firecrawl extract + Exa angles
4. Grok 7-day calendar + 3 scripts (1 Serbian)
5. Fal 3 stills (video stretch)
6. Daytona packs `campaign/` + zip + live terminal logs
7. Convex-backed public board `/c/[runId]`
8. Deployed on Render

## MVP OUT

Auth, editing, multi-product, posting to socials, Wonder-first design, Wispr-in-app, lip-sync video on critical path.

## Demo golden path

Paste URL → trace shows Firecrawl/Exa/Grok/Fal/Daytona → board fills → Daytona terminal streams → download zip → share `/c/[id]`.
