/**
 * Convex Functions: Merchants
 * Manages merchant normalization and directory
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Known merchants database (seed data)
 */
const KNOWN_MERCHANTS = [
  {
    displayName: "Netflix",
    aliases: ["NETFLIX", "NETFLIX.COM", "NFLX"],
    knownProviderKey: "netflix",
    typicalCadence: "monthly",
    website: "https://www.netflix.com",
  },
  {
    displayName: "Spotify",
    aliases: ["SPOTIFY", "SPOTIFY.COM", "SPOTIFY USA"],
    knownProviderKey: "spotify",
    typicalCadence: "monthly",
    website: "https://www.spotify.com",
  },
  {
    displayName: "Amazon Prime",
    aliases: ["AMAZON PRIME", "AMZN PRIME", "PRIME VIDEO"],
    knownProviderKey: "amazon_prime",
    typicalCadence: "monthly",
    website: "https://www.amazon.com/prime",
  },
  {
    displayName: "Apple",
    aliases: ["APPLE.COM", "APPLE COM BILL", "ITUNES"],
    knownProviderKey: "apple",
    typicalCadence: "monthly",
    website: "https://www.apple.com",
  },
  {
    displayName: "Disney+",
    aliases: ["DISNEY PLUS", "DISNEYPLUS", "DISNEY+"],
    knownProviderKey: "disney_plus",
    typicalCadence: "monthly",
    website: "https://www.disneyplus.com",
  },
  {
    displayName: "Hulu",
    aliases: ["HULU", "HULU.COM"],
    knownProviderKey: "hulu",
    typicalCadence: "monthly",
    website: "https://www.hulu.com",
  },
  {
    displayName: "YouTube Premium",
    aliases: ["YOUTUBE PREMIUM", "YOUTUBE", "GOOGLE YOUTUBE"],
    knownProviderKey: "youtube_premium",
    typicalCadence: "monthly",
    website: "https://www.youtube.com/premium",
  },
  {
    displayName: "Adobe Creative Cloud",
    aliases: ["ADOBE", "ADOBE CREATIVE", "ADOBE CC"],
    knownProviderKey: "adobe",
    typicalCadence: "monthly",
    website: "https://www.adobe.com",
  },
  {
    displayName: "Microsoft 365",
    aliases: ["MICROSOFT", "OFFICE 365", "MICROSOFT 365"],
    knownProviderKey: "microsoft_365",
    typicalCadence: "monthly",
    website: "https://www.microsoft.com/microsoft-365",
  },
  {
    displayName: "Dropbox",
    aliases: ["DROPBOX", "DROPBOX.COM"],
    knownProviderKey: "dropbox",
    typicalCadence: "monthly",
    website: "https://www.dropbox.com",
  },
];

/**
 * Seed known merchants (run once)
 */
export const seedKnownMerchants = mutation({
  args: {},
  handler: async (ctx) => {
    const seeded = [];

    for (const merchant of KNOWN_MERCHANTS) {
      // Check if already exists
      const existing = await ctx.db
        .query("merchants")
        .withIndex("by_provider_key", (q) =>
          q.eq("knownProviderKey", merchant.knownProviderKey)
        )
        .first();

      if (!existing) {
        const id = await ctx.db.insert("merchants", {
          displayName: merchant.displayName,
          aliases: merchant.aliases,
          knownProviderKey: merchant.knownProviderKey,
          typicalCadence: merchant.typicalCadence,
          website: merchant.website,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        seeded.push(id);
      }
    }

    return { seeded: seeded.length };
  },
});

/**
 * Find or create merchant from transaction
 */
export const findOrCreate = mutation({
  args: {
    merchantName: v.string(),
    merchantNameNormalized: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.merchantNameNormalized) {
      return null;
    }

    // Try to match against known merchants by alias
    const allMerchants = await ctx.db.query("merchants").collect();

    for (const merchant of allMerchants) {
      // Check if normalized name matches any alias
      const matchesAlias = merchant.aliases.some((alias) =>
        args.merchantNameNormalized.includes(alias)
      );

      if (matchesAlias) {
        return merchant._id;
      }
    }

    // Check if we already have this normalized name
    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_name", (q) => q.eq("displayName", args.merchantNameNormalized))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new merchant
    const merchantId = await ctx.db.insert("merchants", {
      displayName: args.merchantNameNormalized,
      aliases: [args.merchantNameNormalized, args.merchantName],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return merchantId;
  },
});

/**
 * Get merchant by ID
 */
export const getById = query({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.merchantId);
  },
});

/**
 * Search merchants
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const query = args.query.toUpperCase();
    const allMerchants = await ctx.db.query("merchants").collect();

    return allMerchants.filter(
      (m) =>
        m.displayName.toUpperCase().includes(query) ||
        m.aliases.some((alias) => alias.toUpperCase().includes(query))
    );
  },
});

/**
 * List all merchants
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("merchants").collect();
  },
});

/**
 * Update merchant alias list
 */
export const addAlias = mutation({
  args: {
    merchantId: v.id("merchants"),
    alias: v.string(),
  },
  handler: async (ctx, args) => {
    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const aliases = merchant.aliases || [];
    if (!aliases.includes(args.alias)) {
      aliases.push(args.alias);
      await ctx.db.patch(args.merchantId, {
        aliases,
        updatedAt: Date.now(),
      });
    }
  },
});
