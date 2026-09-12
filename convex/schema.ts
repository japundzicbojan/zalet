import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Ready for Convex live board. Wire NEXT_PUBLIC_CONVEX_URL + npx convex dev.
export default defineSchema({
  runs: defineTable({
    runId: v.string(),
    status: v.string(),
    payload: v.any(),
    updatedAt: v.number(),
  }).index("by_runId", ["runId"]),
});
