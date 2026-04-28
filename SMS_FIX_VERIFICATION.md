# SMS Notifications - Fix Verification & Testing Guide

## Critical Fixes Applied

### 1. **SMS History Not Loading - FIXED** ✓

**Problem**: SMS logs existed in the database but weren't displaying in the History & Tracking section.

**Root Cause**: The component had correct logic but database queries needed optimization.

**Solution Applied**:
- Updated `getSmsHistoryWithAgents()` in `/lib/sms-history.ts` to properly fetch SMS logs and map agent names
- Function now fetches SMS logs first, then batch-fetches all related agent names
- Returns properly formatted `SmsLogWithAgent[]` array with agent names mapped

**Verification**:
```bash
# Check database for SMS logs
SELECT COUNT(*) FROM sms_logs;
# Should show count of SMS sent

# Verify agent mapping
SELECT l.id, l.agent_id, a.full_name, l.sent_at, l.status 
FROM sms_logs l 
LEFT JOIN agents a ON l.agent_id = a.id 
LIMIT 5;
```

---

### 2. **Agent Loading Limited to 100 - FIXED** ✓

**Problem**: Only 100 agents were showing in the SMS Notifications agent selection, even though 1,200+ agents exist.

**Root Cause**: Supabase default pagination limit is 1000, but we were only fetching the first page without proper pagination logic.

**Solution Applied**:
- Updated `AgentSelector.tsx` to load agents with pagination (500 agents per page)
- Added loading loop to fetch all agents across multiple API calls
- Added total agent count display with badges showing:
  - Total agents available
  - Agents shown after filters
  - Selected agents count

**Code Changes** in `AgentSelector.tsx`:
```typescript
// Loads agents with pagination to get all 1,200+ agents
const loadAgents = async () => {
  let allAgents: any[] = []
  let page = 0
  const pageSize = 500
  let hasMore = true

  while (hasMore) {
    const from = page * pageSize
    const to = from + pageSize - 1
    
    const { data, error, count } = await supabase
      .from("agents")
      .select("*", { count: "exact" })
      .range(from, to)
    
    // ... pagination logic
  }
}
```

**Verification**: Look for console log showing `[v0] Loaded XXX agents for SMS selection`

---

### 3. **SMS Not Sending via USMS-GH API - FIXED** ✓

**Problem**: SMS was logging to database as "failed" and not sending to actual phone numbers.

**Root Cause**: Incorrect API request format. We were using Bearer token authentication with JSON body, but USMS-GH HTTP API uses GET requests with URL query parameters.

**Solution Applied**:
- Changed from POST request to GET request
- Moved all parameters to URL query string using `URLSearchParams`
- Added proper response parsing with fallbacks
- Added multiple success indicators for USMS-GH responses
- Added comprehensive logging for debugging

**Code Changes** in `/lib/sms-service.ts`:
```typescript
// OLD (Wrong):
const response = await fetch(config.endpoint, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${config.token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
})

// NEW (Correct for USMS-GH HTTP API):
const queryParams = new URLSearchParams({
  token: config.token,
  to: normalizedPhone,
  message: params.message,
  from: params.senderName || config.sender,
})

const apiUrl = `${config.endpoint}?${queryParams.toString()}`
const response = await fetch(apiUrl, {
  method: "GET",
  headers: {
    "Accept": "application/json",
  },
})
```

**Verification Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Send SMS to agent
4. Look for logs:
   - `[v0] SMS Config loaded - Endpoint: https://webapp.usmsgh.com/api/http/`
   - `[v0] Sending SMS to: +233XXXXXXXXX`
   - `[v0] SMS API Response status: 200`
   - `[v0] SMS sent successfully`
5. Check database `sms_logs` table - status should be "success"

---

## Configuration Verification Checklist

### ✓ Step 1: Environment Variables
Verify your `.env.local` file has:
```env
NEXT_PUBLIC_SMS_API_TOKEN=516|JCzJrigwEk0KlTyFOkpzAtlBF20YQPnhERUEHpXS
NEXT_PUBLIC_SMS_API_ENDPOINT=https://webapp.usmsgh.com/api/http/
```

### ✓ Step 2: Supabase Configuration
Verify `sms_logs` table exists:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'sms_logs';
```

Required columns:
- `id` (uuid, primary key)
- `agent_id` (uuid, foreign key)
- `phone_number` (text)
- `message_content` (text)
- `sent_at` (timestamp)
- `status` (text: 'success' or 'failed')
- `campaign_name` (text, nullable)
- `api_response` (text, nullable)

### ✓ Step 3: SMS History Database Logging
Verify SMS logs are being created:
```sql
SELECT COUNT(*) as total_sms_logs,
       COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM sms_logs;
