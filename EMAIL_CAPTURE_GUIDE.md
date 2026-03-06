# Email Capture Integration Guide

## Overview
The payment page now captures agents' actual email addresses during registration payment. These emails are stored in the Supabase `agents` table and used to send Paystack payment confirmations.

## What Changed

### 1. Payment Page (/app/agent/registration-payment/page.tsx)
- Added email input field on payment page
- Email validation with regex pattern
- Real-time error messages for invalid emails
- Email stored in agents table before payment initialization
- Email passed to Paystack API instead of generated `agent-{id}@dataflexghana.com`

### 2. Database Integration
- Emails now stored in `agents.email` column
- Captured during payment initialization
- Used for Paystack payment receipts
- Available for future communication/marketing

### 3. Paystack Integration
- Actual agent email sent to Paystack
- Payment confirmation receipt goes to agent's real email
- Verifiable by agent in their email inbox

## User Experience Flow

```
Agent on Payment Page
        ↓
Sees "Your Email Address" input field
        ↓
Enters their actual email (e.g., john@gmail.com)
        ↓
Clicks "Pay ₵47 via Paystack"
        ↓
Email validated (checks for valid format)
        ↓
Email stored in Supabase agents table
        ↓
Paystack initialized with real email
        ↓
Agent redirected to Paystack payment gateway
        ↓
Payment processed
        ↓
Paystack sends confirmation to agent's ACTUAL email
        ↓
Admin receives WhatsApp notification with agent details
```

## Key Features

✓ **Email Validation** - Ensures valid email format before payment
✓ **Database Storage** - Emails permanently stored for future use
✓ **Paystack Integration** - Real email used for payment receipts
✓ **Error Handling** - Clear error messages if email is invalid
✓ **Graceful Fallback** - Payment continues even if email storage fails (logged as warning)

## Technical Details

### Email Input Validation
```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

### Database Update
```typescript
const { error: updateError } = await supabase
  .from("agents")
  .update({ email: agentEmail })
  .eq("id", agentId)
```

### Paystack Initialization
```javascript
// Before: email: `agent-${agentId}@dataflexghana.com`
// After: email: agentEmail (user-provided)
body: JSON.stringify({
  agent_id: agentId,
  agent_name: agentName,
  amount: REGISTRATION_FEE * 100,
  email: agentEmail, // ACTUAL agent email
})
```

## Email Field Behavior

- **Required**: Yes (button disabled until email entered)
- **Validation**: Real-time error messages
- **Placeholder**: "your.email@gmail.com"
- **Format**: standard@email.com
- **Field Type**: email input
- **Styling**: Blue info box with helper text

## Database Column

```sql
-- agents table
email VARCHAR(255) -- Stores agent's actual email address
```

## Testing Checklist

- [ ] Email input field appears on payment page
- [ ] Placeholder text shows "your.email@gmail.com"
- [ ] Invalid email shows error: "Please enter a valid email address"
- [ ] Empty email shows error: "Please enter your email address"
- [ ] Pay button disabled until valid email entered
- [ ] Pay button enabled with valid email
- [ ] Email stored in agents table after payment
- [ ] Paystack receives correct email
- [ ] Payment confirmation sent to agent's email address
- [ ] Admin still receives WhatsApp notification

## Email Use Cases

1. **Payment Confirmation** - Paystack sends receipt to agent email
2. **Account Recovery** - Can use email for password reset (future feature)
3. **Marketing Communications** - Send updates, promotions, earnings reports
4. **Support Tickets** - Reference email for support inquiries
5. **Verification** - Two-factor authentication via email (future feature)

## Future Enhancements

- Auto-fill agent email from registration page (if captured there)
- Email verification before allowing dashboard access
- Password reset via email
- Email templates for different notifications
- Email frequency preferences
- Bulk communication to agents via email

## Troubleshooting

### Email Not Being Saved
**Issue**: Email shows valid but doesn't save to database
**Solution**: Check Supabase connection and ensure service role key is set

### Wrong Email in Paystack
**Issue**: Agent received confirmation on wrong email
**Solution**: Email was likely updated after payment - check agents table for current email

### Email Validation Too Strict
**Issue**: Valid email rejected
**Solution**: Current regex requires format: user@domain.extension - works for most cases

## Files Modified

1. `/app/agent/registration-payment/page.tsx`
   - Added email state management
   - Added email validation function
   - Added email input field to UI
   - Updated payment initialization to use real email
   - Added email storage to Supabase before payment
