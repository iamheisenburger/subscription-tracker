# SubWise Automate - CURRENT SYSTEM STATE

**Last Updated:** October 27, 2025, 9:45 PM
**Status:** 🔴 **CRITICAL BUGS PERSIST - SYSTEM NOT PRODUCTION READY**

---

## Project Information

- **Convex Production:** https://hearty-leopard-116.convex.cloud (prod:hearty-leopard-116)
- **User Email:** arshadhakim67@gmail.com
- **Clerk ID:** user_33juD7PuxD9OVFJtVM9Hi74EneG
- **Frontend:** Next.js on Vercel
- **Backend:** Convex serverless
- **AI Model:** Claude Haiku 4.5
- **API Keys:** 3 Anthropic keys (same organization)

---

## LATEST TEST RESULTS (October 27, 2025 - 9:30 PM)

### What Happened:
1. User clicked "Scan Now"
2. System scanned **955 receipts** total
3. Split into 7 batches for processing
4. Processing took ~15-20 minutes

### Detection Results:
- **Batch 1:** 17 subscriptions detected
- **Batch 2:** 1 subscription detected
- **Batches 3-7:** 0 subscriptions detected
- **TOTAL:** 18 subscriptions detected

### User's Actual Active Subscriptions NOT DETECTED:
1. ❌ ChatGPT - $20/month
2. ❌ Perplexity - $20/month
3. ❌ Surfshark VPN - $10/month
4. ❌ Spotify - $12/month
5. ❌ Telegram community - $7/month
6. ❌ Patreon subscription - $4/month

### What WAS Detected (Batch 1 Analysis):
| Subscription | Status | User Feedback |
|-------------|--------|---------------|
| Skool | ❌ Invalid | Formerly active, now cancelled |
| ElevenLabs | ❌ Invalid | Formerly active, now cancelled |
| AWS | ❌ Invalid | Never subscribed, fake suggestion |
| Fortect | ✅ Valid | Correct |
| Canva | ❌ Invalid | Formerly active, now cancelled |
| Skool Scale with YouTube VIP | ❌ Invalid | Formerly active, now cancelled |
| **PlayStation** | ✅ Valid | Correct |
| Startup Club | ❌ Invalid | One-time payment, not subscription |
| Vercel | ✅ Valid | Correct |
| Email | ❌ Invalid | Never subscribed, fake suggestion |
| Cursor | ✅ Valid | Correct |
| X (Twitter) | ✅ Valid | Correct |
| Kfintech | ✅ Valid | Correct |
| Anthropic | ✅ Valid | Correct |
| **PlayStation Store** | ❌ DUPLICATE | Same as PlayStation above |
| Microsoft | ✅ Valid | Correct |

**Summary:**
- 18 total detections
- ~7 valid active subscriptions (44%)
- ~11 invalid/cancelled/fake subscriptions (56%)
- 1 duplicate (PlayStation)
- 6 known active subscriptions MISSING

---

## CRITICAL BUG #1: Batches 2-7 Detect Nothing

**Evidence:**
- Batch 1 processes 150 receipts → detects 17 subscriptions
- Batch 2 processes 150 receipts → detects 1 subscription
- Batches 3-7 process 600+ receipts → detect 0 subscriptions

**What This Means:**
- Out of 955 receipts scanned, only ~300 receipts (batches 1-2) are being analyzed properly
- 655+ receipts in batches 3-7 are processed but produce no detections
- Missing subscriptions (ChatGPT, Spotify, etc.) are likely in batches 3-7

**Impact:** CRITICAL - Core detection functionality broken for 70% of receipts

---

## CRITICAL BUG #2: Missing Active Subscriptions

**Known Active Subscriptions NOT Detected:**
1. ChatGPT ($20/month) - Has receipts in Gmail
2. Perplexity ($20/month) - Has receipts in Gmail
3. Surfshark VPN ($10/month) - Has receipts in Gmail
4. Spotify ($12/month) - Has receipts in Gmail
5. Telegram community ($7/month) - Has receipts
6. Patreon ($4/month) - Has receipts

**What We Know:**
- User confirmed these subscriptions ARE active
- User confirmed receipts exist in Gmail
- System scanned 955 receipts but didn't detect these
- Likely in batches 3-7 which aren't detecting anything

**Impact:** CRITICAL - System fails to detect user's actual subscriptions