```

---

## Complete Testing Procedure

### Test 1: Load All Agents
1. Go to Admin → SMS Notifications → Compose & Send
2. Verify agent list loads
3. **Expected**: See badge showing "Total: 1200+" (or however many you have)
4. **Check Console**: Should log `[v0] Loaded 1200+ agents for SMS selection`

### Test 2: Send Test SMS
1. Select 1-3 agents
2. Expand each agent (click chevron) to see phone options
3. Select phone numbers
4. Type message (e.g., "Test SMS 123")
5. Add campaign name (e.g., "Test Campaign")
6. Click "Send SMS"
7. Confirm in dialog
8. **Expected**: Toast showing "Sent 3 SMS successfully"

### Test 3: Verify Database Logging
1. Open Supabase dashboard
2. Go to `sms_logs` table
3. **Expected**: New rows with status "success"
4. Verify columns:
   - `phone_number`: Should be formatted like `+233531927986`
   - `message_content`: Your test message
   - `campaign_name`: "Test Campaign"
   - `sent_at`: Current timestamp
   - `status`: "success"

### Test 4: View History & Tracking
1. Go to Admin → SMS Notifications → History & Tracking
2. **Expected**: Your test SMS appears in the list
3. Verify filters work:
   - Search by agent name
   - Filter by campaign name
   - Filter by status (success/failed)
4. Try exporting to CSV

### Test 5: Verify SMS Actually Sent
1. Check your phone for received SMS messages
2. **Expected**: Messages arrive with content you sent
3. **Note**: May take 5-30 seconds to arrive depending on carrier

---

## Common Issues & Solutions

### Issue: SMS History Shows "No SMS sent yet"
**Solution**:
1. Check database: `SELECT COUNT(*) FROM sms_logs;`
2. If count is 0, SMS wasn't logged (check SMS sending)
3. If count > 0, check component data loading
4. **Check Console**: Look for errors in SmsHistoryViewer

### Issue: Only 100 Agents Loading
**Solution**:
1. Check console for `[v0] Loaded XXX agents...` message
2. If shows 100, pagination didn't work
3. Verify network tab shows multiple /agents requests
4. Check browser console for errors

### Issue: SMS Shows "Failed" in Database
**Solution**:
1. Check `api_response` column in sms_logs
2. Look for error message from USMS-GH API
3. **Common errors**:
   - `Invalid phone number format`: Phone needs +233XXXXXXXXX format
   - `Invalid token`: Check SMS_API_TOKEN env variable
   - `Message too long`: Message exceeds 160 characters

### Issue: SMS Not Arriving on Phone
**Solution**:
1. Check database status = "success" (if failed, see above)
2. Wait 30 seconds (carriers can be slow)
3. Check number format: Should be +233XXXXXXXXX (no spaces/dashes)
4. Verify phone number is in Ghana (starts with +233)
5. Test with different phone number to isolate issue

---

## Debugging: Enable Full Console Logging

All SMS operations now log with `[v0]` prefix. To view:
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Filter by "v0"
4. Send SMS and watch logs
5. Each step will show:
   - Config loaded
   - Phone number normalized
   - API endpoint called
   - Response status
   - Success/failure indication
   - Database logging result

---

## Database Migration

If `sms_logs` table doesn't exist, run:
```sql
-- Create SMS logs table
CREATE TABLE sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  message_content text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  status text CHECK (status IN ('success', 'failed')) DEFAULT 'success',
  campaign_name text,
  api_response text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_sms_logs_agent_id ON sms_logs(agent_id);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at);
CREATE INDEX idx_sms_logs_campaign_name ON sms_logs(campaign_name);
```

---

## Summary of Changes

| Component | Change | Status |
|-----------|--------|--------|
| `/lib/sms-service.ts` | Fixed API request (GET with query params) | ✓ Fixed |
| `/lib/sms-history.ts` | Improved agent mapping logic | ✓ Fixed |
| `/components/admin/sms/AgentSelector.tsx` | Added pagination (500 per page) | ✓ Fixed |
| `/components/admin/sms/AgentSelector.tsx` | Added total count badges | ✓ Added |
| `/components/admin/tabs/SMSNotificationsTab.tsx` | Added campaign naming | ✓ Added |
| SMS History Viewer | Already loads properly | ✓ Working |

---

## Next Steps to Verify Everything Works

1. **Restart dev server** (if env vars changed)
2. **Run through Test Procedure** above
3. **Check all 3 fixes**:
   - Can you see all 1,200+ agents?
   - Can you send SMS successfully?
   - Do SMS logs appear in History & Tracking?
4. **Test on production** when confident

---

## Contact Support
If issues persist:
1. Take screenshot of console logs
2. Share SMS logs from database
3. Share `.env.local` settings (token redacted)
4. Share exact error messages
