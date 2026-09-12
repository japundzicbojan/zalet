# Zalet

> Paste a product URL → agent ships a 7-day UGC campaign board.

Hackathon build for **Grok Bot Serbia** using the official partner stack.

## Partner stack

| Partner | Used for |
| --- | --- |
| **Firecrawl** | Product page scrape → brief |
| **Exa** | Trend research + recommended content formats/hooks |
| **xAI (Grok)** | 7-day plan + scripts (1 Serbian) |
| **Fal.ai** | 3 UGC stills |
| **Daytona** | Sandbox pack (`README` + `strategy.json` + `index.html` + zip + preview) |
| **Convex** | Schema ready for live board (`convex/schema.ts`)  -  file store fallback until URL set |
| **Render** | Deploy via `render.yaml` |

Wispr Flow = voice while building. Wonder = optional design pass later.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Without keys the app still runs end-to-end with **labeled mocks** so the demo path works.

## Demo path

1. Paste product URL (+ ICP / goal)
2. Watch agent trace: Firecrawl → Exa → Grok → Fal → Daytona
3. Open `/c/[runId]` board: week plan, scripts, creatives, sandbox logs

## Scripts

- `pnpm dev`  -  local
- `pnpm build && pnpm start`  -  production (Render)

## Notes

- Daytona is load-bearing: campaign artifacts are written/zipped inside a sandbox when `DAYTONA_API_KEY` is set.
- Convex can replace `.data/runs` once `NEXT_PUBLIC_CONVEX_URL` is configured.
