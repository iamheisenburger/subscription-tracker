# SubWise Automate Tier - Product Plan

**Last Updated:** January 21, 2025
**Current Version:** 0.9 (Email Detection Live, Conservative Parser)

---

## 🎯 VISION: What We're Building

**Automate Tier ($9/mo)** - Intelligent subscription tracking that saves users money through automation.

### Core Value Proposition:
Users connect their Gmail → System automatically detects subscriptions from email receipts → Tracks price changes → Sends renewal alerts → Users save $60+/month

**Key Features:**
1. **Email Detection** - Scan Gmail for subscription receipts, auto-detect recurring charges
2. **Price Tracking** - Monitor subscription prices over time, alert on increases
3. **Renewal Predictions** - Predict next billing dates based on patterns
4. **Smart Alerts** - 7/3/1 day renewal reminders, price change notifications
5. **Cancel Assistant** - Guided cancellation steps for common services
6. **Export Tools** - Calendar (.ics), CSV, PDF exports

**Why Users Pay $9/mo:**
- Finds forgotten subscriptions → Saves $40/mo
- Alerts before price increases → Saves $5/mo
- Prevents unwanted charges from trials → Saves $15/mo
- **Total Value: $60+/month saved | ROI: 567%**

---

## ✅ CURRENT SYSTEM STATUS

### What's Built & Working:

**UI/UX Layer (95% Complete):**
- ✅ Full Insights page with 4 tabs (Activity Feed, Price History, Predictions, Alerts)
- ✅ Interactive subscription cards with dropdown actions (View Insights, Cancel, Export)
- ✅ Clickable feature badges linking to Insights filtered views
- ✅ Notification bell in header with unread count
- ✅ Mobile-responsive design throughout
- ✅ Sidebar navigation with Insights item

**Email Detection Pipeline (90% Complete):**
- ✅ Gmail OAuth flow - users can connect email
- ✅ Email scanning - fetches up to 500 receipts per scan (2-year lookback)
- ✅ Receipt parsing - extracts merchant, amount, currency, billing cycle
- ✅ Detection candidates - shown in UI for user review
- ✅ Conservative filtering - requires subscription keywords + receipt indicators
- ✅ Synchronous pipeline - scan → parse → detect (immediate results)
- ✅ Exploitation prevention - lifetime email connection limit tracking

**Backend Services:**
- ✅ `emailScanner.ts` - Gmail API integration with OAuth token management
- ✅ `receiptParser.ts` - 50+ known merchant patterns, multi-currency support
- ✅ `emailDetection.ts` - Converts receipts to detection candidates
- ✅ `emailCronJobs.ts` - Automated scanning every 6 hours
- ✅ Base64 decoding fix - replaced `Buffer.from()` with `atob()` (Convex-compatible)

**Database Schema:**
- ✅ `emailConnections` - Gmail OAuth tokens & sync state
- ✅ `emailReceipts` - Raw email data (subject, from, rawBody, parsed fields)
- ✅ `detectionCandidates` - Pending user review (proposedName, proposedAmount, confidence)
- ✅ `emailConnectionsUsedLifetime` - Prevent connection limit exploitation

---

## ⚠️ CURRENT LIMITATIONS & KNOWN ISSUES

**1. Parser Accuracy Needs Validation:**
- Conservative filter deployed but not tested at scale
- May miss legitimate subscriptions if they don't use standard language
- May still have false positives for edge cases
- **Next:** Collect user feedback, tune patterns iteratively

**2. Pagination Not Implemented:**
- Currently scans max 500 emails per run (Gmail API limit)
- Users with 841+ emails only get 50 receipts processed
- **Next:** Implement continuation token logic for full inbox scan

**3. Receipt Type Differentiation:**
- Can't distinguish new subscription vs renewal vs cancellation
- All receipts treated equally
- **Next:** Add receipt classification logic

**4. UI Hydration Issue (Minor):**
- Email widget doesn't show on first dashboard load
- Requires page refresh to appear
- **Next:** Fix React hydration in dashboard components

---

## 🚧 CURRENTLY WORKING ON

### Active Tasks:

