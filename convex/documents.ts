import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getDocument = query({
  args: { path: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_path", (q: any) => q.eq("path", args.path))
      .first();
  },
});

export const listDocuments = query({
    args: {},
    handler: async (ctx: any) => {
      return await ctx.db.query("documents").collect();
    },
});

export const saveDocument = mutation({
  args: { path: v.string(), content: v.string() },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_path", (q: any) => q.eq("path", args.path))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("documents", {
        path: args.path,
        content: args.content,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteDocument = mutation({
  args: { path: v.string() },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_path", (q: any) => q.eq("path", args.path))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
