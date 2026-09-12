export function providerMode() {
  return {
    firecrawl: process.env.FIRECRAWL_API_KEY ? ("live" as const) : ("mock" as const),
    exa: process.env.EXA_API_KEY ? ("live" as const) : ("mock" as const),
    xai: process.env.XAI_API_KEY ? ("live" as const) : ("mock" as const),
    fal:
      process.env.FAL_KEY || process.env.FAL_API_KEY
        ? ("live" as const)
        : ("mock" as const),
    daytona: process.env.DAYTONA_API_KEY ? ("live" as const) : ("mock" as const),
    convex: process.env.NEXT_PUBLIC_CONVEX_URL
      ? ("live" as const)
      : ("mock" as const),
  };
}

export function falKey() {
  return process.env.FAL_KEY || process.env.FAL_API_KEY || "";
}
