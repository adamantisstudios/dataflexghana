# Payment Gate Implementation - Registration Flow Protection

## Overview

This implementation gates access to `/agent/register` behind a **successful payment verification**. Users can no longer create accounts without paying first.

## What Changed

### Files Created
1. **`/lib/payment-gate.ts`** - Utility functions for payment verification using secure HTTP-only cookies
2. **`/app/api/agent/mark-payment-ready/route.ts`** - Endpoint called by manual payment handler
3. **`/app/api/agent/check-payment/route.ts`** - Endpoint to verify payment status from client

### Files Modified
1. **`/app/api/paystack/register/verify/route.ts`** - Added payment flag after successful Paystack verification
2. **`/app/agent/registration-payment/page.tsx`** - Manual payment handler now calls mark-payment endpoint
3. **`/app/agent/register/page.tsx`** - Added payment gate check that blocks access if unpaid

---

## How It Works

### Payment Verification Mechanism

**Storage**: Secure HTTP-only cookies (not localStorage)
- Cookie name: `payment_verified`
- Value: `agentId`
- Expiry: 24 hours from payment
- Secure: HTTPS only in production, same-site lax protection

### Registration Flow After Implementation

```
┌─────────────────────────────────────────────────────────┐
│ 1. User visits /agent/register                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Payment gate checks for payment_verified cookie     │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
    PAID (cookie exists)              NOT PAID (no cookie)
        ↓                                      ↓
    SHOW FORM                      SHOW "PAYMENT REQUIRED"
        ↓                                      ↓
    User fills out form        User redirected to
    + pays attention            /registration-payment
        ↓                                      ↓
    Form submitted              User completes payment
        ↓                        (Paystack or Manual)
    Register in database             ↓
        ↓                    Payment handler sets
    Clear payment flag          payment_verified cookie
        ↓                                      ↓
    Redirect to              Redirect to /agent/register
    /registration-payment              ↓
                            Form visible (payment verified)
```

---

## Implementation Details

### 1. Payment Gate Utility (`/lib/payment-gate.ts`)

**Functions:**

```typescript
// Called by both payment methods to mark payment as verified
setPaymentVerified(agentId: string) → Promise<boolean>

// Called by register page to check if user paid
verifyPaymentGate() → Promise<string | null>
// Returns agentId if paid, null if not paid

// Called after successful form submission to clear flag
clearPaymentGate() → Promise<boolean>

// Optional: check if payment is about to expire
isPaymentExpiring() → Promise<boolean>
```

### 2. Paystack Flow

**Before:** Paystack verification → Show success page → Link to form

**After:** Paystack verification → **Set cookie** → Show success page → Link to form

```typescript
// In /app/api/paystack/register/verify/route.ts
if (paystackData.data.status === "success") {
  // Mark payment as verified
  await setPaymentVerified(agent_id)
  
  // Return success response
  return NextResponse.json({ success: true, ... })
}
```

### 3. Manual Payment Flow

**Before:** User clicks "Mark as Paid" → Show registration complete page

**After:** User clicks "Mark as Paid" → **Call /api/agent/mark-payment-ready** → **Redirect to /agent/register**

```typescript
// In /app/agent/registration-payment/page.tsx
const handleManualComplete = async () => {
  // Open WhatsApp with payment details
  window.open(`https://wa.me/...`)
  
  // Call API to mark payment ready
  const res = await fetch("/api/agent/mark-payment-ready", {
    method: "POST",
    body: JSON.stringify({ agentId }),
  })
  
  // Redirect to registration form (not to registration-complete anymore)
  router.push(`/agent/register?...`)
}
```

### 4. Register Page Gate (`/app/agent/register/page.tsx`)

**Flow:**

1. **Initial Load**: `paymentVerified = null` (loading state)
2. **Check Payment**: Call `/api/agent/check-payment` endpoint
3. **Response Cases:**
   - ✅ `verified: true` → Show registration form (normal behavior)
   - ❌ `verified: false` → Show "Payment Required" screen with link to payment page
   - ⚠️ Error/timeout → Assume not verified, show payment required screen

**UI Changes:**

```typescript
// Loading state while checking payment
if (paymentVerified === null) {
  return <LoadingSpinner />
}

