# Debug Instructions for Premium User Not Detected

## Immediate Steps:

1. **Click "Sync Status" button** in the upgrade modal
2. **Open browser console** (F12 → Console tab)  
3. **Look for these log messages:**
   - `🔄 Manual tier sync requested for user:`
   - `✅ Tier detected (high confidence):`
   - `⬆️ Upgrading user to premium:`

## If Sync Fails:

### Method 1: Access Debug Panel
1. Go to `/dashboard` 
2. Look for debug panel (orange/red card)
3. Click "Actions" tab
4. Click "🔄 Force Sync Tier"
5. Check "Environment" tab for issues

### Method 2: Direct API Check
Navigate to: `https://usesubwise.app/api/sync/tier` in your browser
This will show you raw JSON of what the system detects.

### Method 3: Manual Admin Override
In debug panel, click "🚀 Force Premium" button as temporary fix.

## What to Look For:

### Console Logs:
- `✅` = Success
- `❌` = Error  
- `⚠️` = Warning
- `🔍` = Detection info

### Common Issues:
- **Environment errors**: Missing CLERK_PREMIUM_PLAN_ID
- **Low confidence detection**: Clerk metadata not set
- **Webhook failures**: Subscription not processed

## Quick Fixes:

1. **Refresh page** after sync
2. **Clear browser cache** if needed  
3. **Try incognito/private mode**
4. **Log out and back in** to force refresh

## If Still Broken:

Your Clerk metadata might not be set correctly. The system should detect:
- `publicMetadata.tier = "premium_user"`  
- `publicMetadata.plan = "premium"`
- `publicMetadata.subscriptionType = "annual"`

Contact support with your User ID from the debug panel.
