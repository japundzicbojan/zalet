# Zalet

> Paste a product URL → agent ships a 7-day UGC campaign board.

Hackathon build for **Grok Bot Serbia** using the official partner stack.

## Partner stack

| Partner | Used for |
| --- | --- |
| **Firecrawl** | Product page scrape → brief |
| **Exa** | Trend research + recommended content formats/hooks |
| **xAI (Grok)** | 7-day plan + scripts (1 Serbian) |
| **Fal.ai** | 3 UGC stills (768×1344 / 9:16) |
| **Daytona** | Sandbox pack, then zip is pulled down locally for download |
| **Convex** | Optional dual-write (`convex/schema.ts` + `convex/runs.ts`) once deployed |
| **Render** | Deploy via `render.yaml` |

Wispr Flow = voice while building. Wonder = optional design pass later.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Without keys the app still runs end-to-end with **labeled mocks** so the demo path works.

## Demo path

1. Paste product URL (+ ICP / goal)
2. Land on `/c/[runId]` immediately (run is async)
3. Watch agent trace fill: Firecrawl → Exa → Grok → Fal → Daytona
4. Download the zip, open pack preview, share the board link

## Env

See `.env.example`. Notable extras:

- `ZALET_DATA_DIR`  -  durable data root (use a Render disk mount in prod)
- `ZALET_RUN_SECRET`  -  required as `x-zalet-token` to `GET /api/runs` (list)
- `DAYTONA_KEEP_SANDBOX=1`  -  keep Daytona sandbox + remote preview (default: delete after pack)

## Scripts

- `pnpm dev --port 43123`  -  local
- `pnpm build && pnpm start`  -  production (Render)

## Notes

- `POST /api/runs` returns `202` with the run id and finishes the pipeline in the background.
- Run ids are sanitized; packs live under `.data/packs/[id]/`.
- Create is rate-limited (5/min/IP). Listing is hidden unless `ZALET_RUN_SECRET` is set.
- Convex: `npx convex dev` then set `NEXT_PUBLIC_CONVEX_URL` for dual-write.
