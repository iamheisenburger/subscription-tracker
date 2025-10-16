# 📋 Your TODO List (External Services Setup)

## ✅ What's Already Done (By Me)
- ✅ Detection engine with subscription recognition
- ✅ Price change monitoring (daily cron)
- ✅ Duplicate charge detection
- ✅ Schema updates (added `syncCursor` field)
- ✅ Webhook integration (calls detection after sync)
- ✅ Test suite for validation
- ✅ Merchant normalization with known providers
- ✅ Complete documentation

---

## 🔧 What You Need to Do (30-45 minutes)

### 1. Set Up Clerk Subscription Products (20 mins)

**Go to**: https://dashboard.clerk.com/apps/app_2qFBXAKPVeUFjXp5dxzD5yjqOhH/instances/ins_2qFBXAOjZ5CdVwKSQATbovC7Muz

**Create 4 new products:**

#### Product 1: Plus
- Name: `Plus`
- Product ID: `plus`
- Monthly: $5/month
- Annual: $35/year
- Metadata:
  ```json
  {
    "tier": "plus",
    "connectionsIncluded": 0,
    "canLinkBanks": false
  }
  ```

#### Product 2: Automate
- Name: `Automate`
- Product ID: `automate`
- Monthly: $9/month
- Annual: $72/year
- Metadata:
  ```json
  {
    "tier": "automate",
    "connectionsIncluded": 1,
    "canLinkBanks": true
  }
  ```

#### Product 3: Family
- Name: `Family`
- Product ID: `family`
- Monthly: $15/month
- Annual: $119/year
- Metadata:
  ```json
  {
    "tier": "family",
    "connectionsIncluded": 3,
    "canLinkBanks": true,
    "maxProfiles": 5
  }
  ```

#### Product 4: Teams
- Name: `Teams`
- Product ID: `teams`
- Monthly: $49/month
- Annual: $470/year
- Metadata:
  ```json
  {
    "tier": "teams",
    "connectionsIncluded": 5,
    "canLinkBanks": true,
    "maxSeats": 5
  }
  ```

**✅ Checklist:**
- [ ] Plus product created with metadata
- [ ] Automate product created with metadata
- [ ] Family product created with metadata
- [ ] Teams product created with metadata
- [ ] Webhook configured to send subscription events

---

### 2. Set Up Plaid Sandbox Account (15 mins)

**Step 1: Sign Up**
- Go to: https://dashboard.plaid.com/signup
- Create free developer account
- Verify email

**Step 2: Get Credentials**
- Go to: **Team Settings → Keys**
- Copy:
  - `client_id` (starts with `6...`)
  - `secret` (Sandbox secret key, starts with `...`)

**Step 3: Configure Webhook**
- Go to: **Team Settings → Webhooks**
- Add webhook URL: `https://your-vercel-url.vercel.app/api/plaid/webhook`
- Subscribe to: `TRANSACTIONS` and `ITEM` events

**✅ Checklist:**
- [ ] Plaid account created
- [ ] Client ID copied
- [ ] Sandbox secret copied
- [ ] Webhook URL configured

---

### 3. Update Environment Variables (5 mins)

**Edit `.env.local`** and add:

```bash
# Plaid Sandbox Credentials
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox

# Your App URL
NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
```

**✅ Checklist:**
- [ ] PLAID_CLIENT_ID added
- [ ] PLAID_SECRET added
- [ ] PLAID_ENV=sandbox set
- [ ] NEXT_PUBLIC_SITE_URL added

---

### 4. Deploy Changes to Convex (5 mins)

**Run these commands:**

```bash
cd subscription-tracker-working
npx convex dev
```

This will:
- Push new `detection.ts` functions
- Update schema with `syncCursor` field
- Activate price change detection cron

**Wait for**: "✓ Deployment successful"

**✅ Checklist:**
- [ ] `npx convex dev` ran successfully
- [ ] No schema errors
- [ ] New `detection` module visible in dashboard

---

## 🧪 Quick Test (5 mins)

Once everything is set up:

1. **Upgrade test user to Automate** (in Clerk dashboard)
2. **Start your dev server**:
   ```bash
   npm run dev
   ```
3. **Test Plaid Link token creation**:
   - Go to Settings page
   - Open browser console
   - Run:
     ```javascript
     fetch('/api/plaid/create-link-token', { method: 'POST' })
       .then(r => r.json())
       .then(console.log)
     ```
   - Should return: `{ linkToken: "link-sandbox-..." }`

**✅ Checklist:**
- [ ] Link token created successfully
- [ ] No errors in console
- [ ] Ready for UI development

---

## 📄 Reference Documents

- **`SETUP_REQUIRED.md`** - Detailed setup guide
- **`DETECTION_ENGINE_BUILT.md`** - What I built + how it works
- **`BANK_INTEGRATION_PROGRESS.md`** - Phase 1 progress tracker

---

## ⏭️ What's Next (After Your Setup)

Once you've completed the above, let me know and I'll build:

1. **Plaid Link UI Component** - Connect bank button with modal
2. **Bank Connections List** - Show connected banks with status
3. **Detection Review Interface** - Accept/dismiss candidates
4. **Tier Gating Middleware** - Enforce connection limits
5. **Upgrade Modals** - Upsell for overages ($3/mo per bank)

**Estimated time**: 2-3 hours to build all UI components

---

## 🆘 Need Help?

If you get stuck:

### Clerk Issues:
- Docs: https://clerk.com/docs/billing/custom-pricing
- Dashboard: https://dashboard.clerk.com/support

### Plaid Issues:
- Docs: https://plaid.com/docs/quickstart/
- Discord: https://plaid.com/discord/
- Test credentials: Username `user_good`, Password `pass_good`

### Convex Issues:
- Docs: https://docs.convex.dev/
- Dashboard: https://dashboard.convex.dev/

---

## ✨ You're Almost There!

**Phase 1 is 80% complete**. Just need:
- 🔧 External services configured (you're doing this now)
- 🎨 UI components (I'll build next)
- 🔒 Tier gating (I'll build next)

Then you'll have a **fully automated subscription tracker** with bank connections! 🚀
