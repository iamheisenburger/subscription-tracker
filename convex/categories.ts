import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List categories for the current user
export const listCategories = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Create a new category (premium only)
export const createCategory = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.tier !== "premium_user") throw new Error("Premium required");

    const now = Date.now();

    // Normalize name and avoid duplicates per user (case-insensitive)
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const existingMatch = existing.find((c) => c.name.trim().toLowerCase() === args.name.trim().toLowerCase());
    if (existingMatch) {
      return existingMatch._id;
    }

    const id = await ctx.db.insert("categories", {
      userId: user._id,
      name: args.name.trim(),
      color: args.color,
      icon: args.icon,
      createdAt: now,
    });

    return id;
  },
});

// Update a category (premium only)
export const updateCategory = mutation({
  args: {
    clerkId: v.string(),
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.tier !== "premium_user") throw new Error("Premium required");

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== user._id) throw new Error("Unauthorized");

    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.color !== undefined) patch.color = args.color;
    if (args.icon !== undefined) patch.icon = args.icon;

    await ctx.db.patch(args.categoryId, patch);
    return args.categoryId;
  },
});

// Delete a category (premium only)
export const deleteCategory = mutation({
  args: { clerkId: v.string(), categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.tier !== "premium_user") throw new Error("Premium required");

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.categoryId);
    return { success: true };
  },
});


