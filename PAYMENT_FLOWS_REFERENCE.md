# Payment Flows - Quick Reference Guide

## 1. AGENT REGISTRATION WITH PAYSTACK ✅

```
START: /agent/registration-payment
  ↓
USER ENTERS:
  - Email address
  - Selects "Paystack" payment method
  - Clicks "Continue"
  ↓
PAYSTACK INITIALIZATION:
  - API: POST /api/paystack/register/initialize
  - Sends: agent_id, agent_name, amount (6000 pesewas = ₵60)
  - Response: authorization_url
  ↓
PAYSTACK PAYMENT PAGE (External):
  - User is redirected to Paystack
  - User enters card details and pays ₵60
  ↓
PAYSTACK CALLBACK:
  - Paystack redirects to: /agent/registration-payment?reference=XXX
  ↓
VERIFICATION:
  - useEffect detects "reference" param
  - Calls verifyPaystackPayment(reference)
  - API: POST /api/paystack/register/verify
  - Verifies with Paystack and checks agent_id match
  ↓
SUCCESS REDIRECT:
  - router.push('/agent/payment-success?agentName=...&agentId=...&email=...&reference=...')
  ↓
PAYMENT SUCCESS PAGE:
  - Shows: "Payment Successful!"
  - Amount: ₵60.00
  - Status: "Payment Verified"
  - Button: "Contact Admin for Activation"
  ↓
USER CLICKS "CONTACT ADMIN":
  - WhatsApp opens with pre-filled message
  - Message includes:
    * Agent Name
    * Agent ID
    * Amount: ₵60.00 (FIXED)
    * Payment Reference
    * Email
    * Status: "Payment Verified"
  ↓
ADMIN RECEIVES MESSAGE:
  - Reviews agent details
  - Activates account
  - Agent can now use dashboard
  ↓
END: Account Active
```

**Key Points:**
- Amount sent to Paystack: 6000 pesewas (₵60)
- WhatsApp message shows: ₵60.00
- Account not immediately active - awaits admin approval
- User can see payment-success page without dashboard access

---

## 2. AGENT REGISTRATION WITH MANUAL PAYMENT ✅

```
START: /agent/registration-payment
  ↓
USER ENTERS:
  - Email address
  - Selects "Manual Payment" payment method
  - Clicks "Continue"
  ↓
MANUAL PAYMENT DIALOG:
  - Modal shows generated reference code
  - Shows payment account details:
    * Name: Adamantis Solutions (Francis Ani-Johnson .K)
    * Account: 0557943392
  ↓
USER CLICKS "I'VE COMPLETED PAYMENT":
  - WhatsApp opens with pre-filled message
  - Message includes:
    * Agent Name
    * Agent ID
    * Email
    * Reference code
    * Amount: ₵46.00 (FIXED)
    * Date/timestamp
  ↓
AUTOMATIC REDIRECT (after 1.5 seconds):
  - router.push('/agent/registration-complete?agentName=...&agentId=...')
  ↓
REGISTRATION COMPLETE PAGE:
  - Shows: "Payment Received!"
  - Amount: ₵46.00
  - Status: "⏳ Pending Admin Approval"
  - Button: "Send Confirmation on WhatsApp"
  ↓
USER CLICKS "SEND CONFIRMATION":
  - WhatsApp opens again with message to admin
  - Message requests account activation
  - Includes: Agent name, ID, email, reference, ₵46.00 amount
  ↓
ADMIN RECEIVES MESSAGE:
  - Verifies manual payment was received
  - Checks bank account for ₵46 transfer
  - Activates account
  - Notifies agent via WhatsApp
  ↓
END: Account Active
```

**Key Points:**
- Amount: ₵46.00 (NOT ₵47)
- User goes through 2 WhatsApp contacts (payment confirmation + activation request)
- Automatic redirect ensures user reaches completion page
- Clear pending approval status prevents confusion

---

## 3. NO-REGISTRATION DATA BUNDLE WITH PAYSTACK ✅

