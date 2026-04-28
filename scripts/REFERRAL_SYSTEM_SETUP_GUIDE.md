# Complete Referral System Setup Guide

## Overview
This guide explains the complete referral system that allows agents to earn commissions by referring new agents to the platform.

## Database Tables

### 1. **referral_links** - Agent Referral Programs
Tracks each agent's referral program and performance metrics.

\`\`\`
- id: UUID (primary key)
- agent_id: UUID (references agents.id)
- agent_name: VARCHAR(255)
- referral_code: VARCHAR(100) UNIQUE
- referral_url: TEXT
- total_clicks: INTEGER (auto-incremented)
- total_referrals: INTEGER (auto-incremented)
- total_earnings: DECIMAL(10,2)
- status: VARCHAR(50) - 'active', 'inactive', 'suspended'
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
\`\`\`

### 2. **referral_tracking** - Click & Conversion Tracking
Tracks every click on a referral link and if it converted to a registration.

\`\`\`
- id: UUID (primary key)
- referral_link_id: UUID (references referral_links.id)
- referral_code: VARCHAR(100)
- clicked_at: TIMESTAMP
- visitor_ip: VARCHAR(45)
- visitor_agent: TEXT
- converted: BOOLEAN (default: false)
- converted_at: TIMESTAMP
- new_agent_id: UUID (references agents.id)
\`\`\`

### 3. **referral_credits** - Commission Tracking
Tracks earned commissions from referrals.

\`\`\`
- id: UUID (primary key)
- referring_agent_id: UUID (references agents.id)
- referred_agent_id: UUID (references agents.id)
- credit_amount: DECIMAL(10,2) (default: 15.00 GHS)
- status: VARCHAR(50) - 'pending', 'confirmed', 'credited', 'paid_out'
- created_at: TIMESTAMP
- confirmed_at: TIMESTAMP
- credited_at: TIMESTAMP
- paid_out_at: TIMESTAMP
- notes: TEXT
\`\`\`

### 4. **agents** - Enhanced Fields
\`\`\`
- referral_code: VARCHAR(50) - code the agent used when registering
- referral_credit_earned: DECIMAL(10,2) - total earned from referrals
- agent_name: VARCHAR(255) - display name for referral program
\`\`\`

## API Endpoints

### 1. Generate Referral Link
**POST** `/api/agent/referral/generate-link`

Request:
\`\`\`json
{
  "agent_id": "uuid",
  "agent_name": "Agent Full Name"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "agent_id": "uuid",
    "referral_code": "REF1234ABCD",
    "referral_url": "https://dataflexghana.com/agent/register?ref=REF1234ABCD",
    "status": "active"
  },
  "isNew": true
}
\`\`\`

### 2. Get Referral Stats
**GET** `/api/agent/referral/stats?agent_id=uuid`

Response:
\`\`\`json
{
  "success": true,
  "stats": {
    "totalClicks": 45,
    "totalReferrals": 12,
    "confirmedReferrals": 10,
    "completedReferrals": 8,
    "totalEarnings": 120.00,
    "conversionRate": "66.7"
  },
  "recentReferrals": [
    {
      "id": "uuid",
      "full_name": "New Agent Name",
      "phone_number": "0551234567",
      "status": "pending",
      "credit_amount": 15.00
    }
  ]
}
\`\`\`

### 3. Track Referral Click
**POST** `/api/agent/referral/track-click`

Request:
\`\`\`json
{
  "referral_code": "REF1234ABCD"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "referral_link_id": "uuid",
    "referral_code": "REF1234ABCD",
    "clicked_at": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

### 4. Confirm Referral
**POST** `/api/agent/referral/confirm`

Request:
\`\`\`json
{
  "referring_agent_id": "uuid",
  "referred_agent_id": "uuid",
  "credit_amount": 15.00
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "referring_agent_id": "uuid",
    "referred_agent_id": "uuid",
    "credit_amount": 15.00,
    "status": "confirmed"
  }
}
\`\`\`

## Flow Diagram

\`\`\`
Agent Dashboard
    |
    v
[Generate Referral Link] -> Creates referral_links entry + unique code
    |
    v
Share referral_url with friends
    |
    v
Friend clicks link -> Creates referral_tracking entry + increments total_clicks
    |
    v
Friend registers with ?ref=CODE parameter
    |
    v
New agent created + referral_credits entry (status: pending)
    |
    v
Friend completes registration & payment
    |
    v
referral_credits status -> confirmed -> credited -> paid_out
    |
    v
Agent receives ₵15 commission
\`\`\`

## Referral Status States

1. **pending** - Referral created but not confirmed (new registration)
2. **confirmed** - Registration confirmed but not yet paid out
3. **credited** - Commission credited to agent account
4. **paid_out** - Commission has been paid to agent

## Key Features

✓ Automatic link generation with unique codes
✓ Click tracking and conversion metrics
✓ Real-time earnings calculation
✓ Commission status tracking (pending → confirmed → credited → paid)
✓ Recent referral activity display
✓ Performance dashboard with stats
✓ Share buttons (WhatsApp, Facebook, Email, Copy)

## Implementation Steps

1. **Run Database Migration**
   - Execute `033_complete_referral_system_final.sql`
   - Execute `034_add_referral_tracking_final.sql`
   - Verify all tables exist

2. **Update Agent Register**
   - Capture referral_code from URL parameter
   - Store in agents table
   - Create referral_credits entry if code is valid

3. **Enable Referral Dashboard**
   - Agent navigates to dashboard → Referral Program tab
   - Click "Generate Referral Link" button
   - Share unique link with referral_code

4. **Monitor Referrals**
   - View stats: total clicks, conversions, earnings
   - See recent referral activity
   - Track pending and confirmed referrals

## Error Handling

### "relation 'referral_links' does not exist"
- Run migration script `033_complete_referral_system_final.sql`
- Verify table creation in Supabase dashboard

### "Failed to check existing referral link"
- Check API logs for database errors
- Verify agent_id format is correct UUID
- Ensure referral_links table has proper RLS disabled

### "Failed to generate referral link"
- Verify agent_name is provided
- Check for unique constraint violations
- Check available storage quota

## Testing Checklist

- [ ] Run migration scripts without errors
- [ ] Generate referral link from ReferralDashboard
- [ ] Copy link and verify it contains ?ref=CODE
- [ ] Register with referral code
- [ ] Verify referral_credits entry created
- [ ] Verify referral_tracking marked as converted
- [ ] Check stats updated correctly
- [ ] Verify admin can see referral activity

## Performance Notes

- All tables have proper indexes for fast lookups
- Views available for reporting: `agent_referral_stats`, `recent_referral_activity`
- Automatic triggers update stats on insert/update
- Queries optimized to avoid N+1 problems

## Troubleshooting

### Stats not showing
1. Check agent_id is correct UUID
2. Verify referral_links record exists for agent
3. Check referral_credits table has records
4. Review browser console for API errors

### Referral link not working
1. Verify referral_code is in URL
2. Check referral_links table has that code
3. Ensure ?ref=CODE is in registration URL
4. Check registration page captures referral_code

### Commissions not paid
1. Verify referral_credits status flow
2. Check if referred agent completed payment
3. Review payment_reminder flow completion
4. Check withdrawal system for payment processing
