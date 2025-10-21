/**
 * Admin Query Functions
 */

import { query } from "./_generated/server";

/**
 * Get all users - for finding Clerk ID
 */
export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      clerkId: u.clerkId,
      email: u.email,
      tier: u.tier,
      emailConnectionsUsedLifetime: u.emailConnectionsUsedLifetime,
    }));
  },
});
