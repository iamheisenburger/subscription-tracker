# SubWise Automate Detection System - Current State & Fix Plan

**Last Updated:** October 27, 2025 4:30 PM
**Status:** 🔴 **SYSTEM BROKEN - MAJOR REGRESSION AFTER RECENT "FIXES"**

---

## Project Information

- **GitHub Repository:** https://github.com/iamheisenburger/subscription-tracker.git
- **Convex Deployment:** https://hearty-leopard-116.convex.cloud (prod:hearty-leopard-116)
- **Current Branch:** master
- **Test User:** arshadhakim67@gmail.com (Clerk ID: user_33juD7PuxD9OVFJtVM9Hi74EneG)
- **Total Receipts:** 948 emails in database

---

## 🚨 CURRENT STATE (After Recent "Fixes")

### What Was Working (Before Recent Session)
- ✅ 3 API keys running in parallel
- ✅ Scan completed in **10 minutes** for 948 receipts
- ✅ Batch 1 detected 17 subscriptions
- ✅ Batch 2 detected 1 subscription
- ⚠️ Batches 3-7 detected 0 subscriptions (bug)
- ⚠️ System stopped at batch 7 (schema only supported batches 1-7)

### What's Broken NOW (After Recent "Fixes")

**1. SPEED REGRESSION - MAJOR**
- **Before:** 10 minutes for 948 receipts
- **After:** 30+ minutes for 948 receipts (3x slower!)
- **Cause:** Added 7-second rate limiting delays that weren't needed
- **Impact:** System went BACKWARDS in performance

**2. BATCH PROCESSING - PARTIALLY FIXED**
- ✅ Schema now supports batches 8-15 (was 1-7)
- ❌ Batches 2-7 still return 0 detections (core bug NOT fixed)
- ❌ Only batch 1 reliably detects subscriptions

**3. MISSING SUBSCRIPTIONS - NOT FIXED**
Still not detecting user's known active subscriptions:
- ❌ ChatGPT ($20/month)
- ❌ Perplexity ($20/month)
- ❌ Spotify ($12/month)
- ❌ Surfshark VPN ($10/month)
- ❌ FPL Brandon VIP Telegram
- ❌ FPLReview Patreon

**4. DUPLICATES - POSSIBLY FIXED**
- ✅ Added case-insensitive deduplication
- ⚠️ Not tested yet with fresh scan

**5. PRE-FILTERING - UNCERTAIN**
- Changed pre-filter to be less aggressive
- Still scans all 948 emails at Gmail level (unchanged)
- Filtering only reduces AI processing, not Gmail scan

---

## 📊 THE ACTUAL PROBLEM (Root Cause)

### Why Batches 2-7 Return 0 Detections

From Convex logs analysis:
- Batch 1 processes 150 receipts → creates 17-18 detection candidates ✅
- **Batch 2-7 process receipts but create 0 NEW candidates ❌**
- Not a schema issue (that's fixed)
- Not a batch fetching issue (receipts ARE processed)
- **Real issue:** Either:
  1. AI failing/rate-limiting on batches 2-7 receipts, OR
  2. Detection candidate creation logic failing for batches 2-7, OR
  3. User's missing subscriptions are being filtered out incorrectly

### Why Speed Regressed

- Added 7-second delays between each AI request to avoid rate limiting
- **BUT:** System was already working at 10 minutes with 3 API keys
- Rate limiting was occasional, not systemic
- Now processing ~0.43 receipts/second instead of ~1.5 receipts/second
- **Result:** Went from 10 min → 30+ min (massive regression)

---

## 🎯 WHAT NEEDS TO BE ACHIEVED

### Primary Goal: Reliable Multi-Batch Detection
- All batches (1-15) must detect subscriptions, not just batch 1
- User's 6 known missing subscriptions MUST be detected
- Consistent results across multiple scans (no randomness)
- No duplicate subscriptions

### Secondary Goal: Maintain 10-Minute Performance
- Restore original 10-minute scan time (or close to it)
- Remove or reduce aggressive 7-second rate limiting delays
- Keep 3 API keys working in parallel efficiently

### Tertiary Goal: Better UX (Lower Priority)
- Progress UI showing batch processing status
- Time estimates reflecting actual performance
- Clear feedback during 10-minute scan window

---

## 📋 CRITICAL ISSUES TO FIX

| Issue | Severity | Current State | Impact |
|-------|----------|---------------|--------|
| Batches 2-7 detect 0 subscriptions | 🔴 Critical | Unfixed | Missing 80% of subscriptions |
| Speed regressed 10min → 30min | 🔴 Critical | WORSE than before | Unacceptable for users |
| Missing 6 known subscriptions | 🔴 Critical | Unfixed | Core feature doesn't work |
| Duplicate subscriptions | 🟡 Medium | Possibly fixed | Confuses users |
| Pre-filtering not reducing Gmail scan | 🟢 Low | By design | Pre-filter works on AI, not Gmail API |

---

## ⚠️ MISTAKES FROM LAST SESSION

1. **Misread the batch logs** - Thought batches 1-7 only processed 35 receipts total when logs showed 913 REMAINING after batch 7
2. **Added aggressive rate limiting** - 7-second delays killed performance (10min → 30min regression)
3. **Didn't fix the actual batch 2-7 bug** - Extended schema but didn't fix why batches 2-7 create 0 candidates
4. **Didn't verify impact** - Deployed without confirming fixes actually work

---

## 🔧 WHAT MUST HAPPEN NEXT

**DO NOT:**
- ❌ Add more delays or slowdowns
- ❌ Claim things are fixed without verification
- ❌ Focus on minor issues (pre-filtering, UI polish) before fixing core detection
- ❌ Make speed worse than 10 minutes

**MUST DO:**
1. **Restore 10-minute performance** - Remove/reduce the 7-second delays
2. **Fix batches 2-7 detection bug** - Figure out why only batch 1 creates candidates
3. **Verify missing subscriptions detected** - Test that ChatGPT, Perplexity, Spotify, etc. are found
4. **Test end-to-end** - Run full scan, verify ALL 948 receipts processed, ALL batches create candidates

---

## 🔍 DEBUGGING COMMANDS

```bash
# Project navigation
cd c:/Users/arshadhakim/OneDrive/Desktop/subscription_app/subscription-tracker-working

# Check production logs
npx convex logs

# Check user's email connection status
npx convex run emailConnections:getUserConnections '{"clerkUserId":"user_33juD7PuxD9OVFJtVM9Hi74EneG"}'

# Count receipts and parsing status
npx convex run receiptParser:countUnparsedReceipts '{"clerkUserId":"user_33juD7PuxD9OVFJtVM9Hi74EneG"}'

# Deploy backend
npx convex deploy

# Build frontend
npm run build

# Push to GitHub (triggers Vercel deploy)
git add .
git commit -m "Fix: [description]"
git push origin master
```

---

## 📝 SUCCESS CRITERIA

System will be considered "working" when:
1. ✅ All batches (1-15) detect subscriptions (not just batch 1)
2. ✅ Full scan completes in 10-15 minutes (not 30+ minutes)
3. ✅ All 948 receipts processed across all batches
4. ✅ User's 6 missing subscriptions detected (ChatGPT, Perplexity, Spotify, Surfshark, Telegram, Patreon)
5. ✅ No duplicate subscriptions (e.g., PlayStation appearing twice)
6. ✅ Consistent results across multiple test scans

**Until all 6 criteria are met, the system is NOT production-ready.**

---

**END OF AUDIT - Focus on core detection bugs and performance restoration.**
