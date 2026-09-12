# ZALET — Hackathon Battle Plan

**Grok Bot Serbia Hackathon (Cursor Community Serbia / SpaceXAI) — Belgrade, single day.**
Hacking ~11:00 → submit 19:00. Judging Sept 19. Treat **17:00 as the real deadline**; 17:00–19:00 is buffer, live demos, and talking to judges.

Read sections 1–5 once. Then live in section 6.

---

## 1. Product name + one-liner

Three options:

| Name | Meaning | Why it works | Risk |
| --- | --- | --- | --- |
| **Zalet** | Serbian for the run-up you take before a jump | Launch metaphor that is instantly explainable in 5 seconds, short, pronounceable by non-Serbian judges | Unknown word to internationals until you explain it (that's the hook) |
| **Pogon** | Serbian for engine / drive / propulsion | Strong, techy, "the marketing engine" | Less specific to launching |
| **Lansir** | From *lansiranje* (launch) | Most self-explanatory, sounds like "launcher" | Generic, forgettable |

### Recommendation: **Zalet**

> **Zalet** — paste your product URL, and an agent writes and runs its own code inside a Daytona sandbox to ship you a 7-day launch campaign: strategy, UGC scripts, and generated creatives on a live campaign board.

Say the brand story in the video, verbatim: *"Zalet is the run-up before the jump. Founders have the product. They don't have the run-up."*

Tagline for the form field (one line, English): **The founder's UGC strategist. One URL in, a week of launch content out.**

---

## 2. MVP scope lock

### IN (this is the whole product, nothing more)

1. One input: product URL. Two optional fields: ICP (free text) and goal (dropdown: Launch / Waitlist / First 100 sales).
2. A visible agent trace: 6 named tool calls, each with status, duration, and output preview.
3. A Daytona sandbox per run, created once and reused across steps, with:
   - agent-written extraction script uploaded and executed,
   - live streamed stdout/stderr in a terminal pane in the browser,
   - the final campaign board **served from the sandbox's preview URL**,
   - a downloadable `campaign.zip` built inside the sandbox.
4. Grok-generated 7-day calendar (platform, angle, hook, CTA, KPI per day).
5. Three UGC scripts (hook / beats / on-screen text / CTA), one of them in Serbian.
6. Fal creatives: 3 stills (`fal-ai/flux/schnell`) + **1** five-second lip-synced hook video (`bytedance/seedance-2.0/fast/image-to-video`).
7. Shareable public board at `/c/[runId]` that still works a week later on Sept 19.
8. `/api/health` provider status panel in the footer (green/red per provider).

### OUT (say "no" out loud when someone suggests these)

- Auth, accounts, login, teams, billing, pricing page.
- Any database schema beyond `runs` / `events` / `creatives`.
- Editing generated content. Regeneration of individual items. Versioning.
- Multiple products per run. Batch mode. Comparison views.
- Real competitor scraping via Exa/Firecrawl as a *required* path (Grok names competitors; label it as model knowledge, not scraped fact).
- Video for more than one script. Voiceover cloning. Music. Captions burned by a service.
- Publishing/posting to any platform. OAuth to anything.
- Mobile-first responsive polish beyond "does not look broken on a phone".
- Tests, CI, Docker, monorepo, tRPC, state management libraries, dark/light toggle.
- Render deploy (no Render prize is listed — do not spend a minute on it).
- The midday workshops. All of them. You are building, not learning.

### The one exception worth breaking scope for

If Daytona reps are at the venue, spend 10 minutes at lunch asking them *what they want to see in the Best Daytona App*. That is the single highest-ROI 10 minutes of the day.

---

## 3. Exact happy-path demo script (3:00, six 30-second beats)

Write this out word-for-word and read it. Do not improvise. Record screen at 1080p, 9:16 UI elements avoided, browser zoom 110%, notifications off, one clean browser profile.

**Beat 1 — 0:00–0:30 — The stab**
On camera or voiceover over the landing page:
> "I'm a founder in Belgrade. I have a product and no marketing team. Today I need a week of content. Watch."
Paste the golden URL into the single field. Pick ICP "freelance designers", goal "First 100 sales". Click **Napravi zalet**. Nothing else on screen. One field, one button.

**Beat 2 — 0:30–1:00 — The agent plans, the sandbox appears**
Trace panel writes out six tool calls. The **Daytona badge** appears in the header: sandbox ID, region, uptime ticking, `0 commands`. Code pane shows `extract.mjs` **being written by the agent** for this specific site.
> "The agent didn't call a scraping API. It wrote a scraper for this page, and it needs somewhere safe to run it."

**Beat 3 — 1:00–1:30 — Daytona executes (the money shot)**
Terminal pane streams real output: file upload, `node extract.mjs`, `ffmpeg -version`, product JSON printed. Badge counter climbs to `7 commands`.
> "That's a Daytona sandbox. The agent's code runs there, not on our server — untrusted HTML, arbitrary npm, ffmpeg, all isolated per run. This is literally what Daytona is for: running AI-generated code."

**Beat 4 — 1:30–2:00 — Strategy lands**
7-day grid fills in day by day. Click day 3 → drawer opens with the full UGC script: hook, four beats with visual/VO/on-screen text, CTA, 22s runtime.
> "Seven days, each with a platform, an angle, and a hook tied to one ICP pain point."

**Beat 5 — 2:00–2:30 — Creatives, with sound on**
Three Fal stills pop in one by one (deliberately staggered). Then the 5-second video plays — **unmute it** — a talking-head UGC hook, lip-synced, in Serbian.
> "Stills from FLUX on Fal, and the hook video from Seedance — image-to-video off our own still, with native lip-synced audio. In Serbian, because that's who's buying."

**Beat 6 — 2:30–3:00 — The proof and the close**
Click the board's preview URL. New tab opens `https://3000-<sandboxId>.<daytona-proxy>` — **show the URL bar**. Then click Download and show `campaign.zip` in the downloads tray.
> "The board you're looking at is being served out of the Daytona sandbox that built it, and everything in it zips up as a deliverable. Grok for strategy, Fal for creatives, Daytona for execution, Convex for state. That's Zalet. We're [names], and the repo is public."

**Hard rules:** total ≤ 3:00. No "um". No dead air waiting on a generation — if a real run is slower than the beat, cut to the pre-warmed run. Record two takes maximum, keep the better one, ship.

---

## 4. Architecture

### Components

```
Browser (Next.js RSC + client components)
  │  client-orchestrated step machine (5 short requests, not one long one)
  ▼
Next.js route handlers  ──► Convex (runs, events, creatives; live subscriptions)
  │                            ▲
  ├──► Grok (xAI)  strategy + scripts, zod-validated JSON
  ├──► Fal         flux/schnell stills, seedance fast i2v hook video
  └──► Daytona     ONE sandbox per run, reused across steps
                     ├─ fs.uploadFile(agent-written extract.mjs)
                     ├─ process.executeSessionCommand(runAsync) + getSessionCommandLogs → Convex events
                     ├─ curl Fal asset URLs into the sandbox
                     ├─ ffmpeg text overlay + reel stitch
                     ├─ zip → fs.downloadFile → browser download
                     └─ python3 -m http.server 3000 → getPreviewLink(3000) → the public board
```

### Why the step machine (this is the load-bearing architectural decision)

Do **not** write one long-running orchestrator request. Serverless hosts freeze or time out, and one failure loses the whole run. Instead the browser drives:

```
POST /api/runs                        → { runId }
POST /api/runs/[runId]/steps/sandbox  → { sandboxId, terminalUrl, terminalToken }
POST /api/runs/[runId]/steps/research → { product }
POST /api/runs/[runId]/steps/strategy → { strategy }      (also: fire-and-forget kick off video gen here)
POST /api/runs/[runId]/steps/scripts  → { scripts[] }
POST /api/runs/[runId]/steps/creatives→ { creatives[] }
POST /api/runs/[runId]/steps/render   → { previewUrl, zipPath }
```

Every request finishes in well under a minute. Each step is independently retryable. Progress is visible for free. State lives in Convex, so a reload mid-run resumes, and `/c/[runId]` still renders on Sept 19. Between steps, reconnect to the live sandbox by ID rather than creating a new one.

### Where Daytona runs (and what it must do, not just could do)

One sandbox per run, created in the `sandbox` step, reused by every later step, keyed by `sandboxId` in Convex.

Real work inside the sandbox — each of these is a genuine reason a sandbox is required, not theater:

| Sandbox action | Why it cannot run on the web host |
| --- | --- |
| `node extract.mjs <url>` where `extract.mjs` was **written by the agent this run** | Executing model-generated code on your app server is the thing you must never do |
| Fetching and parsing arbitrary third-party HTML | Untrusted input, SSRF surface, unpredictable memory |
| `npm i cheerio` on demand, per-run | Arbitrary dependency installs at runtime |
| `ffmpeg` text overlay + concat | Heavy native binary, no place on a serverless function |
| `zip` the artifact bundle, per-run filesystem | Per-run isolation gives a clean deliverable with no cross-contamination |
| `python3 -m http.server 3000` + preview URL | The board is *hosted by the sandbox* — the strongest possible proof it is real |

### Where Fal is called

Server-side only, from `/api/runs/[runId]/steps/creatives`, never from the browser (protects `FAL_KEY`). Stills in parallel (`Promise.allSettled`), video kicked off one step earlier so it is ready when the board renders.

### Real vs mock (be honest about this in the README)

| Piece | Status | Notes |
| --- | --- | --- |
| Daytona sandbox, commands, logs, preview, zip | **Real** | Non-negotiable, this is the prize |
| Fal stills + hook video | **Real** | Pre-generated copies cached in `public/demo/` as fallback only |
| Grok strategy + scripts | **Real** | zod-validated, one repair retry, canned fallback |
| Product extraction | **Real** for the golden URL, best-effort otherwise | Agent-written scraper; falls back to Grok-from-URL if the page blocks us |
| Competitor research | **Model knowledge, labeled as such** | Exa/Firecrawl is a stretch goal; do not claim it is scraped |
| KPIs / projected reach numbers | **Illustrative, labeled** | Never present invented metrics as measured |

Label mocked things in the UI with a small "illustrative" tag. Judges respect an honest boundary far more than they punish a mock; getting caught overclaiming is fatal.

### Data schema (agree on this at 12:00 and never renegotiate)

```ts
Strategy = {
  product: { name, url, oneLiner, priceHint, categories: string[] },
  icp: { label, painPoints: [string,string,string], objections: [string,string,string], channels: string[] },
  positioning: { wedge, proofPoints: [string,string,string], tone },
  week: Day[]                                  // exactly 7
}
Day     = { day: 1..7, platform: 'tiktok'|'ig-reels'|'x'|'linkedin', angle, format, hook, cta, kpi }
Script  = { dayRef: number, language: 'sr'|'en', hookText, runtimeSec,
            beats: { t: number, visual: string, vo: string, onScreen: string }[], cta }
Creative= { scriptRef: number, kind: 'still'|'video', falModel, prompt, url, sandboxPath, ready: boolean }
Event   = { runId, ts, phase, level: 'info'|'cmd'|'stdout'|'stderr'|'error', msg }
```

### File tree (create these empty at 12:00 so nobody invents parallel structures)

```
app/
  page.tsx                                  # hero, single URL field
  c/[runId]/page.tsx                        # public shareable campaign board
  api/runs/route.ts                         # POST create run
  api/runs/[runId]/steps/[step]/route.ts    # one dynamic handler, switch on step
  api/runs/[runId]/zip/route.ts             # streams campaign.zip out of the sandbox
  api/health/route.ts                       # pings all providers
components/
  UrlForm.tsx  AgentTrace.tsx  SandboxTerminal.tsx  DaytonaBadge.tsx
  CalendarGrid.tsx  ScriptDrawer.tsx  CreativeCard.tsx  ProviderStrip.tsx
lib/
  daytona.ts        # getOrCreateSandbox, upload, runStreamed, previewUrl, zipOut
  fal.ts            # genStill, genHookVideo
  grok.ts           # strategy, scripts (structured output + repair)
  agent/
    orchestrator.ts # step registry + guards
    tools.ts        # tool defs, trace emitter
    prompts.ts      # all prompt text, one file, no inline strings
    schema.ts       # zod schemas from the block above
  events.ts         # emit(runId, event) → Convex
  flags.ts          # MOCK_FAL, MOCK_GROK, MOCK_DAYTONA, REPLAY
convex/
  schema.ts  runs.ts  events.ts
sandbox/
  bootstrap.sh              # deps for the snapshot
  templates/extract.mjs     # base scraper the agent rewrites
  templates/board/          # static board served on :3000
demo/
  replay.json               # recorded golden run, real timings
```

---

## 5. Tech stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Framework | **Next.js 15 App Router + TypeScript** | Route handlers give server-side key safety; one deploy target; everyone knows it |
| UI | **Tailwind + shadcn/ui**, dark by default | Looks designed in zero time; dark makes the terminal pane look native |
| Host | **Vercel** | `vercel --prod` in 40 seconds. No Render prize is listed, so Render is a distraction |
| State | **Convex** | Live subscriptions replace all SSE/websocket plumbing; run survives reload; partner tool; `/c/[runId]` works on judging day |
| LLM | **Grok via xAI API** | It is the *Grok* Bot hackathon. Ask organizers for credits at 11:30 |
| Sandbox | **`@daytona/sdk`** | The prize |
| Media | **`@fal-ai/client`** | `fal-ai/flux/schnell` stills, `bytedance/seedance-2.0/fast/image-to-video` hooks |
| Validation | **zod** | One repair retry on malformed model JSON |
| Package manager | **pnpm** | Fast installs; do not debate this |

**Convex tripwire:** if Convex is not writing and reading events by **13:30**, drop it. Fallback is run state as JSON inside the sandbox (`/workspace/runs/<runId>/state.json`) plus 1-second client polling. That fallback is actually a *better* Daytona story, so it is not a loss — it just costs you the shareable-after-reload property and one partner logo.

---

## 6. Hour-by-hour schedule

Owners: **A = agent/backend** (Daytona, orchestrator, Grok) · **B = creatives** (Fal, ffmpeg, board render) · **C = frontend + deploy + video**.

Each gate is binary. If a gate fails, cut scope immediately — never extend the clock.

| Time | A | B | C | GATE |
| --- | --- | --- | --- | --- |
| **11:30–12:00** Setup sprint | `create-next-app`, empty file tree from §4, `.env.local`, `lib/flags.ts` | Get `FAL_KEY` working: one script, one image, saved to disk | **Deploy hello-world to Vercel prod now**, Convex init | **12:00: a public URL exists** |
| **12:00–13:00** Mock vertical slice | Step machine + all 6 steps returning canned data from `demo/replay.json` | 3 UGC still prompts tuned, 3 real stills committed to `public/demo/` | UrlForm + AgentTrace + CalendarGrid + CreativeCard on mock data | **13:00: click → all 6 steps walk → board renders. You now have a demo no matter what happens next.** |
| **13:00–14:00** Daytona real | `lib/daytona.ts`: create, upload, `executeSessionCommand(runAsync)`, stream logs → events. Real scrape of golden URL | Seedance `fast/image-to-video` working off one still, 5s, 480p, 9:16, Serbian line, audio on | `SandboxTerminal` (iframe port 22222 + log tail) + `DaytonaBadge` + `ProviderStrip` | **14:00: terminal pane shows real sandbox output in the browser** |
| **14:00–14:25** Lunch | All three, together, 25 minutes. Find the Daytona reps. Ask what wins their prize. | | | Morale + intel |
| **14:25–15:30** Content real | Grok strategy + scripts, zod + repair retry. Agent *writes* `extract.mjs` per run and shows it in a code pane | ffmpeg overlay + reel concat + `zip` + `python3 -m http.server 3000` + `getPreviewLink(3000)` | `/c/[runId]` public board, ScriptDrawer, OG image, mobile sanity pass | **15:30: one full real end-to-end run has completed** |
| **15:30–16:00** FREEZE | No new features. Run the golden URL **three times**. Record `demo/replay.json` from a real success. Fix only crashes. | | | **16:00: 3/3 clean runs** |
| **16:00–16:30** Video | Read the §3 script. Two takes max. | Screenshots for submission. | Record, trim, export 1080p, upload unlisted + Loom backup. | **16:30: video URL exists** |
| **16:30–17:00** Submit | README (see §10), repo public, secret scan | Form fields pasted from §10 | Verify live URL in incognito | **17:00: SUBMITTED** |
| **17:00–19:00** | Stretch goals from §11, in order. Demo to judges. Fix only demo-breaking bugs. Push every fix to prod. | | | |

### If solo

Cut in this order: competitor research → hook video (stills only) → Convex (use sandbox-FS state) → Serbian script (English only). Keep Daytona at full strength; it is the prize and the differentiator.

Solo timeline: mock slice done **13:00** · Daytona real **14:30** · Fal stills **15:30** · board + render + preview URL **16:30** · video **16:45–17:15** · submit **17:30**. Hardcode one golden URL. Ship replay mode as the live-URL experience and use the genuine run for the video, labeled honestly in the README.

### Standing rules

- Push to prod on the hour, every hour. A broken prod deploy at 16:00 is a crisis; at 12:00 it is a shrug.
- Anyone stuck >20 minutes says so out loud and swaps or stubs it.
- No one refactors after 15:30.
- One golden URL is tested. Pick a real product with clean HTML and a good hero image at 12:00 and never change it.

---

## 7. API / keys checklist and fallbacks

Do this at 11:30, all of it, before writing a line of feature code. A missing key discovered at 16:00 is a lost hackathon.

| Provider | Env vars | Verify with | If it fails |
| --- | --- | --- | --- |
| **Daytona** | `DAYTONA_API_KEY` (+ `DAYTONA_API_URL` / target if your account needs it) | Create a sandbox, `executeCommand('echo ok && ffmpeg -version')` | **Walk to the Daytona reps at the venue.** They are physically there; that is your support channel. A local Docker fallback behind the same `runInSandbox()` interface exists, but running it means forfeiting the Daytona prize, so exhaust human help first |
| **Fal** | `FAL_KEY` | One `fal.subscribe('fal-ai/flux/schnell', ...)` call | `MOCK_FAL=1` → serve the 3 committed stills + 1 committed mp4 from `public/demo/` |
| **Grok (xAI)** | `XAI_API_KEY` | One chat completion returning JSON | Any other LLM key behind the same `lib/grok.ts` interface → then `MOCK_GROK=1` canned strategy. **Ask organizers for xAI credits at 11:30** |
| **Convex** | `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL` | `npx convex dev`, one write + one read | Sandbox-FS state + polling (13:30 tripwire, §5) |
| **Vercel** | Account + project link | `vercel --prod` | Last resort: serve the whole app from a Daytona sandbox preview URL. It works, and it is on-brand |
| Exa / Firecrawl | `EXA_API_KEY` / `FIRECRAWL_API_KEY` | Optional | Mocked by default; never on the critical path |

Non-negotiable hygiene:

- Every provider call goes through one wrapper with a timeout, one retry, and a cached fallback. No raw `fetch` to a provider anywhere in the codebase.
- `MOCK_DAYTONA`, `MOCK_FAL`, `MOCK_GROK`, `REPLAY` flags in `lib/flags.ts`, all readable from the UI footer so you always know what mode you are demoing.
- `/api/health` pings all four providers and renders green/red dots in the footer. Check it before you press record and before you demo to a judge.
- Keys in `.env.local` and Vercel project settings only. `.env.example` committed with empty values. Before pushing: `git log -p | rg -i 'sk-|fal_|xai-|dtn_'` must come back empty.

---

## 8. Risk matrix

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| 1 | **Live demo fails while a judge is watching** | High | Fatal | The **video is the primary artifact** (judging is a week later). Ship `REPLAY=1` mode that replays `demo/replay.json` with real recorded timings and a visible "replay" tag. Any step that fails twice auto-degrades to its cached output and labels itself. Never debug live in front of a judge — switch to replay and keep talking |
| 2 | **Sandbox cold start / per-run installs eat the demo** | High | High | Pre-bake a Daytona **snapshot** with ffmpeg, node deps, cheerio at ~13:00, then `daytona.create({ snapshot })`. **Pre-warm the sandbox on page load**, not on submit. Reuse one sandbox across all steps. Hard 45s timeout per command |
| 3 | **Fal video latency blows the timeline** | High | Medium | `fast` variant, `480p`, `duration: "5"`, one video only. **Kick the video job off during the strategy step** (speculative) so it is ready by render. Stills carry the visual load |
| 4 | **Scope creep** (auth, editing, DB, "what if we also…") | Very high | Fatal | §2 OUT list is law. One person owns saying no. Nothing new after 15:30, no exceptions, including good ideas |
| 5 | **Integration hell at 17:00** — three beautiful halves that never met | Medium | Fatal | Mock-first vertical slice **wired end-to-end by 13:00**, then swap real implementations in behind stable interfaces. Deploy to prod hourly. This single practice is what separates shipped from not-shipped |
| 6 | Model returns malformed JSON | Medium | Medium | zod parse → one repair retry with the error echoed back → canned fallback. Never let a parse error surface to the UI |
| 7 | Golden URL's site blocks the scraper | Medium | Medium | Pick the golden URL at 12:00 and test it immediately. Fall back to Grok-from-URL-and-title, labeled |

---

## 9. Judging strategy

Judging weights **Innovation (agents + partner tools) first**, then working product, clarity, execution, impact. Optimize in that order.

### Making Daytona undeniable

Daytona describes itself as *"secure and elastic infrastructure for running AI-generated code."* Build the demo so it is a literal illustration of that sentence.

1. **The agent writes the code that the sandbox runs.** Show `extract.mjs` appearing in a code pane, authored this run for this page, then show it executing. Anyone can shell out to a sandbox; almost nobody will demo the sandbox executing model-authored code. This is the winning move.
2. **Persistent `DaytonaBadge` in the header, on screen the entire demo:** sandbox ID (truncated), region, uptime ticking, commands executed, artifacts written. It is always visible, so it is never a claim — it is a readout.
3. **Live terminal pane.** Stream `getSessionCommandLogs` into the UI, and additionally iframe the sandbox's own web terminal via `getPreviewLink(22222)`. Real shell, real timestamps, in the browser.
4. **Host the deliverable from the sandbox.** The board is served by `python3 -m http.server 3000` inside the sandbox and opened through `getPreviewLink(3000)`. Show the `3000-<sandboxId>...` URL in the address bar on camera. Nothing proves "this is real infrastructure" like a URL that is obviously not localhost.
5. **Download the artifact.** `campaign.zip` is built by `zip` inside the sandbox and streamed out through `fs.downloadFile`. A judge can open it.
6. **README section titled "Why Daytona — and what breaks without it"** with the four-row table from §4. Judges skim READMEs a week later, when nobody is there to pitch.
7. **Say the sentence** in the video: *"This is literally what Daytona is for: running AI-generated code."* Quote their own positioning back at them.

### Scoring Innovation

- Frame the product as **an agent with tools that writes and runs its own code**, never as "an AI that generates marketing copy." The trace panel is the evidence; put it on screen for 30 straight seconds.
- Name the partner tools **in the UI**, not just the pitch: a footer strip with Daytona / Fal / Grok / Convex, each with a four-word "what it does here". Judges grading partner-tool usage should not have to read code to find it.
- Show one **real chain of reasoning to action**: scraped pain point → ICP objection → day-3 angle → hook line → the still's prompt → the generated frame. Trace one thread visibly end to end. That is what separates an agent from a prompt wrapper.
- **Serbian lip-synced UGC hook with audio on.** In a Belgrade room this lands as market insight, not as a gimmick, and it is the single most memorable five seconds you can put in a three-minute video.
- **Impact line, one sentence, no hand-waving:** "A founder's first week of content is currently a two-week agency engagement or nothing. This is 90 seconds." Do not present invented reach or revenue numbers — labeled illustrative KPIs only.

### Live demo conduct (17:00–19:00)

Two-minute version ready: paste URL, terminal streaming, board, preview URL, zip. Open with the Daytona line for Daytona reps, with the founder pain for business judges. Keep the tab pre-warmed. If anything hangs for more than four seconds, switch to replay and keep narrating.

---

## 10. Submission checklist

Complete by **17:00**. Not 18:55.

**Repo**
- [ ] Public, MIT license
- [ ] README: one-liner, hero GIF or screenshot, live URL, video link, 60-second quickstart, architecture diagram (ASCII from §4 is fine), **"Why Daytona — and what breaks without it"**, env var table, honest real-vs-mock table, team names + handles
- [ ] `.env.example` with every key, all values empty
- [ ] Secret scan clean: `git log -p | rg -i 'sk-|fal_|xai-|dtn_'`
- [ ] Commits are not one giant "final" commit — judges look at history for execution signal

**Live URL**
- [ ] Works in a fresh incognito window
- [ ] Works on a phone without visible breakage
- [ ] `/c/[runId]` for the golden run is bookmarked into the README, so it still renders on Sept 19 with no sandbox alive
- [ ] `/api/health` all green

**Video**
- [ ] ≤ 3:00, 1080p, audio levels checked with headphones
- [ ] Unlisted YouTube **plus** a Loom backup link
- [ ] Subtitles or burned captions if accents are strong — judges may watch muted
- [ ] The Daytona preview URL is legible in the address bar on screen

**Form**
- [ ] Team name + members
- [ ] Product name: **Zalet**
- [ ] One-liner (§1, pre-written, paste don't compose)
- [ ] Repo URL, live URL, video URL
- [ ] Stack list naming partner tools explicitly: Daytona, Fal.ai, Grok (xAI), Convex, Next.js, Vercel
- [ ] **Daytona usage description, three sentences, written in advance at 15:00:** what runs in the sandbox, why it cannot run elsewhere, which SDK surfaces you used (`process.executeSessionCommand` + `getSessionCommandLogs`, `fs.uploadFile`/`downloadFile`, `getPreviewLink`, snapshots)
- [ ] Three screenshots: trace + terminal, the 7-day board, a creative card with the video frame

---

## 11. Stretch goals

Only if the core is genuinely done and submitted by 16:30. In strict priority order — do one completely rather than three halfway.

1. **Grok Bot entry point (~30 min).** A webhook route that accepts a product URL from Telegram or X and replies with the `/c/[runId]` link. The event is called *Grok Bot* Serbia Hackathon; having an actual bot surface costs one route and buys real thematic alignment.
2. **Steerable remix (~20 min).** Change the ICP and regenerate only scripts + creatives, reusing the same sandbox and strategy. Proves the agent is directable, which is an Innovation point rather than a feature.
3. **Daytona `computerUse` screenshot → image-to-image (~40 min).** Have the sandbox screenshot the real product page, then feed that frame to Fal image-to-image so creatives are visually on-brand. Flashy, and it exercises a deep Daytona surface almost nobody else will touch.
4. **Parallel competitor sandbox (~30 min).** Second sandbox scraping two competitors concurrently, feeding a "differentiation angle" section. Demonstrates *elastic* sandbox use — plural sandboxes, on demand.
5. **Export to scheduler (~15 min).** `calendar.csv` in a Buffer/Later-compatible shape, built by the sandbox. Cheap, and it makes the output feel operational.
6. **Cost + latency panel (~15 min).** Per-run token, Fal, and sandbox-second counts. Judges with an infrastructure background notice this immediately.

Do **not** attempt: auth, multi-tenancy, payments, a landing page with pricing, or a second product surface.

---

## The four sentences that decide the day

1. **A working mock end-to-end at 13:00** beats a beautiful half-system at 18:00.
2. **The video is the artifact judges actually grade** on Sept 19 — record it at 16:00, not 18:45.
3. **Daytona wins by being visible and load-bearing:** the agent writes the code, the sandbox runs it, the sandbox serves the result.
4. **Nothing new after 15:30.** Freeze, rehearse, record, submit.
