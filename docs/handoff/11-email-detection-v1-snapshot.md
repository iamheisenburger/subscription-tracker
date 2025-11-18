### Email Detection v1 – Snapshot (November 2025)

This document captures the **current production behaviour** of the email‑based subscription detector so future work can start from a known‑good baseline.

#### High‑level shape

- **Source of truth**: the Convex functions under `convex/` in this repo, derived from the snapshot project [`SubWise-Email-Detection-Logic`](https://github.com/iamheisenburger/SubWise-Email-Detection-Logic.git).
- **Pipeline** (manual “Run first scan” only):
  1. Gmail scan via `emailScannerActions.scanGmailForReceipts` (merchant‑based queries + incremental `after:` cursor, capped pages/messages).
  2. Smart pre‑filtering (`scanning/smartFilter.ts`) to keep only subscription‑likely emails.
  3. AI + regex parsing (`aiReceiptParser.parseReceiptsWithAI`, `receiptParser.parseReceiptWithRegex`) with SHA‑256 caching.
  4. Repair pass (`repair.repairParsedReceipts`) to clean aggregator labels (Apple/Stripe/PayPal/Google) and salvage merchants/amounts.
  5. Pattern detection (`patternDetection.runPatternBasedDetection`) to build `detectionCandidates`.
  6. User review converts candidates into real `subscriptions`.

#### Cost‑safety & automation

- **Safe‑mode / kill‑switches**:
  - Env flags: `SUBWISE_DISABLE_CRONS`, `SUBWISE_SAFE_MODE`.
  - Table `systemSettings` with `safeMode`, `cronsDisabled`, debug throttles.
  - Crons respect these flags and no‑op when disabled.
- **Weekly incremental scans**:
  - Implemented in `emailCronJobs.scheduleWeeklyIncrementalScans`, but **crons are currently disabled in prod** while the system is in early launch.
  - Manual scans go through the full pipeline; incremental behaviour is controlled by Gmail `after:` and connection `lastScannedInternalDate`.
- **No hidden loops**:
  - Detection only processes receipts without `subscriptionId` or `detectionCandidateId`.
  - Scanning/parsing are bounded by batch size, caps, and state‑machine checkpoints.

#### Known good behaviour (owner mailbox)

- As of this snapshot, one production Gmail inbox reliably produces **9 high‑confidence candidates**:
  - microsoft, surfshark vpn, x, playstation, cursor, spotify, vercel, anthropic, quittr.
- The Fortect receipt is **parsed correctly** (`merchantName: "Fortect"`, amount 26.95 GBP) but **intentionally not auto‑promoted** to a candidate:
  - It resembles a one‑time license purchase with an expiry date.
  - Current heuristics are deliberately conservative for single receipts to avoid false positives.
  - Fortect should currently be tracked via a **manual subscription entry**.

#### UI notes

- The dashboard uses `ScanConsole` as the primary entry point.
- There is a **“Run first scan”** button before the first full scan.
- After a successful first scan, the button is hidden and the card shows “Weekly incremental enabled”; users rely on automatic weekly scans plus manual subscription editing.


