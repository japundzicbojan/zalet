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
| **Daytona** | Sandbox pack, then zip pulled down for download |
| **Convex** | Optional dual-write (`convex/schema.ts` + `convex/runs.ts`) |
| **Render** | Deploy via `render.yaml` |

Wispr Flow = voice while building. Wonder = optional design pass later.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Without keys the app still runs end-to-end with **labeled mocks**.

## Docs for the hackathon

- [DEPLOY.md](./DEPLOY.md)  -  Render Blueprint + Convex
- [DEMO.md](./DEMO.md)  -  jury golden path
- [PITCH.md](./PITCH.md)  -  60s pitch
- [BATTLEPLAN.md](./BATTLEPLAN.md)  -  scope

## Demo path

1. Paste product URL (+ ICP / goal)
2. Land on `/c/[runId]` immediately (run is async)
3. Watch agent trace: Firecrawl → Exa → Grok → Fal → Daytona
4. Download zip, open pack preview, share the board link

```bash
pnpm demo:smoke
# or: BASE_URL=http://127.0.0.1:43123 pnpm demo:smoke https://resend.com
```

## Env

See `.env.example`. Notable extras:

- `ZALET_DATA_DIR`  -  durable data root (Render disk mount in prod)
- `ZALET_RUN_SECRET`  -  required as `x-zalet-token` for `GET /api/runs`
- `DAYTONA_KEEP_SANDBOX=1`  -  keep Daytona sandbox + remote preview

## Scripts

- `pnpm dev --port 43123`  -  local
- `pnpm build && pnpm start`  -  production (Render)
- `pnpm demo:smoke`  -  async create → poll → zip/preview
- `pnpm convex:dev` / `pnpm convex:deploy`  -  optional Convex

## Notes

- `POST /api/runs` returns `202` and finishes the pipeline in the background.
- Run ids are sanitized; packs live under `.data/packs/[id]/`.
- Create is rate-limited (5/min/IP). Listing stays hidden unless `ZALET_RUN_SECRET` is set.
