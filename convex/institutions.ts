/**
 * Convex Functions: Institutions
 * Manages Plaid institution metadata
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create or update an institution
 */
export const createOrUpdate = mutation({
  args: {
    plaidInstitutionId: v.string(),
    name: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    url: v.optional(v.string()),
    countryCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if institution already exists
    const existing = await ctx.db
      .query("institutions")
      .withIndex("by_plaid_id", (q) => q.eq("plaidInstitutionId", args.plaidInstitutionId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        name: args.name,
        logoUrl: args.logoUrl,
        primaryColor: args.primaryColor,
        url: args.url,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new
    const institutionId = await ctx.db.insert("institutions", {
      plaidInstitutionId: args.plaidInstitutionId,
      name: args.name,
      logoUrl: args.logoUrl,
      primaryColor: args.primaryColor,
      url: args.url,
      countryCode: args.countryCode,
      products: ["transactions"], // Default products
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return institutionId;
  },
});

/**
 * Get institution by Plaid ID
 */
export const getByPlaidId = query({
  args: { plaidInstitutionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("institutions")
      .withIndex("by_plaid_id", (q) => q.eq("plaidInstitutionId", args.plaidInstitutionId))
      .first();
  },
});

/**
 * Get institution by ID
 */
export const getById = query({
  args: { institutionId: v.id("institutions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.institutionId);
  },
});

/**
 * List all institutions
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("institutions").collect();
  },
});
