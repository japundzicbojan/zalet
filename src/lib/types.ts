import { z } from "zod";

export const GoalSchema = z.enum(["launch", "waitlist", "first_100"]);
export type Goal = z.infer<typeof GoalSchema>;

export const ProductBriefSchema = z.object({
  url: z.string(),
  name: z.string(),
  oneLiner: z.string(),
  audience: z.string().optional(),
  features: z.array(z.string()).default([]),
  toneHints: z.array(z.string()).default([]),
  rawMarkdown: z.string().optional(),
});
export type ProductBrief = z.infer<typeof ProductBriefSchema>;

export const AngleSchema = z.object({
  title: z.string(),
  why: z.string(),
  source: z.string().optional(),
});
export type Angle = z.infer<typeof AngleSchema>;

export const TrendSignalSchema = z.object({
  title: z.string(),
  insight: z.string(),
  source: z.string().optional(),
});
export type TrendSignal = z.infer<typeof TrendSignalSchema>;

export const ContentRecSchema = z.object({
  format: z.string(),
  platform: z.string(),
  why: z.string(),
  hookIdea: z.string(),
  priority: z.string().default("medium"),
});
export type ContentRec = z.infer<typeof ContentRecSchema>;

export const TrendResearchSchema = z.object({
  summary: z.string(),
  trends: z.array(TrendSignalSchema).default([]),
  recommendations: z.array(ContentRecSchema).default([]),
  angles: z.array(AngleSchema).default([]),
});
export type TrendResearch = z.infer<typeof TrendResearchSchema>;

export const DayPlanSchema = z.object({
  day: z.number(),
  platform: z.enum(["tiktok", "ig-reels", "x", "linkedin"]),
  angle: z.string(),
  format: z.string(),
  hook: z.string(),
  cta: z.string(),
  kpi: z.string(),
});
export type DayPlan = z.infer<typeof DayPlanSchema>;

export const ScriptBeatSchema = z.object({
  t: z.number(),
  visual: z.string(),
  vo: z.string(),
  onScreen: z.string(),
});

export const ScriptSchema = z.object({
  dayRef: z.number(),
  language: z.enum(["sr", "en"]),
  hookText: z.string(),
  runtimeSec: z.number(),
  beats: z.array(ScriptBeatSchema),
  cta: z.string(),
});
export type Script = z.infer<typeof ScriptSchema>;

export const CampaignSchema = z.object({
  positioning: z.string(),
  week: z.array(DayPlanSchema),
  scripts: z.array(ScriptSchema),
  angles: z.array(AngleSchema),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const CreativeSchema = z.object({
  id: z.string(),
  kind: z.enum(["still", "video"]),
  prompt: z.string(),
  url: z.string(),
  provider: z.literal("fal"),
  mock: z.boolean().default(false),
});
export type Creative = z.infer<typeof CreativeSchema>;

export const TraceEventSchema = z.object({
  id: z.string(),
  ts: z.number(),
  phase: z.string(),
  tool: z.enum([
    "firecrawl",
    "exa",
    "xai",
    "fal",
    "daytona",
    "convex",
    "system",
  ]),
  level: z.enum(["info", "cmd", "stdout", "stderr", "error", "success"]),
  msg: z.string(),
});
export type TraceEvent = z.infer<typeof TraceEventSchema>;

export const RunStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const RunSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  status: RunStatusSchema,
  input: z.object({
    url: z.string(),
    icp: z.string().optional(),
    goal: GoalSchema.default("launch"),
  }),
  product: ProductBriefSchema.optional(),
  research: TrendResearchSchema.optional(),
  campaign: CampaignSchema.optional(),
  creatives: z.array(CreativeSchema).default([]),
  events: z.array(TraceEventSchema).default([]),
  daytona: z
    .object({
      sandboxId: z.string().optional(),
      previewUrl: z.string().optional(),
      zipPath: z.string().optional(),
      zipReady: z.boolean().default(false),
      mock: z.boolean().default(true),
    })
    .optional(),
  providers: z.object({
    firecrawl: z.enum(["live", "mock"]),
    exa: z.enum(["live", "mock"]),
    xai: z.enum(["live", "mock"]),
    fal: z.enum(["live", "mock"]),
    daytona: z.enum(["live", "mock"]),
  }),
  error: z.string().optional(),
});
export type Run = z.infer<typeof RunSchema>;

export const CreateRunInputSchema = z.object({
  url: z.string().url(),
  icp: z.string().optional(),
  goal: GoalSchema.default("launch"),
});
export type CreateRunInput = z.infer<typeof CreateRunInputSchema>;
