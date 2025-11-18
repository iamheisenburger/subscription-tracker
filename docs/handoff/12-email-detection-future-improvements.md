### Email Detection – Future Improvements Playbook

Use this note when evolving the detection system so changes stay **safe, general, and cost‑bounded**.

#### Principles

- Treat the current Convex code under `convex/` as the **stable core**. Do not change scanning/batching/cron behaviour unless you have:
  - A concrete bug,
  - A reproduction email, and
  - A test plan that proves existing behaviour stays intact.
- **Prefer local repairs** (parsing/repair/detection heuristics) over changes to:
  - Gmail query shapes,
  - Cron schedules,
  - State‑machine transitions and queue handling.
- New detection rules must be **general**, not tied to one email or user, and must be justified by multiple real examples where possible.

#### How to iterate on detection

1. **Collect examples**
   - When users report issues (“missed subscription”, “wrong merchant/amount/date”), capture:
     - Raw subject, from, and HTML/plain text body,
     - Whether it is truly recurring (monthly/annual) or one‑time,
     - The expected subscription name/price/cadence.

2. **Start by debugging parsing**
   - Inspect the corresponding row in `emailReceipts`:
     - `parsed`, `merchantName`, `amount`, `currency`, `billingCycle`, `receiptType`.
   - If parsing is wrong, fix `aiReceiptParser` and/or `repair.repairParsedReceipts` first.

3. **Then adjust detection heuristics**
   - Work in `patternDetection.ts`:
     - Cadence inference (`inferBillingCycle`, text‑based cycle extraction).
     - Charge evidence and cancellation suppression.
   - Keep the philosophy:
     - High precision over recall.
     - Stronger requirements for **single‑receipt** merchants than for recurring ones.
   - For annual‑style products (Fortect‑like), only generalize when several merchants share a clear textual pattern (e.g. “auto‑renew”, “renews on”, “next billing date” + date 10–14 months ahead).

4. **Guard with tests and admin tools**
   - Add targeted tests under `convex/__tests__` for any new rule.
   - Use `adminFixes.runRepairAndDetection` and `adminFixes.resetDetectionCandidates` for controlled re‑runs on production data.

#### Operational safety

- Keep `COST_SAFETY_AND_UNIT_ECONOMICS.md` as the **policy document** for any change that might increase AI or cron work.
- Safe‑mode (`systemSettings.safeMode` / `cronsDisabled` + env flags) should always exist as a “kill switch” even when crons are enabled.
- Avoid introducing new network calls into queries/mutations; any external API work belongs in actions.


