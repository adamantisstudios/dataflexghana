# Complete Registration & Payment Flow

## Overview
This document outlines the complete registration and payment flow for new agents.

---

## Manual Payment Flow

### Step 1: Payment Page
- User selects "Manual" payment method
- NO email required
- Clicks "Continue with Manual Payment"

### Step 2: Payment Code Dialog (Mobile-Optimized)
- Shows payment amount: ₵47
- Displays reference code to use
- Shows Mobile Money details:
  - Phone: +233 557 943 392
  - Receiver: Adamantis Solutions
- Simple step-by-step instructions
- Compact design for mobile phones

### Step 3: Send WhatsApp to Admin
- User clicks "✓ Sent"
- WhatsApp opens with pre-filled message to admin
- Message includes payment details and request to register user
- Dialog closes after WhatsApp opens

### Step 4: Redirect to Login
- User is redirected to `/agent/login`
- Admin will register the user via admin dashboard
- User can login once admin completes registration

---

## Paystack Payment Flow

### Step 1: Payment Page
- User selects "Paystack" payment method
- Email is REQUIRED for Paystack
- Clicks "Continue with Paystack"

### Step 2: Paystack Payment Portal
- Redirected to Paystack payment page
- User completes payment
- Amount: ₵50

### Step 3: Redirect to Registration Form
- After successful payment, user is redirected to `/agent/register`
- User must fill in registration details:
  - Full Name
  - Phone Number
  - Region/Location
  - Password
- NO email field (already provided)

### Step 4: Submit Registration & Redirect to Login
- After form submission, user is redirected to `/agent/login`
- User can immediately login with their credentials
- Account is active and ready to use

---

## Key Differences

| Aspect | Manual | Paystack |
|--------|--------|----------|
| Email Required | No | Yes |
| Amount | ₵47 | ₵50 |
| Registration | Admin does it | User does it |
| After Payment | → Login | → Register Form |
| After Registration | Login directly | Login directly |

---

## localStorage Keys Used

- `payment_verified`: "true" if payment completed
- `payment_reference`: Payment reference code
- `payment_method`: "manual" or "paystack"
- `paystack_email`: Email for Paystack payments
- `paystack_name`: Agent name for Paystack

---

## API Endpoints

### Paystack Initialize
- **Endpoint**: `/api/paystack/register/initialize`
- **Method**: POST
- **Body**: `{ agent_name, amount, email }`
- **Returns**: `{ authorization_url, access_code, reference }`

### Paystack Verify
- **Endpoint**: `/api/paystack/register/verify`
- **Method**: POST
- **Body**: `{ reference }`
- **Returns**: `{ success, message, data }`
