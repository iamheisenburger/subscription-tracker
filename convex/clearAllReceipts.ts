import { mutation } from "./_generated/server";

export const deleteAllEmailReceipts = mutation({
  handler: async (ctx) => {
    console.log(`🗑️ Deleting ALL email receipts from database...`);

    const receipts = await ctx.db.query("emailReceipts").collect();

    console.log(`📄 Found ${receipts.length} receipts to delete`);

    let deleted = 0;
    for (const receipt of receipts) {
      await ctx.db.delete(receipt._id);
      deleted++;
    }

    console.log(`✅ Deleted ${deleted} receipts`);

    return {
      deleted,
      message: `Successfully deleted all ${deleted} email receipts`,
    };
  },
});
