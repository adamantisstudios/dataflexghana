# Agent Registration Payment Flow

## Overview
The agent registration now requires a mandatory Paystack payment of ₵50 to complete the registration process. This builds trust with new agents and ensures commitment.

## Flow Diagram

```
1. User fills registration form
   ↓
2. Registration created successfully
   ↓
3. Redirected to /agent/registration-payment?agentId={id}&name={name}
   ↓
4. User clicks "Complete Payment"
   ↓
5. Paystack payment page opens
   ↓
6. User completes payment
   ↓
7. Paystack redirects back with ?reference={ref}
   ↓
8. Payment verified via /api/paystack/register/verify
   ↓
9. Redirected to /agent/registration-complete
   ↓
10. WhatsApp confirmation sent automatically
    ↓
11. User can access dashboard or request admin support
```

## Pages

### 1. `/app/agent/register/page.tsx`
- Existing registration form
- After successful registration, redirects to `/agent/registration-payment`
- Passes `agentId` and `name` as query parameters

### 2. `/app/agent/registration-payment/page.tsx`
- Displays payment details (₵50 registration fee)
- Shows what's included with registration
- Has a "Complete Payment with Paystack" button
- Handles Paystack callback and payment verification
- Shows loading state while verifying

### 3. `/app/agent/registration-complete/page.tsx`
- Confirmation page shown after successful payment
- Automatically opens WhatsApp with confirmation message
- Shows agent benefits and next steps
- Button to go to agent dashboard

## API Endpoints

### 1. `/api/paystack/register/initialize` (POST)
- Initializes Paystack payment
- **Request Body:**
  ```json
  {
    "agent_id": "uuid",
    "agent_name": "Agent Name",
    "amount": 5000,  // in pesewas (₵50 = 5000 pesewas)
    "email": "agent-{id}@dataflexghana.com"
  }
  ```
- **Response:**
  ```json
  {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "..."
  }
  ```

### 2. `/api/paystack/register/verify` (POST)
- Verifies payment with Paystack
- **Request Body:**
  ```json
  {
    "reference": "paystack_reference_code",
    "agent_id": "uuid"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "data": {
      "reference": "...",
      "amount": 5000,
      "agent_id": "..."
    }
  }
  ```

## Environment Variables Required

Add these to your `.env.local`:

```
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Update with your production URL
```

**Getting Your Paystack Keys:**
1. Log in to your Paystack dashboard
2. Go to Settings → API Keys & Webhooks
3. Copy your live secret and public keys
4. Add them to your environment variables

## WhatsApp Confirmation Message

After successful payment, the user is automatically redirected to WhatsApp with this message:

```
✅ *REGISTRATION PAYMENT SUCCESSFUL*

Hello {Agent Name},

Your agent registration payment of ₵50 has been successfully processed!

*Account Details:*
Agent ID: {agent_id}
Status: ✅ Active & Verified
Date: {today's date}

*You can now:*
• Access your agent dashboard
• View available opportunities
• Start earning immediately
• Publish and manage products
• Track your earnings in real-time

*Next Steps:*
1. Log in to your account
2. Complete your profile setup
3. Explore earning opportunities
4. Start building your income

Welcome to the Dataflex Ghana family! 🎉

If you have any questions, feel free to reach out.

Best regards,
Dataflex Ghana Admin Team
```

## Key Features

✅ **Mandatory Payment**: Registration is incomplete without payment
✅ **Secure**: All payments processed through Paystack (Ghana's #1 payment gateway)
✅ **No Database Changes**: Existing schema unchanged, payment is verification-only
✅ **Automatic Confirmation**: WhatsApp message sent automatically after payment
✅ **Error Handling**: Clear error messages if payment fails
✅ **Retry Support**: Users can retry payment if it fails

## Testing

To test this flow:

1. Go to `/agent/register`
2. Fill out and submit the registration form
3. You'll be redirected to the payment page
4. Click "Complete Payment with Paystack"
5. Use Paystack test credentials:
   - Test card: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3 digits
6. Complete payment
7. You'll be redirected to confirmation page
8. WhatsApp will open with confirmation message

## Troubleshooting

**Issue**: Payment page shows "Agent ID not found"
- **Solution**: Make sure the registration form successfully created an agent before redirecting

**Issue**: Paystack doesn't initialize
- **Solution**: Check that `PAYSTACK_SECRET_KEY` is correctly set in environment variables

**Issue**: Payment verified but page doesn't redirect
- **Solution**: Check browser console for errors, ensure `NEXT_PUBLIC_APP_URL` is set correctly

**Issue**: WhatsApp doesn't open
- **Solution**: WhatsApp Web must be available in the user's browser, or WhatsApp desktop app installed
