# 🚀 External Service Setup Required

## Overview
Before the bank integration features can work, you need to configure **Clerk pricing tiers** and **Plaid sandbox credentials**. This document walks you through both.

---

## 1️⃣ Clerk Setup: Create New Pricing Tiers

### Current Tiers (Already Configured)
- ✅ **Free** (free_user)
- ✅ **Premium** (premium_user) - Legacy tier

### New Tiers to Create

You need to create 4 new subscription products in Clerk to match the Phase 1 pricing:

#### **Tier 1: Plus**
- **Product ID**: `plus`
- **Display Name**: Plus
- **Monthly Price**: $5/month
- **Annual Price**: $35/year (save $25)
- **Metadata** (add these as custom fields):
  ```json
  {
    "tier": "plus",
    "connectionsIncluded": 0,
    "canLinkBanks": false
  }
  ```

#### **Tier 2: Automate**
- **Product ID**: `automate`
- **Display Name**: Automate
- **Monthly Price**: $9/month
- **Annual Price**: $72/year (save $36)
- **Metadata**:
  ```json
  {
    "tier": "automate",
    "connectionsIncluded": 1,
    "canLinkBanks": true
  }
  ```

#### **Tier 3: Family**
- **Product ID**: `family`
- **Display Name**: Family
- **Monthly Price**: $15/month
- **Annual Price**: $119/year (save $61)
- **Metadata**:
  ```json
  {
    "tier": "family",
    "connectionsIncluded": 3,
    "canLinkBanks": true,
    "maxProfiles": 5
  }
  ```

#### **Tier 4: Teams**
- **Product ID**: `teams`
- **Display Name**: Teams
- **Monthly Price**: $49/month
- **Annual Price**: $470/year (save $118)
- **Metadata**:
  ```json
  {
    "tier": "teams",
    "connectionsIncluded": 5,
    "canLinkBanks": true,
    "maxSeats": 5
  }
  ```

### How to Set Up in Clerk Dashboard

1. Go to https://dashboard.clerk.com/
2. Select your project: **tidy-meerkat-48**
3. Navigate to **Configure → Products**
4. Click **Create Product** for each tier above
5. Add the metadata fields to each product
6. Configure payment provider (Stripe) if not already done
7. Set up webhook to notify your app of subscription changes

### Webhook Configuration

Ensure your Clerk webhook is configured to send these events:
- `subscription.created`
- `subscription.updated`
- `subscription.deleted`
- `user.updated`

Webhook URL: `https://your-app.vercel.app/api/webhooks/clerk`

---

## 2️⃣ Plaid Setup: Get Sandbox Credentials

### Step 1: Create Plaid Account
1. Go to https://dashboard.plaid.com/signup
2. Sign up for a **free developer account**
3. Verify your email

### Step 2: Get API Keys
1. Log in to https://dashboard.plaid.com/
2. Navigate to **Team Settings → Keys**
3. Copy your **Sandbox** credentials:
   - `client_id`
   - `secret` (Sandbox secret key)

### Step 3: Configure Webhook URL

1. In Plaid Dashboard, go to **Team Settings → Webhooks**
2. Set your webhook URL to:
   ```
   https://your-app.vercel.app/api/plaid/webhook
   ```
   *(Replace with your actual Vercel deployment URL)*

3. Subscribe to these webhook events:
   - ✅ `TRANSACTIONS` - All transaction events
   - ✅ `ITEM` - Connection status changes

### Step 4: Add to Environment Variables

Add these to your `.env.local` file:

