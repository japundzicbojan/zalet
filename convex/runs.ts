import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Deploy with: npx convex dev  (generates ./_generated)
export const upsert = mutation({
  args: {
    runId: v.string(),
    status: v.string(),
    payload: v.any(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("runs")
      .withIndex("by_runId", (q) => q.eq("runId", args.runId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        payload: args.payload,
        updatedAt: args.updatedAt,
      });
      return existing._id;
    }
    return await ctx.db.insert("runs", {
      runId: args.runId,
      status: args.status,
      payload: args.payload,
      updatedAt: args.updatedAt,
    });
  },
});

export const getByRunId = query({
  args: { runId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("runs")
      .withIndex("by_runId", (q) => q.eq("runId", args.runId))
      .unique();
  },
});