---

## CRITICAL BUG #3: Invalid/Cancelled Subscriptions Detected

**Problem:**
- System detects subscriptions user cancelled months/years ago
- System detects fake subscriptions user never had (AWS, "Email")
- System detects one-time purchases as subscriptions (Startup Club)

**Examples:**
- Skool: Cancelled, but detected as active
- ElevenLabs: Cancelled, but detected as active
- Canva: Cancelled, but detected as active
- AWS: Never subscribed, but detected
- Startup Club: One-time payment, detected as subscription

**Impact:** HIGH - 56% of detections are invalid/useless

---

## CRITICAL BUG #4: PlayStation Duplicate

**Problem:**
- "PlayStation" appears once
- "PlayStation Store" appears as separate subscription
- Same subscription shown twice

**Impact:** MEDIUM - Confusing UX, duplicate entries

---

## CRITICAL UX BUG #1: Unprofessional UI Messages

**Problem:**
User sees this popup when clicking "Scan Now":

```
FIRST SCAN - Full Inbox Analysis
⏱️ Time: ~10-15 minutes (3 API keys working in parallel)
💰 Cost: ~$1.50 (one-time only)
📊 Will analyze: ~400-500 receipts (pre-filtered from 900+)

Future scans will be MUCH faster (2-3 min) and cheaper ($0.08).
```

**User Feedback:**
> "btw this was the cost saving system that was apparently implemented for our app btw. but anyways. why the fuck is this there in the ui. this is a professional app used by real users we are aiming to monetise. what is the fucking meaning of this message in our professional app."

**Impact:** HIGH - Unprofessional, confusing for end users

---

## CRITICAL UX BUG #2: Confusing Progress Display

**Problem:**
During scanning, UI shows:
- Top: "26 receipts"
- Bottom: "0 emails scanned"
- Then later: "0 / 150 receipts"

**User Feedback:**
> "the confusing fucking ui is still there. why does it say above 26 receipts (still ongoing im commenting as i see the progress live) and underneath it '0 emails scanned'. like which fucking one is the user supposed to believe."

**Impact:** HIGH - User doesn't understand what's happening

---

## CRITICAL UX BUG #3: Non-Transparent Batch Processing

**Problem:**
When batches are processing, UI only shows "Starting..." without clear progress

**What's Missing:**
- Which batch is currently processing (1 of 7, 2 of 7, etc.)
- How many receipts in current batch
- What the AI is actually doing

**User Feedback:**
> "also when the batches are being processed in the ui it just says 'starting' and it doesnt really show the full transparency of whats going on behind the scenes for the user to be updated."

> "overall like i said this ui is there but it isnt smooth nor transparent."

**Impact:** HIGH - User has no visibility into system status

---

## WHAT THE USER WANTS

### For Detection:
1. ✅ Detect ALL actual active subscriptions (ChatGPT, Spotify, etc.)
2. ✅ Do NOT detect cancelled subscriptions
3. ✅ Do NOT detect fake subscriptions (AWS, "Email")
4. ✅ Do NOT detect one-time purchases as subscriptions
5. ✅ NO duplicate subscriptions (PlayStation)
6. ✅ ALL batches (1-7+) should detect subscriptions proportionally

### For UI:
1. ✅ Remove unprofessional cost/time messages
2. ✅ Show clear, unambiguous progress (receipts scanned, batch X of Y)
3. ✅ Show what's happening in real-time ("Analyzing receipts...", "Batch 3/7 processing...")
4. ✅ Professional, clean interface for monetized app

---

## SYSTEM ARCHITECTURE (How It Currently Works)

### Gmail Scanning:
1. User clicks "Scan Now"
2. Gmail API fetches emails matching:
   ```
   (category:purchases OR label:subscriptions OR subject:(subscription OR recurring OR billing OR renewal OR invoice OR receipt OR payment))
   ```
3. All matching emails stored in database with `parsed: false`
4. Total: ~955 emails for test user

### Batch Processing:
1. System fetches 150 unparsed receipts from database
2. Splits across 3 API keys (50 receipts each)
3. Each worker sends receipt to Claude AI for parsing
4. AI extracts: merchant name, amount, currency, billing cycle
5. Results saved to database, receipts marked `parsed: true`
6. Pattern detection runs to create detection candidates
7. Next batch triggered automatically if unparsed receipts remain
8. Supports up to 15 batches (2,250 receipts max)