1. **Parser Accuracy Validation** ⚡ HIGHEST PRIORITY
   - Test conservative filter with real user data
   - Identify false positives/negatives
   - Tune subscription keyword patterns
   - Improve merchant name extraction

2. **User Testing Required:**
   - User disconnects false positive detections
   - User reconnects Gmail to trigger fresh scan
   - Validate new parser produces accurate results
   - Collect feedback on what's missing/wrong

### Next Up:

3. **Implement Full Inbox Pagination**
   - Add Gmail API continuation tokens
   - Scan all emails, not just first 500
   - Process in batches to avoid timeouts

4. **Receipt Type Classification**
   - Detect new subscription signups
   - Detect renewal confirmations
   - Detect cancellation confirmations
   - Detect price change notifications

---

## 🔧 CRITICAL FIXES DEPLOYED (Recent)

### January 21, 2025 Deployments:

**1. Buffer API Issue (FIXED):**
- Problem: `Buffer.from()` doesn't exist in Convex runtime → ALL email bodies were empty
- Fix: Changed to `atob()` web standard API in [emailScannerActions.ts:313-323](convex/emailScannerActions.ts#L313-L323)
- Result: Emails now extracting properly

**2. Parser Too Aggressive (IMPROVED):**
- Problem: 100% false positive rate - detected one-time purchases, marketing emails as subscriptions
- Fix: Added `isSubscriptionReceipt()` filter in [receiptParser.ts:14-77](convex/receiptParser.ts#L14-L77) requiring:
  - ✅ Subscription keywords ("subscription", "recurring", "renewal", "next charge")
  - ❌ Exclusion patterns ("free trial", "welcome", "promotional", "marketing")
  - ✅ Receipt indicators ("receipt", "invoice", "payment confirmation")
- Result: Fewer false positives, awaiting validation

**3. Manual Scan Pipeline (FIXED):**
- Problem: "Scan Now" only triggered fetch, not parsing/detection (1-2 hour wait for cron jobs)
- Fix: Made triggerUserEmailScan execute complete pipeline immediately
- Result: Users see detection results within seconds

**4. Connection Limit Exploitation (FIXED):**
- Problem: Users could bypass 1-email limit by connecting/disconnecting repeatedly
- Fix: Added `emailConnectionsUsedLifetime` counter (never decrements)
- Result: Lifetime tracking prevents gaming the system

---

## 📝 DEPLOYMENT INFO

**GitHub Repository:** https://github.com/iamheisenburger/subscription-tracker.git
**Convex Deployment:** https://hearty-leopard-116.convex.cloud
**Branch:** main

**Latest Commits:**
- `a07e613` - Parser accuracy improvements with conservative filtering (Jan 21, 2025)
- `d925825` - Buffer → atob fix, synchronous pipeline (Jan 21, 2025)

---

## 🎯 SUCCESS METRICS

**Target Detection Accuracy:** 80%+ precision (80% of detections are correct subscriptions)
**Current Status:** Unknown - awaiting user validation

**Success Criteria for v1.0:**
- [ ] 80%+ detection precision (validated by user feedback)
- [ ] Full inbox pagination (no 500-email limit)
- [ ] UI hydration issue resolved
- [ ] Receipt type classification implemented
- [ ] Zero Buffer/runtime errors in production logs

---

## 🛠️ EMERGENCY ADMIN TOOLS

For debugging and cleanup during testing:

```bash
# Delete false positive detection candidates
npx convex run admin:deleteAllDetectionCandidates '{"clerkUserId": "user_xxx"}'

# Delete emails with empty rawBody (broken from Buffer errors)
npx convex run admin:deletebrokenReceipts '{"clerkUserId": "user_xxx"}'

# Reset email connection limit for testing
npx convex run admin:resetEmailConnectionLimit '{"clerkUserId": "user_xxx"}'

# Inspect raw email data
npx convex run adminQueries:getUserEmailReceipts '{"clerkUserId": "user_xxx"}'

# View pending detections
npx convex run adminQueries:getUserDetectionCandidates '{"clerkUserId": "user_xxx"}'

# Get user Clerk IDs
npx convex run adminQueries:getAllUsers
```

---

**End of Plan Document**

*Focus: Validate parser accuracy → Implement pagination → Launch v1.0*
