# Registration & Payment Flow - Fixed

## Flow Overview

The registration flow now correctly requires payment BEFORE users can access the registration form.

### Step-by-Step Flow

#### 1. **User Registers (Create Agent Record)**
   - User navigates to `/agent/register`
   - User fills out registration form with:
     - Full name
     - Phone number
     - Payment line (MoMo number)
     - Region
     - Password
   - Form is submitted and agent record is created in database
   - User is redirected to `/agent/registration-payment?agentId=XXX&name=User+Name`

#### 2. **Payment Page - Choose Method**
   - User lands on payment page with their agentId
   - **Email is ONLY required for Paystack** - not for manual payment
   - User chooses payment method:
     - **Manual Payment**: ₵47 (No email required)
     - **Paystack**: ₵50 (Email REQUIRED)

#### 3a. **Manual Payment Path**
   - User clicks "Continue with Manual Payment"
   - Dialog shows:
     - Reference code
     - Admin phone number
     - Step-by-step instructions
     - Amount to pay: ₵47
   - User clicks "Completed payment"
   - **WhatsApp message opens** with admin containing:
     ```
     Agent Name: [name]
     Agent ID: [id]
     Reference Code: [code]
     Amount Paid: ₵47
     ACTION REQUIRED: Register agent and credit ₵5 wallet credit
     ```
   - Payment marked as ready
   - User redirected back to `/agent/register?agentName=X&agentId=Y`
   - User completes registration form with full details

#### 3b. **Paystack Payment Path**
   - User must enter valid email (required for Paystack)
   - Clicks "Continue with Paystack"
   - Redirected to Paystack payment page
   - After payment, webhook confirms and marks payment as verified

#### 4. **Registration Form Access**
   - Payment verification check runs on `/agent/register`
   - If payment NOT verified: User sees error message, redirected to payment page
   - If payment verified: Registration form displays
   - User completes form (name, phone, region, password)
   - Account created and awaits admin approval

#### 5. **Admin Dashboard**
   - Admin sees pending registration with:
     - Manual payment reference code (for manual payments)
     - WhatsApp notification (for manual payments)
     - Agent details
   - Admin approves and credits ₵5 wallet credit
   - User account becomes active

## Key Changes Made

### 1. **Payment Email Requirement**
- ✅ Email is ONLY shown/required for Paystack
- ✅ Manual payment does NOT ask for email
- ✅ Removes confusion about email requirements

### 2. **WhatsApp Admin Message**
- ✅ Clear agent details
- ✅ Payment information (amount, method, date)
- ✅ **Clear action request**: Register agent and credit wallet
- ✅ Reference code for tracking
- ✅ Priority indication (30 minutes)

### 3. **Payment Verification**
- ✅ Payment MUST be verified before registration form is accessible
- ✅ Blocks unverified users from accessing form
- ✅ Shows clear "Payment Required" message if not verified

### 4. **Manual Payment Flow**
- ✅ No email required
- ✅ Clear instructions in dialog
- ✅ Admin gets WhatsApp with all details
- ✅ Admin can process registration immediately

### 5. **Paystack Integration**
- ✅ Email only required for Paystack
- ✅ Standard payment flow unchanged

## Files Modified

1. **`/app/agent/register/page.tsx`**
   - Restored payment verification check
   - Restored blocked UI message
   - Users cannot access registration form without payment

2. **`/app/agent/registration-payment/page.tsx`**
   - Email input now only shows for Paystack
   - Button validation only requires email for Paystack
   - Removed email from manual payment flow
   - Enhanced WhatsApp message with:
     - Full agent details
     - Payment information
     - Clear action items for admin
     - Professional formatting

## Testing the Flow

### Test Manual Payment
1. Go to `/agent/register`
2. Fill form completely
3. Submit → redirected to payment page
4. Select "Manual Payment"
5. NO email field appears
6. Click "Continue with Manual Payment"
7. Dialog shows reference code
8. Click "Completed payment"
9. WhatsApp opens with detailed message
10. User redirected to `/agent/register?agentName=X&agentId=Y`
11. User must wait for admin to verify payment in WhatsApp
12. Only then can complete registration form

### Test Paystack
1. Go to `/agent/register`
2. Fill form completely
3. Submit → redirected to payment page
4. Select "Paystack"
5. Email field APPEARS and is REQUIRED
6. Enter email
7. Click "Continue with Paystack"
8. Redirected to Paystack payment

## Notes

- Manual payment reference code is generated uniquely for each payment attempt
- Payment verification expires after 24 hours
- Admin MUST process WhatsApp message and register agent for user to complete their registration
- Each payment method has different amounts due to processing fees
