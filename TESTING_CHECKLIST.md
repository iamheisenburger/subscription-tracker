# SubWise Automate Tier - Testing Checklist

## Sprint 6: Final Testing & Deployment Verification

### 1. Backend Testing (Convex)

#### Daily Bank Sync
- [ ] Cron job runs at 3 AM UTC
- [ ] Syncs only Automate tier users
- [ ] Uses cursor for incremental sync
- [ ] Handles Plaid rate limits gracefully
- [ ] Marks connections as `requires_reauth` on auth errors
- [ ] Triggers detection after sync
- [ ] Triggers duplicate detection after sync
- [ ] Logs sync results properly

#### Renewal Prediction
- [ ] Predictions calculated on detection acceptance
- [ ] Median interval calculation accurate
- [ ] Cadence detection (weekly/monthly/yearly) works
- [ ] Confidence scoring combines detection + periodicity
- [ ] Predictions stored in subscription record
- [ ] Edit forms show predicted values

#### Price History Tracking
- [ ] Price changes detected daily (11 AM UTC cron)
- [ ] History entries created on detection
- [ ] Linked to triggering transaction
- [ ] Percent change calculated correctly
- [ ] User notified of price changes (if enabled)

#### Detection Engine
- [ ] Transactions grouped by merchant correctly
- [ ] Periodicity scoring accurate
- [ ] Amount consistency calculated
- [ ] Confidence threshold (≥0.5) enforced
- [ ] Dismissals prevented from re-appearing
- [ ] Detection candidates show in queue

### 2. Frontend Testing

#### Dashboard (Automate Tier)
- [ ] Detection queue shows pending candidates
- [ ] Horizontal scroll works on mobile
- [ ] Confidence badges color-coded correctly
- [ ] Bank widget shows connection status
- [ ] "View All" opens detection modal
- [ ] Components hidden for non-Automate users

#### Detection Review
- [ ] Modal shows all pending detections
- [ ] Accept creates subscription with predictions
- [ ] Edit overrides work correctly
- [ ] Dismiss removes candidate
- [ ] Toast notifications appear
- [ ] Modal responsive on mobile

#### Calendar Export
- [ ] Single subscription exports .ics file
- [ ] Bulk export (all subscriptions) works
- [ ] Recurring events created correctly
- [ ] 24-hour reminders included
- [ ] Downloads trigger browser download
- [ ] Files import to Google/Apple/Outlook calendars

#### Cancel Assistant
- [ ] Modal opens from subscription menu
- [ ] Playbooks load for known services
- [ ] Generic tips show for unknown services
- [ ] Step checkboxes toggle correctly
- [ ] Difficulty badges color-coded
- [ ] Quick links open in new tab
- [ ] Tips and warnings display inline
- [ ] Alternative options shown
- [ ] Responsive on mobile

### 3. Tier Gating

#### Free Tier
- [ ] Cannot connect banks
- [ ] No detection queue shown
- [ ] Upgrade banner displayed
- [ ] Limited to 3 subscriptions
- [ ] Calendar export unavailable

#### Plus Tier
- [ ] Cannot connect banks
- [ ] No detection queue shown
- [ ] Unlimited manual subscriptions
- [ ] Calendar export available
- [ ] Cancel Assistant available

#### Automate Tier
- [ ] Can connect 1 bank (3 accounts max)
- [ ] Detection queue visible
- [ ] Bank widget visible
- [ ] Daily sync active
- [ ] All predictions + history features
- [ ] Calendar export available
- [ ] Cancel Assistant available

### 4. Mobile Responsiveness

#### Breakpoints (<640px)
- [ ] Detection queue horizontal scroll
- [ ] Touch targets ≥44px
- [ ] Buttons stack vertically
- [ ] Modals full-screen on mobile
- [ ] Text readable without zoom
- [ ] No horizontal overflow

#### Tablet (640-1024px)
- [ ] Layout adapts gracefully
- [ ] Cards use grid appropriately
- [ ] Navigation accessible
- [ ] Dropdowns positioned correctly

#### Desktop (>1024px)
- [ ] Full desktop layout
- [ ] Hover states work
- [ ] Dropdowns on hover
- [ ] Multi-column layouts

### 5. Performance

