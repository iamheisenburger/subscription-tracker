# SubWise Cost-Safety + Unit Economics (Authoritative Guide)
Date: November 13, 2025  
Deployment: `prod:hearty-leopard-116`  
Test User: `user_34xrmhPDFT42apiFptlH4jnalSZ`  
Primary Objective: Never allow background automations to incur runaway costs. Scans must adhere to the unit economics below.

---

## Non‑Negotiables
- DO NOT reintroduce loops that reprocess the same receipts.
- DO NOT run or modify scheduled jobs without reading this document.
- ALWAYS test with `--prod` to the correct deployment.
- If suspicious behavior occurs, the system SELF‑DISABLES (auto kill switch). Do not remove it.

---

## Expected Unit Economics (Per Scan)
- First scan (≈170 receipts, dual providers 50/50): ≈ $0.068
- Subsequent scans (90% cache hit): ≈ $0.0068
- Convex infra (function calls, bandwidth, compute): $0.00 (within free tier)

Pricing assumptions:
- Claude Haiku: ~$0.0005/receipt
- OpenAI GPT‑5 Nano: ~$0.0003/receipt
- Dual split (50/50) → total ≈ $0.068 per 170 receipts

Target Alerts:
- Single scan > $0.50 → investigate immediately
- Daily > $1 or Monthly > $10 → suspicious

---

## Cost‑Killing Mechanisms Implemented

1) SHA‑256 Caching (AI Deduplication)
- Where: `convex/aiReceiptParser.ts`
- What: Content hash checked before AI; cached results reused.
- Effect: 90%+ cost reduction for repeat scans.

2) Parallel AI + Batching
- Where: `convex/aiReceiptParser.ts`, `convex/scanning/orchestrator.ts`
- What: `Promise.all` parallelization; controlled batch sizes.
- Effect: Fast, predictable completion; fewer function roundtrips.

3) Circuit Breakers and Locking
- Where: `convex/scanning/orchestrator.ts`
- What: Circuit breakers around externals; distributed locks prevent concurrent scans.
- Effect: Prevents cascades and duplicates.

4) Idempotent Detection (No Re‑queues)
- Where: `convex/patternDetection.ts`
- Change: When a candidate exists, we link ALL receipts for that merchant to the candidate (not just the newest).
- Where: `convex/emailCronJobs.ts`
- Change: Detection cron ignores any receipt with `subscriptionId` or `detectionCandidateId`.
- Effect: Eliminates the “same 65 receipts every hour” loop.

5) Automatic Kill Switch (Self‑Disabling Crons)
- Where:
  - `convex/emailCronJobs.ts` (heuristics and enforcement)
  - `convex/schema.ts` table `systemSettings` (persistent flags)
  - `convex/adminControl.ts` (query/mutation to check/set status)
- Heuristics:
  - If detection queue spikes to ≥150 in a run → auto safe mode.
  - If queue is non‑zero and roughly unchanged for 3 consecutive runs → auto safe mode.
- Effect: Background jobs stop themselves before costs accrue.

6) Safe Mode Environment Kill Flag (for emergencies)
- Env: `SUBWISE_DISABLE_CRONS=true` (also honored via `SUBWISE_SAFE_MODE`)
- Enforcement:
  - `convex/crons.ts` avoids scheduling when disabled.
  - All cron handlers early‑return when disabled.

7) Parsing Safeguards (No Infinite Loops)
- Where: `convex/scanning/orchestrator.ts`
- What:
  - MAX_ITERATIONS limit (20) for parsing batch recursion
  - `processedReceiptIds` persisted in `scanSessions.checkpoint`
  - Global Safe Mode respected inside orchestrator entry points
- Effect: Parsing cannot loop indefinitely; sessions fail fast with clear logs.

8) Duplicate/False Positive Controls
- Where:
  - `convex/patternDetection.ts` (blocklist + idempotent linking)
  - `convex/emailDetection.ts` (processor block + idempotent linking)
- What:
  - Blocklist merchants: pipiads, veritel, opusclip inc., Startup Club Community
  - Skip aggregator-only names (Apple/Stripe/PayPal/Google/Paddle) unless a real service is extracted
  - Link ALL receipts to an existing candidate to prevent re‑queues
- Effect: No “Apple” duplicates; reduced false positives; stable candidate set.

---

## Incremental Scans & Cooldowns

- Incremental-only after first full scan:
  - Scanner queries Gmail with `after:<lastScannedInternalDate>` and caps work (`capPages=3`, `capMessages=500`).
  - Snapshot-gated flow remains: parse → repair → detect once per run.
- Manual “Scan now” cooldown:
  - Server-enforced 24h cooldown per connection; UI shows countdown.
  - Weekly auto incremental scans bypass manual cooldown but respect Safe Mode and token health.
