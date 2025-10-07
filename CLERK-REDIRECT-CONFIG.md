# Clerk Redirect Configuration Guide

## 🎯 Important: Clerk Dashboard Settings

For smooth navigation after signup/subscription, you need to configure these URLs in your **Clerk Dashboard**:

### **1. Navigate to Clerk Dashboard → Configure → Paths**

Set these paths:

```
Sign-in URL: /sign-in
Sign-up URL: /sign-up
Home URL: /dashboard
After sign-in URL: /dashboard
After sign-up URL: /dashboard
```

### **2. Navigate to Clerk Dashboard → Configure → Billing**

If you see billing settings, set:

```
After subscription URL: /dashboard
Cancellation URL: /dashboard
```

---

## 🔄 How Redirects Work Now

### **Free Plan Signup Flow:**
```
1. User clicks "Subscribe" (Free plan)
   ↓
2. Redirects to /sign-up (if not signed in)
   ↓
3. User completes signup
   ↓
4. Clerk automatically redirects to /dashboard
   ↓
5. User sees free tier features ✅
```

### **Premium Trial Flow:**
```
1. User clicks "Start 7-day Free Trial"
   ↓
2. Redirects to /sign-up (if not signed in)
   ↓
3. User completes signup
   ↓
4. Clerk shows checkout/billing form
   ↓
5. User completes checkout (Clerk payment gateway)
   ↓
6. Webhook fires → Upgrades user to premium
   ↓
7. Clerk redirects to /dashboard
   ↓
8. User sees premium features unlocked ✅
```

### **Already Signed In Flow:**
```
1. User clicks "Start 7-day Free Trial"
   ↓
2. Clerk shows checkout directly (no signup needed)
   ↓
3. User completes checkout
   ↓
4. Webhook fires → Upgrades user to premium
   ↓
5. Clerk redirects to /dashboard
   ↓
6. User sees premium features ✅
```

---

## 🚨 Common Issues & Fixes

### **Issue: User stuck on landing page after signup**

**Cause:** Clerk Dashboard URLs not configured

**Fix:** 
1. Go to Clerk Dashboard → Configure → Paths
2. Set "After sign-up URL" to `/dashboard`
3. Set "Home URL" to `/dashboard`

---

### **Issue: User redirected to wrong page after subscription**

**Cause:** Billing redirect URL not set

**Fix:**
1. Go to Clerk Dashboard → Configure → Billing
2. Set "After subscription URL" to `/dashboard`

---

### **Issue: Redirect loop between signup and landing**

**Cause:** Conflicting redirect URLs in code vs dashboard

**Fix:**
1. Make sure code has: `forceRedirectUrl="/dashboard"`
2. Make sure dashboard has: After sign-up URL = `/dashboard`
3. Both must match!

---

## 📝 Code Configuration

Our app is configured with these redirects:

**Sign Up (`/sign-up/[[...sign-up]]/page.tsx`):**
```tsx
<SignUp
  forceRedirectUrl="/dashboard"
  signUpUrl="/sign-up"
  fallbackRedirectUrl="/dashboard"
/>
```

**Sign In (`/sign-in/[[...sign-in]]/page.tsx`):**
```tsx
<SignIn
  forceRedirectUrl="/dashboard"
  signInUrl="/sign-in"
  fallbackRedirectUrl="/dashboard"
/>
```

**Why multiple redirect props?**
- `forceRedirectUrl` - Forces redirect after completion (highest priority)
- `signUpUrl` / `signInUrl` - Tells Clerk which URL to use for the form
- `fallbackRedirectUrl` - Backup if other redirects fail

---

## 🎨 PricingTable Redirect (Automatic)

The `<PricingTable>` component automatically handles redirects:

1. **Free plan button** → Redirects to `/sign-up` (via Clerk)
2. **After signup** → Dashboard (via our forceRedirectUrl)
3. **Premium button** → Shows checkout, then Dashboard

**No manual configuration needed in code** - Clerk handles this based on your dashboard settings.

---

## ✅ Testing Checklist

Test these flows to verify smooth navigation:

**Test 1: Free Signup (New User)**
```
1. Go to landing page (not signed in)
2. Click "Subscribe" (Free plan)
3. Complete signup form
4. Should redirect to /dashboard immediately ✅
5. Free tier features visible
```

**Test 2: Premium Signup (New User)**
```
1. Go to landing page (not signed in)
2. Click "Start 7-day Free Trial"
3. Complete signup form
4. Complete checkout (test payment)
5. Should redirect to /dashboard ✅
6. Premium features unlocked
```

**Test 3: Premium Upgrade (Existing Free User)**
```
1. Sign in as free user
2. Go to /dashboard/upgrade
3. Click "Start 7-day Free Trial"
4. Complete checkout
5. Should redirect to /dashboard ✅
6. Premium features now visible
```

**Test 4: Sign Out and Back In**
```
1. Sign out (top right)
2. Should redirect to landing page / ✅
3. Sign back in
4. Should redirect to /dashboard ✅
5. Tier preserved (free or premium)
```

---

## 🔧 Environment Variables

Make sure these are set in Vercel:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk Webhook (for tier upgrades)
CLERK_WEBHOOK_SECRET=whsec_xxx

# Your app URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://usesubwise.app
```

---

## 🎯 Production Considerations

When switching to production:

1. ✅ Update Clerk Dashboard URLs to production domain
2. ✅ Update environment variables with production keys
3. ✅ Test all redirect flows with real Stripe checkout
4. ✅ Verify webhook fires and upgrades work
5. ✅ Can then switch back to custom pricing UI (keep Clerk checkout)

---

**Current Status:**
- ✅ Code configured for dashboard redirects
- ⚠️ Clerk Dashboard paths need manual configuration (one-time setup)
- ✅ PricingTable component integrated
- ✅ Webhook ready for tier upgrades



