# 🔧 MANUAL PREMIUM USER SYNC GUIDE

## 🎯 PROBLEM

**Webhooks failed** for 66/159 users (41%). These users paid for premium but got stuck as "free" because the webhook didn't update their metadata.

## ✅ SOLUTION: MANUAL SYNC

Since standard Clerk doesn't expose a "list user subscriptions" API, you need to manually sync users who paid.

---

## 🚀 METHOD 1: INDIVIDUAL USER FIX (Via Clerk Dashboard)

### **Steps**:

1. **Go to Clerk Dashboard** → Users → Subscriptions tab
2. **Find user with active subscription**
3. **Click on user** → Public Metadata
4. **Add this JSON**:
   ```json
   {
     "tier": "premium_user",
     "plan": "premium",
     "subscriptionType": "annual",
     "manually_fixed_at": "2025-01-30T12:00:00Z",
     "fix_reason": "Webhook failure recovery"
   }
   ```
5. **Save** → User is now premium ✅

**Time**: ~30 seconds per user
**Best for**: 1-5 users

---

## 🚀 METHOD 2: BULK FIX (Via Admin API)

### **Setup** (One-time):

1. **Add to Vercel environment variables**:
   ```
   ADMIN_SECRET=your-secure-random-string-here
   ```

2. **Deploy** (already done with latest push)

### **Usage**:

**Step 1: Get Premium User IDs from Clerk**

1. Go to Clerk Dashboard → Users → Subscriptions
2. Filter: Status = "Active"
3. Copy user IDs of all active premium subscribers

**Step 2: Run Bulk Sync**

```bash
curl -X POST https://usesubwise.app/api/admin/sync-premium-users \
  -H "Content-Type: application/json" \
  -d '{
    "adminSecret": "your-secret-here",
    "userIds": [
      "user_2nG8k3jH8sK3lP2q",
      "user_3aB4c5dE6fG7hI8j",
      "user_4kL5m6nO7pQ8rS9t"
    ],
    "subscriptionType": "annual"
  }'
```

**Response**:
```json
{
  "message": "Synced 3/3 users",
  "results": {
    "success": ["user_2nG8k3jH8sK3lP2q", "user_3aB4c5dE6fG7hI8j", "user_4kL5m6nO7pQ8rS9t"],
    "failed": [],
    "total": 3
  }
}
```

**Time**: ~2 minutes for 66 users
**Best for**: Bulk fixing all stuck users

---

## 🚀 METHOD 3: POSTMAN/INSOMNIA

Use API client for easier testing:

**Request**:
- Method: `POST`
- URL: `https://usesubwise.app/api/admin/sync-premium-users`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "adminSecret": "your-secret",
  "userIds": ["user_xxx", "user_yyy"],
  "subscriptionType": "annual"
}
```

---

## 📋 COMPLETE WORKFLOW

### **For Your 66 Stuck Users**:

**1. Identify Stuck Users** (5 mins)
```
Clerk Dashboard → Users → Subscriptions
Filter by: Status = Active
Export list of user IDs
```

**2. Prepare Sync Request** (2 mins)
```json
{
  "adminSecret": "your-secret",
  "userIds": [
    "user_id_1",
    "user_id_2",
    // ... all 66 users
  ],
  "subscriptionType": "annual"  // or "monthly" based on their plan
}
```

**3. Run Sync** (1 min)
```bash
# Send POST request to admin endpoint
# See response confirming all users synced
```

**4. Verify** (2 mins)
```
- Pick random user from the list
- Have them log into app
- Check they see premium features
- Check Clerk metadata updated
```

**Total time**: ~10 minutes to fix all 66 users

---

## 🔐 SECURITY

**Admin Secret**:
- Generate strong random string
- Store in Vercel env vars only
- NEVER commit to git
- Rotate periodically

**Endpoint Protection**:
- Requires admin secret
- Rate-limited by Vercel
- Logs all sync attempts
- Only accessible to you

---

## 🎯 WHICH METHOD TO USE?

| Situation | Method | Time |
|-----------|--------|------|
| 1-2 stuck users | Method 1 (Clerk Dashboard) | 1 min |
| 5-10 stuck users | Method 1 (Clerk Dashboard) | 5 mins |
| 66 stuck users | Method 2 (Bulk API) | 10 mins |
| Ongoing issues | Fix webhooks (see below) | - |

---

## 🔧 LONG-TERM FIX: IMPROVE WEBHOOKS

**Current Issue**: 41% failure rate

**Solutions**:

1. **Optimize Webhook Endpoint**
   - Make `/api/webhooks/clerk` faster
   - Add timeout handling
   - Improve error handling

2. **Monitor Webhook Logs**
   - Clerk Dashboard → Webhooks → Logs
   - Check failure reasons
   - Address common patterns

3. **Retry Logic**
   - Clerk auto-retries failed webhooks
   - But eventually gives up
   - Manual sync catches stragglers

---

## ✅ AFTER SYNC

**What Happens**:

1. ✅ User metadata updated in Clerk
2. ✅ User tier updated in Convex
3. ✅ User sees premium features immediately
4. ✅ No app restart needed
5. ✅ Permanent fix (persists across sessions)

**Users will**:
- See unlimited subscription slots
- Access premium analytics
- Get export features
- Have priority support

---

## 🆘 TROUBLESHOOTING

### **"Unauthorized" error**
```
→ Check ADMIN_SECRET env var is set in Vercel
→ Make sure you're using correct secret in request
```

### **"User not found" error**
```
→ Verify user ID is correct (from Clerk dashboard)
→ Check user actually exists in Clerk
```

### **Sync succeeds but user still shows as free**
```
→ Have user log out and log back in
→ Check Clerk metadata was actually updated
→ Verify Convex deployment is using latest code
```

### **Can't find which users need fixing**
```
→ Clerk Dashboard → Subscriptions → Active
→ Compare with app dashboard
→ Look for discrepancies
```

---

## 📊 VERIFICATION CHECKLIST

After bulk sync:

- [ ] Run API request with all user IDs
- [ ] Check response shows all success
- [ ] Pick 3-5 random users
- [ ] Verify their Clerk publicMetadata has tier: "premium_user"
- [ ] Have them log into app
- [ ] Confirm they see premium features
- [ ] Check Convex database shows premium tier
- [ ] Monitor for any errors in logs

---

## 💡 PREVENTION

**To avoid this in future**:

1. **Monitor webhook health** in Clerk dashboard
2. **Set up alerts** for webhook failures
3. **Run weekly sync** to catch stragglers
4. **Improve webhook endpoint** performance
5. **Consider Clerk Billing product** (has better API)

---

## 🎯 SUMMARY

**Fastest Fix**: Use Method 2 (Bulk API)
**Time to fix 66 users**: ~10 minutes
**Code changes**: None (already deployed)
**Environment setup**: Add ADMIN_SECRET to Vercel
**Complexity**: Low (simple API call)

**The 66 users stuck in free tier can be fixed in under 10 minutes with a single API call.**