- Token health:
  - Preflight `users/me/profile` before auto scans. If 401/403, mark `requires_reauth` and skip.
- Locking:
  - Per-connection distributed lock with 2m TTL, backoff retries, and stale-lock cleanup.
- Stats:
  - Per-session `stats.tokensUsed` and `stats.apiCost` persisted (estimated); expose via admin query.

Expected incremental cost: ~$0.006–$0.02 per run (typical), assuming small deltas and high cache hit.

---

## Endpoint-Level Protections (New)

- Debug endpoints can be globally disabled:
  - Flag: `systemSettings.debugQueriesDisabled = true`
  - Effect: read-only debug/status queries return a minimal response and do no heavy work.
- Server-side throttle (reference implementation in app repo):
  - Minimum interval per user per endpoint: `systemSettings.minDebugPollIntervalMs` (default 60s).
  - Intended for:
    - `scanning/orchestrator:getScanProgress`
    - `adminQueries:getUserDetectionCandidates`
    - `diagnostics:getScanDiagnostics`
  - Implementation detail: short‑lived “rateLimit” token (distributedLocks) used to gate rapid polling.
- Operational rule:
  - DO NOT run continuous CLI/watch loops. Use ad‑hoc checks or ≥5‑minute polling only during an active scan.
  - If rapid polling is detected, set `debugQueriesDisabled=true` immediately.

Why: Prevents hidden costs from ad‑hoc watchers while keeping the pipeline and crons available.

---

## UI Analytics & Currency Safety (New)

- Do NOT call `fetch()` from Convex queries/mutations. Queries must be pure DB reads. Any network access must be an action.
- Currency conversion:
  - Backend returns raw subscription amounts in stored currency.
  - Client (browser) performs conversion for display using lightweight rates.
  - If backend conversion is ever required, use an action with cached rates; queries must fall back to static rates only.
- Analytics must not poll frequently; rely on Convex reactivity or ≥5‑minute intervals if a refresh loop is strictly necessary.
- Treat repeated warnings in logs as a cost signal; fix before merging.

Why: Prevents accidental cost from query retries and keeps analytics paths cheap.

---

## Operational Runbook (Must Follow)

1) Verify Health (Read‑Only)
```bash
# Detection queue (should be 0 or very small)
npx convex run adminQueries:getDetectionQueueStats --prod "{}"

# Auto Safe Mode status
npx convex run adminControl:getSafeModeStatus --prod "{}"

# Recent logs (look for SAFE MODE / large queues)
npx convex logs --prod --history 200 | Select-String "SAFE MODE|AUTO SAFE MODE|Found .* needing detection"
```

2) Emergency Stop (Optional)
```bash
# Immediate hard stop (env)
npx convex env set SUBWISE_DISABLE_CRONS true --prod

# Or set via settings table
npx convex run adminControl:setSafeMode --prod '{"enabled": true, "reason":"manual_emergency"}'
```

3) Re‑enable Automation (After confirming queue ≈ 0)
```bash
npx convex env set SUBWISE_DISABLE_CRONS false --prod
npx convex run adminControl:setSafeMode --prod '{"enabled": false}'
npx convex deploy -y
```

4) Controlled Cost Verification Run (Optional)
- Start ONE scan and watch:
  - Logs should not show repeating detection runs.
  - `adminQueries:getDetectionQueueStats` should not climb hour‑over‑hour.
  - Total scan cost should be ≤ $0.10 (first scan ~ $0.068, subsequent ~ $0.0068).

---

## Hard Rules for Future Changes
- DO NOT remove auto kill logic or safe‑mode checks.
- DO NOT revert detection filtering (`subscriptionId` and `detectionCandidateId` checks).
- DO NOT switch to sequential per‑receipt scheduling in crons.
- Any change that may increase detection queue size must:
  1) Explain why it won’t re‑queue the same receipts.
  2) Provide a test plan that proves the queue returns to 0.

---

## Quick References
- Tables: `emailReceipts`, `detectionCandidates`, `systemSettings`
- Key code:
  - Crons: `convex/crons.ts`, `convex/emailCronJobs.ts`
  - Parser: `convex/aiReceiptParser.ts`
  - Detection: `convex/patternDetection.ts`, `convex/emailDetection.ts`
  - Admin: `convex/adminControl.ts`, `convex/adminQueries.ts`

---

## Success Criteria (Must Hold)
1) Per‑scan cost ≤ $0.10 (first: ~$0.068; subsequent: ~$0.0068)  
2) Detection queue returns to 0 between cron cycles  
3) No infinite or repeating loops in logs  
4) Auto Safe Mode triggers if queues grow or stick  
5) Results repeat consistently across 3 runs  

---

## Why This Matters
The prior $72+ incident was caused by background looping that reprocessed the same receipts. This guide codifies the safeguards and operational rules that prevent any repeat. Treat this document as policy: do not merge changes that violate it.


