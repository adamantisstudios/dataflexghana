# SMS Setup & Troubleshooting Guide

## Environment Variables Setup

### Local Testing (.env.local)

Add these to your `.env.local` file in the project root:

```env
# USMS-GH API Configuration
NEXT_PUBLIC_SMS_API_TOKEN=516|JCzJrigwEk0KlTyFOkpzAtlBF20YQPnhERUEHpXS
NEXT_PUBLIC_SMS_API_ENDPOINT=https://webapp.usmsgh.com/api/http/
```

### Vercel Production Deployment

1. Go to your Vercel project settings
2. Navigate to **Settings > Environment Variables**
3. Add the same variables above
4. Deploy to production

## Testing SMS Functionality Locally

### Step 1: Start the Development Server

```bash
cd /vercel/share/v0-project
pnpm dev
```

### Step 2: Navigate to SMS Notifications

1. Go to `/admin` in your browser
2. Click on the **"SMS Notifications"** tab
3. Select the **"Compose & Send"** tab (if not already selected)

### Step 3: Test Agent Selection

1. You should now see all agents loaded (showing total count at top)
2. Search for an agent by name, phone, or Momo number
3. Click on an agent to expand and select phone/Momo number
4. The number will be automatically formatted with country code (+233)
5. You can edit the number before sending

### Step 4: Send Test SMS

1. Select 1-2 test agents
2. Type a message (max 160 characters)
3. Optionally add a campaign name (e.g., "Test Campaign")
4. Click **"Review & Send"** button
5. Confirm in the dialog
6. Wait for the SMS to be sent

## Troubleshooting

### Issue 1: "SMS API token is not configured"

**Problem**: You see this error when trying to send

**Solution**:
1. Check `.env.local` has `NEXT_PUBLIC_SMS_API_TOKEN` set
2. Restart your dev server: `Ctrl+C` then `pnpm dev`
3. Check browser console (F12) for detailed error messages

### Issue 2: SMS Not Sending (No Error Message)

**Problem**: Message gets logged to database but SMS never arrives

**Solution**:
1. **Check the browser console** (F12 → Console tab) for logs starting with `[v0]`
2. Look for these specific logs:
   - `[v0] SMS Config loaded:` - shows if token is recognized
   - `[v0] Sending SMS to:` - shows the formatted phone number
   - `[v0] SMS API Response status:` - shows HTTP response code
   - `[v0] SMS API Success response:` - shows the API response

3. **Check database logs**: Go to SMS History tab to see logged messages
4. **Verify phone number format**: Must start with `+` (e.g., `+233531927986`)
5. **Check message length**: Must be ≤ 160 characters

### Issue 3: API Returns Error (Status 400, 401, etc.)

**Problem**: You see an API error status code in console

**Solution**:
1. **Status 401 (Unauthorized)**: Your API token is invalid or expired
   - Verify token in `.env.local` matches exactly
   - Check USMS-GH dashboard for active tokens
   
2. **Status 400 (Bad Request)**: The request format is wrong
   - Check phone number format (must be `+233XXXXXXXXX` for Ghana)
   - Ensure message is not empty and ≤ 160 chars
   
3. **Status 500 (Server Error)**: USMS-GH API is having issues
   - Wait a few moments and retry
   - Check USMS-GH status page

### Issue 4: Only 100 Agents Showing

**Problem**: You only see 100 agents even though you have 1,200+

**Solution**: This has been fixed! Now loading all agents with pagination:
1. Agents load in batches of 500
2. Shows total count at top right
3. Total agents display updates after loading completes
4. Search/filter works on all agents

### Issue 5: SMS History Not Showing

**Problem**: Clicking "History & Tracking" tab shows no data

**Solution**:
1. **Wait for data to load**: First time loading can take a few seconds
2. **Check if SMS were sent**: Go to Compose tab and send at least one test SMS
3. **Refresh the page**: Browser may need to refresh to show latest data
4. **Check database directly**: 
   - Go to Supabase dashboard
   - Check `sms_logs` table has records
   - Verify `agent_id` and `sent_at` fields are populated

## Phone Number Formatting

### Automatic Formatting

When you select an agent:
- Original number: `0531927986` (Ghana)
- Formatted number: `+233531927986`
- Country code automatically added based on agent's region

### Manual Editing

You can click the edit icon next to a formatted number to:
1. Modify the entire number
2. Change country code if needed
3. Example: `+233531927986` → `+233501234567`

**Important**: Always use international format with `+` prefix

## API Cost Optimization

To prevent unnecessary SMS charges:

### 1. Use Campaign Names
- Group related SMS by campaign
- Makes it easy to avoid duplicate sends
- Example: "March 2024 Approval Drive"

### 2. Smart Filtering Before Send
- Filter by approval status (approved/unapproved)
- Use search to target specific agents
- Double-check agent count before sending

### 3. Review Before Send
- Always confirm the count in the dialog
- Verify campaign name is correct
- Check message content

### 4. Track History
- Use History tab to check recent sends
- Filter by campaign name to see related sends
- Verify before re-sending to same agents

## API Request Format

The SMS service sends requests in this format:

```json
{
  "to": "+233531927986",
  "from": "YourBusiness",
  "message": "Your SMS message here",
  "api_key": "516|JCzJrigwEk0KlTyFOkpzAtlBF20YQPnhERUEHpXS"
}
```

**Note**: 
- `to` must include country code with `+` prefix
- `message` max length is 160 characters
- `from` is the sender name (max 11 characters typically)
- `api_key` is automatically added from environment

## Next Steps

1. ✅ Start dev server (`pnpm dev`)
2. ✅ Navigate to Admin → SMS Notifications
3. ✅ Select 1-2 test agents
4. ✅ Send a test message
5. ✅ Check SMS History to confirm delivery
6. ✅ Check browser console for `[v0]` logs

## Still Having Issues?

1. **Check browser console** (F12 → Console) for `[v0]` debug logs
2. **Check .env.local** file for typos in token
3. **Restart dev server** if you edited .env.local
4. **Check Supabase dashboard** for sms_logs records
5. **Verify agent data** exists and has phone numbers
6. **Test with different agents** to isolate the issue