### Detection Candidate Creation:
1. Pattern detection analyzes all parsed receipts
2. Groups by merchant name (case-insensitive)
3. Determines if subscription is active based on recency/patterns
4. Creates `detectionCandidate` with status "pending"
5. User reviews in UI and accepts/dismisses

---

## FILES INVOLVED

### Backend (Convex):
- `convex/aiReceiptParser.ts` - AI parsing with 3 parallel keys
- `convex/receiptParser.ts` - Pre-filtering and regex parsing
- `convex/emailDetection.ts` - Detection candidate creation
- `convex/emailScannerActions.ts` - Batch orchestration
- `convex/patternDetection.ts` - Pattern analysis for subscriptions
- `convex/schema.ts` - Database schema (supports batches 1-15)

### Frontend (Next.js):
- `src/components/dashboard/automate/connected-emails-widget.tsx` - Main UI component

---

## WHAT'S BEEN TRIED (AND FAILED)

### Attempt #1: Added 7-second delays for rate limiting
- Result: Made system 3x slower (10min → 30min)
- Reverted

### Attempt #2: Extended schema to support batches 8-15
- Result: Helpful, but didn't fix batch 2-7 detection bug

### Attempt #3: Case-insensitive deduplication
- Result: Still shows PlayStation duplicate

### Attempt #4: Softened pre-filtering
- Result: Still missing 6 active subscriptions

### Attempt #5: Disabled pre-filter entirely
- Result: Still missing 6 active subscriptions, batches 2-7 still detect nothing

### Attempt #6: Dynamic time estimation
- Result: UI shows better estimate, but doesn't fix core bugs

**None of these fixed the core issues.**

---

## PRODUCTION DATA EVIDENCE

### From `all_receipts.json` (October 27, 2025):
- Total receipts in database: 953
- Receipts with `parsed: true`: 45
- Receipts with `parsed: false`: 908

**What This Means:**
After multiple scans, only 45 out of 953 receipts were successfully parsed. 908 receipts remain unparsed or were filtered out.

### Receipts for Missing Subscriptions Exist:
Evidence from production database:
```json
{
  "subject": "Spotify Receipt",
  "from": "Spotify <no-reply@spotify.com>",
  "parsed": false
}

{
  "subject": "Your subscription confirmation",
  "from": "Apple <no_reply@email.apple.com>",
  "rawBodyPreview": "...Surfshark VPN...",
  "parsed": false
}
```

**Receipts exist but are not being parsed/detected.**

---

## CURRENT DEPLOYMENT STATE

### Convex Backend:
- ✅ Deployed to prod:hearty-leopard-116
- ✅ Supports batches 1-15
- ✅ 3 API keys configured
- ❌ Detection not working for batches 2-7
- ❌ Missing subscriptions not detected

### Frontend:
- ✅ Deployed on Vercel
- ❌ Shows unprofessional cost messages
- ❌ Confusing progress display
- ❌ Not transparent about batch processing

---

## THE PROBLEM SUMMARY FOR CURSOR

System scans 955 email receipts from Gmail successfully.

Batch 1 (150 receipts) detects 17 subscriptions.
Batch 2 (150 receipts) detects 1 subscription.
Batches 3-7 (600+ receipts) detect 0 subscriptions.

User has 6 known active subscriptions with receipts in Gmail that are NOT being detected:
- ChatGPT ($20/month)
- Perplexity ($20/month)
- Surfshark VPN ($10/month)
- Spotify ($12/month)
- Telegram community ($7/month)
- Patreon ($4/month)

System also detects many invalid subscriptions:
- Cancelled subscriptions from months/years ago
- Fake subscriptions user never had
- One-time purchases incorrectly labeled as subscriptions
- PlayStation duplicate (appears twice)

UI shows unprofessional cost/time estimates popup and confusing progress indicators during scanning.

Out of 18 total detections, only ~7 (44%) are valid active subscriptions. System misses 6 known active subscriptions while detecting 11 invalid/cancelled/fake ones.

Database shows 953 receipts exist but only 45 are marked `parsed: true`. Receipts for missing subscriptions (Spotify, Surfshark, etc.) exist in database with `parsed: false`.

---

**END OF DOCUMENT**