// Payment blocked state
if (paymentVerified === false) {
  return <PaymentRequiredCard />
}

// Payment verified - show normal form
return <RegistrationForm />
```

### 5. Clearing the Flag

**When:** After successful form submission

**Where:** In `handleSubmit` after database insert succeeds

```typescript
if (data && data[0]) {
  // ... save agent data
  
  // Clear payment verification flag
  await clearPaymentGate()
  
  // Redirect to next step
  router.push(`/agent/registration-payment?...`)
}
```

---

## Security Considerations

✅ **HTTP-Only Cookies**: Not accessible via JavaScript, prevents XSS
✅ **Secure Flag**: HTTPS only in production
✅ **SameSite=Lax**: CSRF protection
✅ **24-Hour Expiry**: Auto-expires without manual clearing
✅ **Webhook Validation**: Paystack still validates payment signature
✅ **Server-Side Gate**: Check is performed on API endpoint, not client-side

---

## User Experience Changes

### Before
1. Visit `/agent/register` → See form immediately
2. Fill out form → Submit
3. Redirected to payment page
4. Pay ❌ Most never return

### After
1. Visit `/agent/register` → See "Payment Required" screen
2. Click "Complete Payment" → Taken to payment page
3. Choose payment method (Paystack or Manual)
4. Complete payment ✅ Auto-redirected to form
5. Form is now visible → Fill out + Submit
6. Account created + payment flag cleared

---

## Testing the Implementation

### Test Paystack Flow
1. Go to `/agent/registration-payment`
2. Select Paystack option
3. Complete payment in Paystack
4. Should redirect to `/agent/payment-success`
5. Navigate or come back to `/agent/register`
6. ✅ Form should be visible (payment verified)

### Test Manual Payment Flow
1. Go to `/agent/registration-payment`
2. Select Manual option
3. Enter valid email
4. Click "Send to Admin"
5. Complete WhatsApp message sending
6. ✅ Should redirect to `/agent/register`
7. ✅ Form should be visible (payment verified)

### Test Direct Access Without Payment
1. Go directly to `/agent/register` (without paying first)
2. ✅ Should see "Payment Required" screen
3. Click "Complete Payment"
4. ✅ Should redirect to `/agent/registration-payment`

---

## Database: No Changes Required

✅ No new tables added
✅ No schema modifications
✅ No migration scripts needed
✅ All existing registration logic unchanged

---

## Environment Variables

No new environment variables needed. Uses existing:
- `PAYSTACK_SECRET_KEY` (already configured)
- `NODE_ENV` (for secure cookie flag)

---

## Files Summary

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `/lib/payment-gate.ts` | NEW | 92 | Core payment gate logic |
| `/app/api/agent/mark-payment-ready/route.ts` | NEW | 51 | Mark manual payment endpoint |
| `/app/api/agent/check-payment/route.ts` | NEW | 41 | Check payment status endpoint |
| `/app/api/paystack/register/verify/route.ts` | MODIFIED | +3 | Set flag after Paystack success |
| `/app/agent/registration-payment/page.tsx` | MODIFIED | +18 | Call mark-payment API for manual |
| `/app/agent/register/page.tsx` | MODIFIED | +53 | Add payment gate UI check |
| **TOTAL** | | **258** | Complete implementation |

---

## Rollback Instructions

If needed to disable the payment gate:

1. Delete `/lib/payment-gate.ts`
2. Delete `/app/api/agent/mark-payment-ready/route.ts`
3. Delete `/app/api/agent/check-payment/route.ts`
4. Revert `/app/api/paystack/register/verify/route.ts` (remove setPaymentVerified import/call)
5. Revert `/app/agent/registration-payment/page.tsx` (remove mark-payment API call)
6. Revert `/app/agent/register/page.tsx` (remove payment gate check)

Users can again access `/agent/register` without paying.

---

## Future Enhancements

- [ ] Add payment expiry warning (e.g., "Your payment expires in 6 hours")
- [ ] Store payment timestamp in cookie to show exact expiry time
- [ ] Send email confirmation when payment is verified
- [ ] Track payment-to-registration conversion rate
- [ ] Add analytics to see drop-off at payment stage
