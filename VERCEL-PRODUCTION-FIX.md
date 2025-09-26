# 🚀 VERCEL PRODUCTION FIX - TIER DETECTION

## ✅ Plan ID Identified

Your Premium Plan ID: `cplan_32xfUNaavPmbOI3V7AtOq7EiPqM`

## 🔧 IMMEDIATE VERCEL FIX

Since you're testing on Vercel production (`usesubwise.app`), you need to:

### Step 1: Verify Environment Variable in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `subscription-tracker` project
3. Go to **Settings** → **Environment Variables**
4. Confirm `NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID` is set to: `cplan_32xfUNaavPmbOI3V7AtOq7EiPqM`

### Step 2: Redeploy to Apply Changes
Even if the environment variable exists, you need to redeploy for it to take effect:

```bash
# Option 1: Force redeploy (trigger new build)
git commit --allow-empty -m "Force redeploy for env var fix"
git push origin main

# Option 2: Redeploy from Vercel dashboard
# Go to Deployments → Click "..." → Redeploy
```

### Step 3: Test Production Webhook
After redeployment, test your webhook configuration:

```
GET https://usesubwise.app/api/debug/webhook-check
```

## 🔍 PRODUCTION DEBUGGING URLS

I've created these endpoints for your production testing:

### Check Webhook Configuration
```
https://usesubwise.app/api/debug/webhook-check
```
This shows if your plan ID matches what webhooks receive.

### Debug Tier Status  
```
https://usesubwise.app/debug-tier
```
Complete tier detection analysis and manual sync.

### Force Tier Sync
```
POST https://usesubwise.app/api/sync/tier
```
Manual tier sync that bypasses webhook dependencies.

## 🎯 EXPECTED WEBHOOK BEHAVIOR

With plan ID `cplan_32xfUNaavPmbOI3V7AtOq7EiPqM` properly set, your webhook should:

1. ✅ Receive `subscription.updated` event
2. ✅ Extract `plan_id: "cplan_32xfUNaavPmbOI3V7AtOq7EiPqM"`  
3. ✅ Match against environment variable
4. ✅ Upgrade user to premium_user
5. ✅ Update Clerk metadata
6. ✅ Update Convex database

## 🚨 QUICK PRODUCTION TEST

Right now, test if it's working:

1. **Visit:** https://usesubwise.app/debug-tier
2. **Check:** Does it show you as premium or free?  
3. **If free:** Click "Force Sync Tier"
4. **Result:** Should upgrade you to premium immediately

## 📊 WEBHOOK SUCCESS INDICATORS

After the fix, your Clerk webhook logs should show:
```
✅ User upgraded to premium successfully
```

Instead of:
```
❌ PLAN ID MISMATCH - Not upgrading user
```

## 🔄 DEPLOYMENT CHECKLIST

- [ ] Environment variable `NEXT_PUBLIC_CLERK_PREMIUM_PLAN_ID=cplan_32xfUNaavPmbOI3V7AtOq7EiPqM` set in Vercel
- [ ] Project redeployed after environment variable update
- [ ] Webhook debug endpoint shows plan ID match
- [ ] Manual sync shows premium status
- [ ] Premium features accessible in dashboard

## 🎉 IMMEDIATE ACTION

**Test right now:**
1. Go to: https://usesubwise.app/debug-tier
2. Click "Force Sync Tier"
3. This should upgrade you to premium instantly

The webhook issue will be permanently fixed after your next deployment with the correct environment variable!
