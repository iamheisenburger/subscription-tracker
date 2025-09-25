# 🧪 Testing Guide for Notification & Currency Fixes

## **Fixed Issues Summary**
✅ Currency conversion now uses working free API (`open.er-api.com`)  
✅ Spending threshold notifications work for ALL users (not just premium)  
✅ Auto-add SubWise subscription when upgrading to premium  
✅ Currency preference respected in spending alerts  

## **Testing Steps**

### **1. Test Currency Conversion**
```javascript
// Open browser dev tools and run this in the console
fetch('https://open.er-api.com/v6/latest/USD')
  .then(r => r.json())
  .then(data => {
    console.log('✅ API Status:', data.result);
    console.log('💱 EUR Rate:', data.rates.EUR);
    console.log('💱 GBP Rate:', data.rates.GBP);
    console.log('💱 CAD Rate:', data.rates.CAD);
  });
```

### **2. Test Spending Threshold (Manual Trigger)**

1. **Set threshold to $100** (as you did)
2. **Add subscriptions totaling > $100/month** (as you have: $187.86)
3. **Manually trigger cron job**:

Go to Convex dashboard → Functions → Run this:

```javascript
// In Convex dashboard, run internal function:
internal.notifications.checkSpendingThresholds({})
```

### **3. Test Auto-Add SubWise Subscription**

**Option A: Using Admin API**
```bash
# Use your admin endpoint to upgrade to premium
curl -X POST http://localhost:3000/api/admin/set-subscription-type \
  -H "Content-Type: application/json" \
  -d '{"subscriptionType": "monthly"}'
```

**Option B: Using Convex Dashboard**
```javascript
// In Convex dashboard, run:
api.users.setTier({
  clerkId: "your-clerk-id",
  tier: "premium_user", 
  subscriptionType: "monthly"
})
```

## **Expected Results**

### **Currency Conversion**
- ✅ Real-time accurate rates between all 5 currencies
- ✅ Cross-currency accuracy (EUR-GBP, USD-CAD, etc.)
- ✅ Updates hourly with live market rates

### **Spending Threshold**
- ✅ Email notification sent to your email address
- ✅ Notification uses your preferred currency setting
- ✅ Works for both free AND premium users

### **Auto-Add SubWise**
- ✅ SubWise subscription automatically added on upgrade
- ✅ Correct pricing: $9/month or $90/year (2-month discount)
- ✅ Appears in your subscription list immediately

## **Debug Commands**

### **Check Notification Queue**
```javascript
// Convex dashboard
api.notifications.getNotificationHistory({clerkId: "your-clerk-id"})
```

### **Check Currency Rates Cache**
```javascript
// Browser console
localStorage.getItem('exchange-rates:USD')
```

### **Check User Tier**
```javascript
// Convex dashboard  
api.users.getUserByClerkId({clerkId: "your-clerk-id"})
```

## **Manual Email Testing**
If automated notifications don't work, test email service:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test_connection"
  }'
```

---

## **Why Notifications Weren't Working Before**

1. **Spending alerts were PREMIUM-ONLY** (you're free tier)
2. **Currency API was broken** (exchangerate.host requires API key now)
3. **Hardcoded USD currency** in notifications (ignored your preferences)
4. **SubWise subscription missing** (not tracking your own costs)

All fixed! 🚀
