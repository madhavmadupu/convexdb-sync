import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    path: v.string(),
    content: v.string(),
    updatedAt: v.number(),
  }).index("by_path", ["path"]),
});