```
START: /no-registration
  ↓
USER SELECTS:
  - A data bundle service (e.g., "ECG TopUp", "MTN Data", etc.)
  - Clicks on service card/button
  ↓
PAYMENT MODAL:
  - Shows order summary
  - Service, amount, total
  - Radio buttons: "Paystack" or "Manual Payment"
  ↓
USER SELECTS PAYSTACK:
  - Clicks "Paystack" option
  - Clicks action button
  ↓
PAYSTACK INITIALIZATION:
  - API: POST /api/paystack/initialize
  - Sends: email, amount (in pesewas), phone, reference, service
  - Response: authorizationUrl
  - window.location.href = authorizationUrl
  ↓
PAYSTACK PAYMENT PAGE (External):
  - User enters card details
  - User pays the amount (varies by service)
  ↓
PAYSTACK CALLBACK:
  - Paystack redirects to: /api/paystack/callback?reference=XXX
  ↓
CALLBACK PROCESSING:
  - Verifies payment with Paystack
  - Validates status = "success"
  - Stores payment in database (paystack_payments table)
  - Creates WhatsApp message with order details
  - IMPORTANT: Generates WhatsApp URL but DOES NOT redirect to it yet
  ↓
SMART REDIRECT:
  - Instead of direct WhatsApp redirect:
  - Redirects to: /no-registration?payment=success&whatsapp_url=...&service=...&phone=...&reference=...&amount=...
  ↓
NO-REGISTRATION PAGE LOADS:
  - useEffect detects payment=success param
  - useEffect detects whatsapp_url param
  - After 500ms delay:
    * window.open(whatsappUrl, "_blank")
    * Opens WhatsApp in NEW TAB/WINDOW
  ↓
USER EXPERIENCE:
  - Still on /no-registration page
  - WhatsApp opens in background/new window
  - Can see WhatsApp message with order details:
    * Service name
    * Phone number
    * Payment reference
    * Amount paid
    * Order timestamp
    * Closing time note (9:30 PM)
    * Terms & conditions link
    * Processing time: 10-30 minutes
  ↓
USER OPTIONS:
  - Option 1: Close WhatsApp, stay on page, browse more services
  - Option 2: Send WhatsApp message to admin
  - Option 3: Wait for order processing
  ↓
ADMIN RECEIVES MESSAGE:
  - Processes the data bundle order
  - Verifies payment in database
  - Delivers service (10-30 min processing time)
  ↓
END: Service Delivered
```

**Key Points:**
- User is NOT stuck in WhatsApp
- User remains on /no-registration page
- WhatsApp opens in new window (non-blocking)
- User can continue browsing services while waiting
- Admin connection is maintained via WhatsApp
- Payment is verified in database before delivery

---

## 4. NO-REGISTRATION DATA BUNDLE WITH MANUAL PAYMENT ✅

```
START: /no-registration
  ↓
USER SELECTS:
  - A data bundle service
  - Clicks on service card/button
  ↓
PAYMENT MODAL:
  - Shows order summary
  - Service, amount, total
  - Radio buttons: "Paystack" or "Manual Payment"
  ↓
USER SELECTS MANUAL PAYMENT:
  - Clicks "Manual Payment" option
  - Generated reference code shown
  - Payment account details shown:
    * Name: Adamantis Solutions (Francis Ani-Johnson .K)
    * Account: 0557943392
  ↓
USER CLICKS "PAYMENT COMPLETED":
  - onPaymentCompleted callback triggered
  - WhatsApp opens with pre-filled message
  - Message includes:
    * Service name
    * Phone number
    * Reference code
    * Amount to pay
    * Payment details (account info)
  ↓
USER SENDS MESSAGE:
  - Sends order details to admin via WhatsApp
  - Admin receives order information
  ↓
USER CLOSES WHATSAPP:
  - User remains on /no-registration page
  - Can close WhatsApp and continue browsing
  - Can return to WhatsApp manually if needed
  ↓
ADMIN RECEIVES MESSAGE:
  - Verifies payment reference
  - Waits for manual payment (MoMo/Bank transfer)
  - Verifies payment received (balance check)
  - Processes order
  ↓
END: Service Delivered
```

**Key Points:**
- User controls WhatsApp opening
- User can remain on page after sending message
- No automatic redirect needed
- Manual payment relies on admin verification

---

## PRICING CONFIRMATION

### Agent Registration
- **Paystack**: ₵60.00 (6000 pesewas)
- **Manual**: ₵46.00

### Data Bundles
- **Price varies by service**
- Paystack: Exact amount transferred
- Manual: Amount shown in reference + bank details

### Other Services
- **ECG TopUp**: Amount + ₵8 service charge
- **Others**: Service-specific pricing

---

## COMMON ISSUES & SOLUTIONS

### Issue: Paystack Payment Not Redirecting to Success Page
**Solution**: Check that agentId is being passed correctly in URL params
**Debug**: Look for console logs: "[v0] Checking for Paystack callback"

### Issue: WhatsApp Message Shows Wrong Amount
**Solution**: Ensure constants are used (REGISTRATION_FEE_PAYSTACK, REGISTRATION_FEE_MANUAL)
**Files**: Check payment-success.tsx and registration-complete.tsx

### Issue: User Stuck in WhatsApp After Data Bundle Payment
**Solution**: This is FIXED - callback now redirects to /no-registration with WhatsApp URL param
**Files**: /app/api/paystack/callback/route.ts and /app/no-registration/page.tsx

### Issue: Manual Payment Not Redirecting to Completion Page
**Solution**: Router redirect added with 1.5s timeout
**Files**: /app/agent/registration-payment/page.tsx (handleManualComplete)

---

## VERIFICATION CHECKLIST FOR QA

### Before Going Live:
1. ✅ Agent Paystack: Amount shows ₵60
2. ✅ Agent Manual: Amount shows ₵46
3. ✅ Agent Paystack: Redirects to payment-success
4. ✅ Agent Manual: Redirects to registration-complete
5. ✅ Data Bundle Paystack: User stays on page
6. ✅ Data Bundle Paystack: WhatsApp opens in new window
7. ✅ All WhatsApp messages include correct amounts
8. ✅ All payment references are unique
9. ✅ Database storing payments correctly
10. ✅ Admin can see all order details in WhatsApp