#### Load Times
- [ ] Dashboard loads <2s
- [ ] Detection modal opens <500ms
- [ ] Calendar export downloads <1s
- [ ] Cancel Assistant modal opens <500ms

#### Optimization
- [ ] Images lazy loaded
- [ ] Components code-split
- [ ] No unnecessary re-renders
- [ ] Efficient queries (indexed)
- [ ] Convex queries batched

### 6. Data Integrity

#### Convex Database
- [ ] No duplicate transactions
- [ ] Sync cursors updated correctly
- [ ] Price history entries accurate
- [ ] Predictions saved properly
- [ ] Detection candidates unique

#### Plaid Integration
- [ ] Access tokens encrypted
- [ ] Transaction sync incremental
- [ ] Webhook handling robust
- [ ] Error states recoverable

### 7. User Experience

#### Onboarding
- [ ] Bank connection flow clear
- [ ] Initial sync explained
- [ ] Detection intro shown
- [ ] Tier benefits communicated

#### Notifications
- [ ] Renewal reminders work
- [ ] Price change alerts sent
- [ ] New detection notifications
- [ ] Toast messages appropriate
- [ ] Email templates render correctly

#### Error Handling
- [ ] Bank auth errors caught
- [ ] Plaid errors user-friendly
- [ ] Network errors retried
- [ ] Fallback UI shown
- [ ] Error messages helpful

### 8. Security

#### Authentication
- [ ] Clerk auth required for all routes
- [ ] Bank data per-user isolated
- [ ] API routes protected
- [ ] No data leakage between users

#### Data Protection
- [ ] Plaid tokens encrypted
- [ ] Sensitive data not logged
- [ ] HTTPS enforced
- [ ] No XSS vulnerabilities

### 9. Edge Cases

#### Unusual Scenarios
- [ ] User with no transactions
- [ ] User with 1 transaction
- [ ] Subscription with price=0
- [ ] Very old transactions (>2 years)
- [ ] Same merchant, different amounts
- [ ] Refunds/reversals handled
- [ ] Pending transactions ignored

#### Failure Scenarios
- [ ] Plaid API down
- [ ] Convex deployment issue
- [ ] Network timeout
- [ ] Invalid data formats
- [ ] Concurrent modifications

### 10. Cross-Browser Testing

#### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile Firefox

### 11. Accessibility

#### Screen Readers
- [ ] All buttons labeled
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Semantic HTML used

#### Keyboard Navigation
- [ ] Tab order logical
- [ ] Dropdowns keyboard accessible
- [ ] Modals trappable focus
- [ ] Skip links available

#### Visual
- [ ] Color contrast ≥4.5:1
- [ ] Focus indicators visible
- [ ] Text resizable
- [ ] No motion sickness triggers

### 12. Final Deployment

#### Pre-Deployment
- [ ] All tests passing
- [ ] Build successful (npm run build)
- [ ] No console errors
- [ ] Lighthouse score >90
- [ ] All git commits pushed

#### Deployment Steps
- [ ] Convex deployed (`npx convex deploy --prod`)
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Cron jobs verified active
- [ ] Frontend deployed to Vercel
- [ ] DNS configured correctly

#### Post-Deployment
- [ ] Production smoke tests
- [ ] Monitoring active
- [ ] Error tracking configured
- [ ] Backup system verified
- [ ] Rollback plan ready

### 13. Monitoring & Observability

#### Metrics
- [ ] Daily sync success rate
- [ ] Detection accuracy tracking
- [ ] Calendar export usage
- [ ] Cancel Assistant opens
- [ ] Average prediction confidence

#### Alerts
- [ ] Failed sync alerts
- [ ] Plaid API errors
- [ ] High error rates
- [ ] Slow query warnings

---

## Test Results Summary

**Date:** _________

**Tester:** _________

**Environment:** [ ] Development [ ] Staging [ ] Production

**Overall Status:** [ ] PASS [ ] FAIL [ ] PARTIAL

**Critical Issues:** _________

**Non-Critical Issues:** _________

**Sign-off:** _________

---

## Deployment Approval

**Approved by:** _________

**Date:** _________

**Deployment scheduled for:** _________

**Rollback plan confirmed:** [ ] Yes [ ] No
