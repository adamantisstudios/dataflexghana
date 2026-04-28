# SMS Notifications - Quick Start Testing (5 Minutes)

## What Was Fixed
1. ✅ **CSV Export** - Now exports all 1,200+ agents (not just 1,000)
2. ✅ **Agent Selector** - Shows all agents with pagination
3. ✅ **SMS Sending** - Fixed API request format for USMS-GH
4. ✅ **History Tracking** - SMS logs display in History & Tracking tab

---

## Pre-Test Checklist

```
☐ Environment variables set (.env.local):
  NEXT_PUBLIC_SMS_API_TOKEN=516|JCzJrigwEk0KlTyFOkpzAtlBF20YQPnhERUEHpXS
  NEXT_PUBLIC_SMS_API_ENDPOINT=https://webapp.usmsgh.com/api/http/

☐ Database table exists: sms_logs (check Supabase)

☐ Dev server running: pnpm dev

☐ Can access admin panel: /admin/sms-notifications
```

---

## 5-Minute Test Flow

### Step 1: Open Browser Console (F12)
```
Press F12 → Console tab
Search for "[v0]" to filter logs
```

### Step 2: Navigate to SMS Notifications
```
Admin Dashboard → SMS Notifications → Compose & Send tab
```

### Step 3: Verify All Agents Load
```
Expected: See badge "Total: 1200+"
Console: "[v0] Loaded 1200+ agents for SMS selection"
```

### Step 4: Select Test Agents
```
1. Search: "approved" in agent name or scroll
2. Click checkbox next to 1-2 agents
3. Expected: Agents expand to show phone options
4. Select phone (phone_number or momo_number)
5. Number should format: 0531927986 → +233531927986
```

### Step 5: Compose Message
```
1. Type: "Test 123" (or similar)
2. Character counter should show: 8/160
3. Button "Send SMS" enabled
```

### Step 6: Name Campaign (Optional)
```
1. Enter: "Test Campaign"
2. Not required but helps track messages
```

### Step 7: Send
```
1. Click "Send SMS"
2. Confirmation dialog appears
3. Click "Confirm"
4. Expected toast: "Sent X SMS successfully"
```

### Step 8: Check Console Logs
```
Should see in order:
[v0] SMS Config loaded - Endpoint: https://webapp.usmsgh.com/api/http/
[v0] Sending SMS to: +233XXXXXXXXX Message length: 8
[v0] SMS API Response status: 200
[v0] SMS sent successfully
```

### Step 9: Check Database
```
Supabase → sms_logs table
Should see new row(s) with:
- agent_id: [selected agent ID]
- phone_number: +233531927986
- message_content: "Test 123"
- status: "success"
- campaign_name: "Test Campaign"
- sent_at: [current time]
```

### Step 10: View History
```
1. Click "History & Tracking" tab
2. Should show your test SMS in the list
3. Status badge should be green "✓ Sent"
4. Filter by campaign "Test Campaign"
```

---

## Success Indicators ✓

All of these should be true:

- [ ] Agent selector loads 1,200+ agents (badge shows total)
- [ ] Can select multiple agents with checkboxes
- [ ] Phone numbers format as +233XXXXXXXXX
- [ ] Can edit phone numbers before sending
- [ ] SMS sends without errors (console shows [v0] logs)
- [ ] Database row created in sms_logs with status "success"
- [ ] History & Tracking tab displays the SMS
- [ ] SMS appears in phone (after 5-30 seconds)

---

## If Something Fails

### Agents Not Loading (shows 100)
```
Console: Check for errors
Fix: Refresh page, check network tab for failed requests
```

### SMS Shows "Failed" in Database
```
Check: api_response column in sms_logs for error message
Common: Wrong phone format, expired token, invalid message
```

### History Tab Shows "No SMS sent yet"
```
But database has records: Page may not be refreshing
Fix: Refresh page, check console for loading errors
```

### SMS Not Arriving on Phone
```
Check: Database shows status "success"
If yes: SMS sent but not received (carrier delay or wrong number)
If no: Check api_response for USMS-GH error message
```

---

## Detailed Logs to Check

Open Console, look for:

✓ **Config Loading**
```
[v0] SMS Config loaded - Endpoint: https://webapp.usmsgh.com/api/http/
```

✓ **Agent Loading**
```
[v0] Loaded 1200+ agents for SMS selection
```

✓ **SMS Sending**
```
[v0] Sending SMS to: +233XXXXXXXXX Message length: 8
[v0] SMS API Response status: 200
[v0] SMS sent successfully - Message ID: (some-id)
```

✓ **Database Logging**
```
[SMS will be logged to database with these fields...]
```

✗ **If Failed**
```
[v0] Error: (detailed error message from API or system)
Check database api_response column for full error
```

---

## Quick Database Check

```sql
-- Count all SMS logs
SELECT COUNT(*) as total_sms FROM sms_logs;

-- View latest SMS
SELECT agent_id, phone_number, message_content, status, sent_at 
FROM sms_logs 
ORDER BY sent_at DESC 
LIMIT 5;

-- Check by campaign
SELECT * FROM sms_logs 
WHERE campaign_name = 'Test Campaign'
ORDER BY sent_at DESC;

-- Success rate
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM sms_logs;
```

---

## Environment Variables Quick Copy

If you need to reset, these are the values:

```
NEXT_PUBLIC_SMS_API_TOKEN=516|JCzJrigwEk0KlTyFOkpzAtlBF20YQPnhERUEHpXS
NEXT_PUBLIC_SMS_API_ENDPOINT=https://webapp.usmsgh.com/api/http/
```

Add to: `.env.local` and restart dev server (`pnpm dev`)

---

## What You Should See at Each Step

| Step | Expected Result | Success = ✓ |
|------|-----------------|-----------|
| Open SMS tab | Page loads, no errors | ✓ |
| Agent selector loads | Badge shows "Total: 1200+" | ✓ |
| Select agent | Agent expands, shows phones | ✓ |
| Format phone | Shows +233XXXXXXXXX | ✓ |
| Type message | Counter shows X/160 | ✓ |
| Click Send | Confirmation dialog | ✓ |
| Confirm | Success toast appears | ✓ |
| Check console | [v0] logs show success | ✓ |
| Check database | New row in sms_logs | ✓ |
| Check history tab | SMS visible in list | ✓ |
| Check phone | SMS arrives (5-30sec) | ✓ |

---

## Support

If stuck:
1. Check console for [v0] error messages
2. Check database api_response column
3. Verify .env.local has correct values
4. Restart dev server (Ctrl+C, pnpm dev)
5. Check SMS_FIX_VERIFICATION.md for detailed troubleshooting
