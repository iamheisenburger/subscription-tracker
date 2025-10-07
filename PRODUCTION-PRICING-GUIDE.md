# Production Pricing Table Implementation Guide

## 🎯 Overview

This guide explains how to use your custom pricing table (CustomPricingV2) with real Clerk billing in production.

---

## 📋 The Strategy

**Your custom pricing table IS the UI** - it just needs to trigger Clerk's checkout flow programmatically.

```
Custom Pricing UI (your beautiful design)
    ↓
User clicks "Start Trial"
    ↓
Redirect to Clerk Checkout URL
    ↓
Clerk handles payment with Stripe
    ↓
Webhook upgrades user
    ↓
User gets premium features
```

---

## 🔧 Production Implementation

### **Option 1: Clerk Checkout URLs (Recommended - Easiest)**

Modify your CustomPricingV2 to use Clerk's checkout URLs:

```tsx
// src/components/landing/custom-pricing-v2-production.tsx
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export const CustomPricingV2Production = () => {
  const { user, isSignedIn } = useUser();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  
  // These will come from your Clerk Dashboard after setting up plans
  const CLERK_CHECKOUT_URLS = {
    monthly: process.env.NEXT_PUBLIC_CLERK_CHECKOUT_URL_MONTHLY!,
    annual: process.env.NEXT_PUBLIC_CLERK_CHECKOUT_URL_ANNUAL!,
  };

  const handleStartTrial = () => {
    if (!isSignedIn) {
      // Redirect to sign-up with return URL
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(CLERK_CHECKOUT_URLS[billingCycle])}`;
    } else {
      // Already signed in, go straight to checkout
      window.location.href = CLERK_CHECKOUT_URLS[billingCycle];
    }
  };

  return (
    // ... your existing beautiful UI ...
    <Button onClick={handleStartTrial}>
      Start 7-day free trial
    </Button>
  );
};
```

**Environment Variables to Add:**
```env
# Get these from Clerk Dashboard → Billing → Plans → "Copy checkout URL"
NEXT_PUBLIC_CLERK_CHECKOUT_URL_MONTHLY=https://your-app.clerk.accounts.dev/subscribe/plan_xxx
NEXT_PUBLIC_CLERK_CHECKOUT_URL_ANNUAL=https://your-app.clerk.accounts.dev/subscribe/plan_yyy
```

---

### **Option 2: Programmatic Checkout (More Control)**

Use Clerk's SDK to create checkout sessions:

```tsx
// src/app/api/create-checkout-session/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId, billingCycle } = await req.json();

  // Create checkout session via Clerk API
  const checkoutUrl = `${process.env.CLERK_FRONTEND_API}/subscribe/${planId}?userId=${userId}`;

  return NextResponse.json({ checkoutUrl });
}
```

Then in your component:
```tsx
const handleStartTrial = async () => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ 
      planId: billingCycle === 'monthly' ? 'plan_xxx' : 'plan_yyy',
      billingCycle 
    })
  });
  
  const { checkoutUrl } = await response.json();
  window.location.href = checkoutUrl;
};
```

---

## 🚀 Migration Plan

### **Phase 1: Development Testing (Now)**
1. Use `ClerkPricingTemporary` component
2. Set up plans in Clerk Dashboard (Development mode)
3. Test billing flow with Clerk's payment gateway
4. Verify webhooks are working

### **Phase 2: Beta Testing (Soon)**
1. Keep `ClerkPricingTemporary` 
2. Invite real users to test free tier
3. No billing testing needed yet
4. Collect feedback on features

### **Phase 3: Production Launch (Later)**
1. Connect Stripe to Clerk (Production mode)
2. Switch to `CustomPricingV2Production`
3. Use Clerk checkout URLs from production instance
4. Real payments start flowing

---

## 📝 File Changes Summary

**Keep These Files (Don't Delete):**
- ✅ `custom-pricing-v2.tsx` - Your beautiful design (will become production version)
- ✅ `pricing.tsx` - Main pricing page wrapper

**Temporary Files (For Development Testing):**
- 🔄 `clerk-pricing-temporary.tsx` - New file for testing
- 🔄 Swap this in `pricing.tsx` temporarily

**Delete After Testing:**
- ❌ `/api/admin/set-subscription-type` - Development bypass
- ❌ `mobile-first-pricing.tsx` - Old experimental component

---

## 🎨 The Beauty of This Approach

**You get the best of both worlds:**
- ✅ Your custom UI stays intact (looks amazing)
- ✅ Clerk handles payments (secure, PCI compliant)
- ✅ Webhooks work automatically (tier upgrades)
- ✅ No Stripe integration headaches (Clerk abstracts it)

**The custom pricing table is JUST UI** - it's a fancy button that links to Clerk's checkout. That's it!

---

## 🔄 Quick Switch Guide

**To test billing NOW (Development):**
```tsx
// src/components/landing/pricing.tsx
import { ClerkPricingTemporary } from "./clerk-pricing-temporary";

export const Pricing = () => {
  return <ClerkPricingTemporary />; // Temporary for testing
};
```

**For production LATER:**
```tsx
// src/components/landing/pricing.tsx  
import { CustomPricingV2Production } from "./custom-pricing-v2-production";

export const Pricing = () => {
  return <CustomPricingV2Production />; // Your beautiful custom UI
};
```

---

## ⚡ Next Steps

1. I'll create the temporary Clerk component for you now
2. You set up plans in Clerk Dashboard (Development)
3. Test the billing flow
4. Once confirmed working, send to beta testers with FREE tier only
5. When ready for production, I'll convert your custom pricing to production version
6. Switch mode and launch 🚀