```bash
# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox

# Your app URL (for webhook callbacks)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### Important Notes:
- Start with **Sandbox** environment (free, unlimited testing)
- Sandbox uses fake banks (Chase, Wells Fargo, etc.) with test credentials:
  - Username: `user_good`
  - Password: `pass_good`
- When ready for production:
  - Switch `PLAID_ENV=development` (requires Plaid approval + $0.30/user/month)
  - Then `PLAID_ENV=production` (requires full compliance review)

---

## 3️⃣ Deploy Schema Changes to Convex

Since we updated the schema, you need to push changes to Convex:

```bash
cd subscription-tracker-working
npx convex dev
```

This will:
1. Push the new `detection.ts` functions
2. Add the `syncCursor` field to `bankConnections` table
3. Update the cron job for price change detection

---

## 4️⃣ Verify Setup

### Test Checklist:

#### Clerk:
- [ ] 4 new products created (Plus, Automate, Family, Teams)
- [ ] Pricing matches specification
- [ ] Metadata added to each product
- [ ] Webhook configured and sending events

#### Plaid:
- [ ] Account created and verified
- [ ] Sandbox `client_id` and `secret` copied
- [ ] Webhook URL configured in Plaid Dashboard
- [ ] Environment variables added to `.env.local`

#### Convex:
- [ ] `npx convex dev` ran successfully
- [ ] New `detection` module shows in Convex Dashboard
- [ ] `bankConnections` schema shows `syncCursor` field
- [ ] Cron job for price detection is active

---

## 5️⃣ Test the Flow (Sandbox)

Once everything is configured:

1. **Upgrade a test user to Automate tier** (in Clerk dashboard)
2. **Go to Settings** in your app
3. **Click "Connect Bank"** (once UI is built)
4. **Select "Chase" bank** in Plaid Link
5. **Use test credentials**:
   - Username: `user_good`
   - Password: `pass_good`
   - MFA: `1234`
6. **Wait for sync** (should see transactions in Convex)
7. **Check detection candidates** in Convex dashboard
8. **Verify alerts** are queued for detected subscriptions

---

## 6️⃣ Environment Variable Template

Here's your complete `.env.local` file template:

```bash
# ===== EXISTING VARS =====
CONVEX_DEPLOYMENT=dev:perfect-clownfish-417
NEXT_PUBLIC_CONVEX_URL=https://perfect-clownfish-417.convex.cloud

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dGlkeS1tZWVya2F0LTQ4LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_KAUOKaiIZXoGd2knMSRSfXhLBjdpeFFAkXFHeJ7YtL
CLERK_JWT_ISSUER_DOMAIN=https://tidy-meerkat-48.clerk.accounts.dev

RESEND_API_KEY=re_GBXG5nnV_8zo26xNuSjgV4FoZyoXKAWFt
RESEND_FROM_EMAIL=SubWise <noreply@usesubwise.app>

# ===== NEW VARS NEEDED =====
# Plaid Sandbox Credentials
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_sandbox_secret_here
PLAID_ENV=sandbox

# App URL for webhooks
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

---

## 7️⃣ Next Steps (After Setup)

Once you've configured Clerk and Plaid:

1. ✅ **Detection engine is built** (just completed)
2. ⏳ **Build UI components** (Plaid Link button, bank list, detection review)
3. ⏳ **Add tier gating middleware** (enforce connection limits)
4. ⏳ **Test end-to-end flow** (connect → sync → detect → accept)
5. ⏳ **Deploy to production** (switch Plaid to production mode)

---

## 📞 Support

### Plaid Support:
- Docs: https://plaid.com/docs/
- Discord: https://plaid.com/discord/
- Email: support@plaid.com

### Clerk Support:
- Docs: https://clerk.com/docs
- Discord: https://clerk.com/discord
- Dashboard: https://dashboard.clerk.com/support

---

## ⚠️ Important Security Notes

1. **Never commit secrets** to git
2. **Use environment variables** for all API keys
3. **Rotate keys** if exposed
4. **Enable Plaid webhook signature verification** (we'll add this in Phase 2)
5. **Use Convex encryption** for access tokens (already configured)

---

## 🎯 What's Already Built (You're 80% Done!)

✅ Complete Plaid integration (API routes, webhooks, sync)
✅ Detection engine with confidence scoring
✅ Merchant normalization with 10+ known services
✅ Transaction deduplication
✅ Price change detection (daily cron)
✅ Duplicate charge detection
✅ Alert queueing for new subscriptions
✅ Audit logging
✅ Schema with all 13 new tables
✅ Plan entitlements for all tiers

🔲 Missing:
- Plaid credentials (you'll add now)
- Clerk tier configuration (you'll add now)
- UI components (next session)
- Tier gating (next session)

**You're almost there!** 🚀
