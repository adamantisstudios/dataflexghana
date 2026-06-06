# SMS Notifications Testing Guide

## Local Setup Instructions

### Step 1: Environment Variables

The `.env.local` file has been created with the required environment variables. Here's what you need to do:

#### A. SMS API Credentials (Already Provided)
```env
NEXT_PUBLIC_SMS_API_TOKEN=516|JCzJrigwEk0KlTyFOkpzAtlBF20YQPnhERUEHpXS
NEXT_PUBLIC_SMS_API_ENDPOINT=https://webapp.usmsgh.com/api/http/
```

These are already populated in `.env.local`. No action needed.

#### B. Supabase Credentials (REQUIRED FOR DATABASE LOGGING)
You need to add your Supabase credentials to `.env.local`:

1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy these values:
   - **Project URL**: Paste into `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: Paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key**: Paste into `SUPABASE_SERVICE_ROLE_KEY`

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Step 2: Create SMS Logs Table in Supabase

Before sending SMS, you need to create the `sms_logs` table in your Supabase database.

**Option A: Using Supabase SQL Editor (Recommended)**
1. Go to your Supabase project → SQL Editor
2. Click "New Query"
3. Copy and paste the contents of `/scripts/002-create-sms-logs-table.sql`
4. Click "Run"

**Option B: Using Python Script**
```bash
cd /vercel/share/v0-project
python scripts/execute-migration.py
```

The SQL migration creates:
- `sms_logs` table with all required fields
- Proper indexes for performance
- Row-level security (RLS) policies
- Timestamps and status tracking

### Step 3: Start the Dev Server

```bash
cd /vercel/share/v0-project
pnpm dev
```

The dev server will start at `http://localhost:3000`

### Step 4: Navigate to SMS Notifications Tab

1. Log in to your admin dashboard
2. Go to **Admin Dashboard**
3. Click on the **SMS Notifications** tab
4. You should see two sub-tabs:
   - **Compose & Send**: Send new SMS campaigns
   - **History & Tracking**: View all SMS sent

## Testing SMS Sending

### Test Scenario 1: Send to Single Agent

1. In the **Compose & Send** tab:
   - Search for an agent by name
   - Check the agent's checkbox
   - Click the expand arrow (▼) next to the agent
   - Choose which phone number to use (phone or momo)
   - Verify the formatted phone number with country code (+233...)
   - Edit the phone number if needed
   
2. Type your test message (max 160 characters)
3. (Optional) Enter a campaign name like "Test Campaign - Local"
4. Click "Send SMS"
5. Review the confirmation dialog
6. Click "Confirm Send"
7. Wait for the results dialog showing success/failure

### Test Scenario 2: Send to Multiple Agents

1. In the **Compose & Send** tab:
   - Use the filter dropdown to select "Approved" or "Unapproved" agents
   - Search for specific agents if needed
   - Check multiple agent checkboxes
   - Expand each agent and select phone numbers
   
2. Type your message
3. Enter campaign name (e.g., "Multi-Agent Test")
4. Click "Send SMS"
5. Review the list of selected agents in confirmation dialog
6. Confirm and send

### Test Scenario 3: Send to All Approved Agents

1. Click the "Approved" filter in the Agent Selector
2. Click "Select All" checkbox to select all approved agents
3. Expand agents and configure phone numbers (or use defaults)
4. Type message
5. Enter campaign name
6. Send and confirm

## Verifying SMS Was Sent

### In the UI

1. Go to **History & Tracking** tab
2. You should see all SMS sent with:
   - Agent name
   - Phone number used
   - Campaign name
   - Sent date/time
   - Status (success/failed)
   - Message preview

### In the Database

Query the `sms_logs` table directly in Supabase SQL Editor:

```sql
SELECT * FROM sms_logs 
ORDER BY sent_at DESC 
LIMIT 20;
```

This shows:
- agent_id: Which agent received the SMS
- phone_number: The actual number SMS was sent to
- message_content: The message text
- sent_at: When it was sent
- status: success or failed
- campaign_name: The campaign it belongs to
- api_response: Full USMS-GH API response for debugging

## Troubleshooting

### Error: "SMS API token is not configured"

**Solution:** Check that `NEXT_PUBLIC_SMS_API_TOKEN` is in your `.env.local` file and the dev server has been restarted after adding it.

```bash
# Restart dev server
Ctrl+C  # Stop current server
pnpm dev  # Start again
```

### Error: "Supabase connection failed"

**Solution:** Verify your Supabase credentials in `.env.local`:
1. Check that `NEXT_PUBLIC_SUPABASE_URL` is correct (should start with https://...supabase.co)
2. Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Verify your Supabase project is active and not paused

### SMS shows as "failed" in history

**Solution:** Check the `api_response` field in the `sms_logs` table for the error message:

```sql
SELECT agent_id, phone_number, status, api_response 
FROM sms_logs 
WHERE status = 'failed' 
ORDER BY sent_at DESC;
```

Common issues:
- **Invalid phone format**: Phone number must start with country code (e.g., +233...)
- **Invalid API token**: Check USMS-GH credentials
- **Insufficient balance**: Check your USMS-GH account balance
- **Network error**: Check internet connection and firewall

### Phone number not formatting correctly

**Solution:** Verify that the agent's region is set to "ghana" in the database. The system auto-formats to +233 for Ghana numbers.

To update an agent's region:
```sql
UPDATE agents 
SET region = 'ghana' 
WHERE id = 'agent_id_here';
```

## Testing Checklist

- [ ] Environment variables set in `.env.local`
- [ ] SMS logs table created in Supabase
- [ ] Dev server running without errors
- [ ] Can access Admin Dashboard → SMS Notifications
- [ ] Can search and select agents
- [ ] Can expand agents and see phone number options
- [ ] Can edit formatted phone numbers
- [ ] Can type message within 160 character limit
- [ ] Can enter campaign name
- [ ] Can send SMS to single agent
- [ ] Can send SMS to multiple agents
- [ ] Can send SMS to all agents with filters
- [ ] SMS appears in History & Tracking tab
- [ ] SMS logs appear in Supabase database
- [ ] Status shows "success" or "failed"

## Performance Notes

- SMS sending is queued with 100ms delay between requests to avoid rate limiting
- For 100+ agents, sending may take a few minutes
- Each SMS is logged to the database immediately after sending
- History viewer loads up to 100 most recent SMS by default
- History can be filtered by date range, agent, status, and campaign

## Support

If you encounter issues:

1. Check the browser console for errors (F12 → Console tab)
2. Check the server logs in the terminal where `pnpm dev` is running
3. Verify all environment variables are set correctly
4. Ensure Supabase `sms_logs` table exists
5. Check USMS-GH account balance and API token validity

## Next Steps

Once testing is complete and working:

1. Deploy to production on Vercel
2. Add production SMS API credentials to Vercel env vars
3. Ensure production Supabase has the `sms_logs` table
4. Monitor SMS sending and costs on USMS-GH dashboard
