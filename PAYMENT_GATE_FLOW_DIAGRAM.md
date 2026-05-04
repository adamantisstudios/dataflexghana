# Payment Gate Flow Diagrams

## Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           /agent/register (Client Component)            │  │
│  │  • Checks for payment_verified cookie (via API)        │  │
│  │  • Shows form if verified                              │  │
│  │  • Shows "Payment Required" if not verified             │  │
│  │  • Clears cookie after form submission                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        /agent/registration-payment (Client)             │  │
│  │  • Paystack option → Direct to Paystack                │  │
│  │  • Manual option → Generate code, open WhatsApp         │  │
│  │  • After payment: call /api/agent/mark-payment-ready   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/API Calls
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR NEXT.JS BACKEND                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ API Endpoints ──────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  1. GET /api/agent/check-payment                        │  │
│  │     └─ Verifies payment_verified cookie exists         │  │
│  │        Returns {verified: true/false}                  │  │
│  │                                                         │  │
│  │  2. POST /api/agent/mark-payment-ready                 │  │
│  │     └─ Called by manual payment handler                │  │
│  │        Sets payment_verified cookie (24hr expiry)      │  │
│  │                                                         │  │
│  │  3. POST /api/paystack/register/verify                 │  │
│  │     └─ Existing endpoint (MODIFIED)                    │  │
│  │        Now also calls setPaymentVerified()             │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Utilities ──────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  /lib/payment-gate.ts                                  │  │
│  │  ├─ setPaymentVerified(agentId)                        │  │
│  │  │  └─ Sets payment_verified cookie (HTTP-only, 24h)  │  │
│  │  ├─ verifyPaymentGate()                                │  │
│  │  │  └─ Returns agentId if cookie exists, null if not  │  │
│  │  └─ clearPaymentGate()                                 │  │
│  │     └─ Deletes payment_verified cookie                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Data Storage ───────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  HTTP-Only Cookies (Secure)                            │  │
│  │  ├─ Name: payment_verified                             │  │
│  │  ├─ Value: agentId (encrypted in browser)             │  │
│  │  ├─ Expiry: 24 hours from set time                    │  │
│  │  ├─ Secure: HTTPS only (production)                   │  │
│  │  └─ SameSite: Lax (CSRF protection)                   │  │
│  │                                                         │  │
│  │  Database (Supabase)                                   │  │
│  │  └─ NO NEW TABLES OR CHANGES                           │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  External Services (Existing, No Changes)                      │
│  ├─ Paystack API (payment verification)                        │
│  └─ Supabase (agent data storage)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Paystack Payment Flow (Automated)

```
User at /registration-payment
         │
         └─→ Selects "Paystack"
             │
             ├─→ Enters email
             │
             └─→ Clicks "Pay with Paystack"
                 │
                 POST /api/paystack/register/initialize
                 │
                 └─→ Creates Paystack transaction
                     │
                     └─→ Returns authorization_url
                         │
                         └─→ Redirects to Paystack checkout
                             │
                             ├─→ User fills payment details
                             │
                             └─→ Paystack processes payment
                                 │
                                 ├─→ ✅ SUCCESS
                                 │   │
                                 │   └─→ Paystack redirects with ?reference=xxx
                                 │       │
                                 │       └─→ /registration-payment catches reference
                                 │           │
                                 │           └─→ POST /api/paystack/register/verify
                                 │               │
                                 │               ├─→ Calls Paystack API to verify
                                 │               │
                                 │               └─→ ✅ PAYMENT CONFIRMED
                                 │                   │
                                 │                   ├─→ await setPaymentVerified(agent_id)
                                 │                   │   (Sets payment_verified cookie)
                                 │                   │
                                 │                   └─→ Returns {success: true}
                                 │                       │
                                 │                       └─→ Redirects to /payment-success
                                 │                           │
                                 │                           └─→ Shows "Payment Verified!"
                                 │                               │
                                 │                               └─→ Link to /agent/register
                                 │                                   │
                                 │                                   └─→ User clicks or visits
                                 │                                       │
                                 │                                       └─→ GET /api/agent/check-payment
                                 │                                           │
                                 │                                           └─→ ✅ payment_verified cookie found
                                 │                                               │
                                 │                                               └─→ Returns {verified: true}
                                 │                                                   │
                                 │                                                   └─→ FORM DISPLAYED ✅
                                 │
                                 └─→ ❌ FAILED
                                     │
                                     └─→ Paystack redirects without reference
                                         │
                                         └─→ Shows error to user
                                             │
                                             └─→ User can retry payment
```

---

## Manual Payment Flow (WhatsApp)

```
User at /registration-payment
         │
         └─→ Selects "Manual"
             │
             ├─→ Enters email
             │
             └─→ Clicks "Pay with Manual"
                 │
                 └─→ handleManualStart()
                     │
                     ├─→ Generates random code (e.g., 12345)
                     │
                     └─→ Shows manual payment dialog
                         │
                         ├─→ Shows transfer details
                         │
                         └─→ Shows reference code
                             │
                             └─→ User clicks "Send to Admin"
                                 │
                                 └─→ handleManualComplete()
                                     │
                                     ├─→ Opens WhatsApp link
                                     │   │
                                     │   └─→ window.open('https://wa.me/...')
                                     │       │
                                     │       └─→ Pre-filled message with:
                                     │           • Agent name
                                     │           • Agent ID
                                     │           • Email
                                     │           • Reference code
                                     │           • Amount (₵47)
                                     │           • Date
                                     │
                                     ├─→ POST /api/agent/mark-payment-ready
                                     │   │
                                     │   └─→ Backend receives {agentId}
                                     │       │
                                     │       └─→ await setPaymentVerified(agentId)
                                     │           (Sets payment_verified cookie)
                                     │           │
                                     │           └─→ Returns {success: true}
                                     │
                                     └─→ setTimeout(1.5s) then router.push('/agent/register')
                                         │
                                         └─→ User redirected to register form
                                             │
                                             └─→ GET /api/agent/check-payment
                                                 │
                                                 └─→ ✅ payment_verified cookie found
                                                     │
                                                     └─→ Returns {verified: true}
                                                         │
                                                         └─→ FORM DISPLAYED ✅
                                                             │
                                                             └─→ User fills out registration
                                                                 │
                                                                 └─→ Form submitted
                                                                     │
                                                                     ├─→ Data inserted to DB
                                                                     │
                                                                     └─→ await clearPaymentGate()
                                                                         (Deletes payment_verified cookie)
                                                                         │
                                                                         └─→ Redirects to /registration-payment
                                                                             │
                                                                             └─→ Shows "Account created!"
```

---

## Direct Access (No Payment) - Blocked

```
User directly visits /agent/register
         │
         └─→ useEffect triggers on page load
             │
             └─→ Calls GET /api/agent/check-payment
                 │
                 └─→ Backend checks for payment_verified cookie
                     │
                     └─→ ❌ Cookie NOT found
                         │
                         └─→ Returns {verified: false}
                             │
                             └─→ Client shows "Payment Required" screen
                                 │
                                 ├─→ Shows alert icon + message
                                 │
                                 ├─→ Shows "Complete Payment" button
                                 │
                                 └─→ User clicks button
                                     │
                                     └─→ router.push('/agent/registration-payment')
                                         │
                                         └─→ User must pay before seeing form
```

---

## Cookie Lifecycle

```
┌─────────────────────────────────────────────┐
│    Payment Successfully Completed          │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────↓──────────┐
         │  setPaymentVerified │
         │   (agentId: '123')  │
         └─────────┬──────────┘
                   │
         Set Cookie: payment_verified
         ├─ Name: payment_verified
         ├─ Value: 123 (encrypted)
         ├─ Expiry: Now + 24 hours
         ├─ HttpOnly: true (JS can't access)
         ├─ Secure: true (HTTPS only)
         ├─ SameSite: Lax
         └─ Path: /
                   │
              ┌────↓────┐
              │ Sent in  │ Cookie included in all requests
              │ Requests │ to the same domain for 24 hours
              └────┬────┘
                   │
        24 Hours Pass / Registration Complete
        (whichever comes first)
                   │
         ┌─────────↓─────────┐
         │ clearPaymentGate  │ OR Auto-Expiry
         │                   │
         └─────────┬─────────┘
                   │
         Delete Cookie: payment_verified
         (OR Browser auto-deletes after 24h)
                   │
              ┌────↓────┐
              │ Gone     │ User must pay again
              │ for good │ to register
              └──────────┘
```

---

## State Diagram: Register Page

```
           ┌──────────────────┐
           │   Component Load │
           └────────┬─────────┘
                    │
          paymentVerified = null
          (loading state)
                    │
        ┌───────────↓────────────┐
        │ useEffect: checkPayment │
        │                         │
        │ GET /api/check-payment  │
        └───────────┬────────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
    ✅ verified: true      ❌ verified: false
        │                       │
    paymentVerified = true   paymentVerified = false
        │                       │
        ├─→ RENDER FORM        └─→ RENDER "Payment Required"
        │                          │
        │                          └─→ User clicks button
        │                              │
        │                              └─→ router.push('/registration-payment')
        │
        ├─→ User fills form
        │
        ├─→ handleSubmit()
        │
        ├─→ await clearPaymentGate()
        │
        └─→ router.push('/registration-payment?agentId=...')
```

---

## Data Flow: Form Submission

```
User Submits Registration Form
         │
         └─→ handleSubmit(e)
             │
             ├─→ Validate form data
             │  • Check region selected
             │  • Check passwords match
             │  • Check terms accepted
             │
             └─→ Try:
                 │
                 ├─→ Check if phone already exists
                 │
                 ├─→ Hash password with bcrypt
                 │
                 ├─→ Insert to Supabase agents table
                 │   • full_name
                 │   • phone_number
                 │   • momo_number
                 │   • region
                 │   • password_hash
                 │   • referral_code (if exists)
                 │
                 ├─→ ✅ Insert successful
                 │   │
                 │   ├─→ localStorage.setItem('newRegistration')
                 │   │
                 │   ├─→ await clearPaymentGate()
                 │   │   (Delete payment_verified cookie)
                 │   │
                 │   └─→ router.push('/agent/registration-payment?agentId=...')
                 │
                 └─→ ❌ Insert failed
                     │
                     ├─→ Show error message
                     │
                     └─→ User can retry
```

---

## Cookie Security Details

```
┌────────────────────────────────────────────────────┐
│         HTTP-Only Cookie Security                │
├────────────────────────────────────────────────────┤
│                                                    │
│  ✅ HttpOnly Flag                                 │
│     ├─ JavaScript CANNOT read this cookie         │
│     ├─ Protection against XSS attacks              │
│     └─ Example: document.cookie returns nothing   │
│                                                    │
│  ✅ Secure Flag                                   │
│     ├─ Only sent over HTTPS                       │
│     ├─ Never sent over HTTP                        │
│     └─ Prevents man-in-the-middle attacks         │
│                                                    │
│  ✅ SameSite=Lax                                  │
│     ├─ Only sent for top-level navigations        │
│     ├─ Protection against CSRF attacks             │
│     └─ Safe for normal user interactions          │
│                                                    │
│  ✅ 24-Hour Expiry                               │
│     ├─ Auto-deleted after 24 hours                │
│     ├─ Users must re-verify payment               │
│     └─ Prevents indefinite access                  │
│                                                    │
│  ✅ Encrypted in Transit                          │
│     ├─ Sent via HTTPS                             │
│     ├─ Cannot be intercepted                      │
│     └─ Safe from network sniffing                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Error Scenarios Handled

```
Scenario 1: User Loses Connection During Payment
         │
         └─→ Payment may succeed on Paystack side
             │
             └─→ But user doesn't see callback
                 │
                 └─→ User can manually refresh /registration-payment
                     │
                     └─→ Reference param in URL
                         │
                         └─→ verify endpoint called again
                             │
                             └─→ setPaymentVerified called again
                                 │
                                 └─→ Cookie set (or refreshed)
                                     │
                                     └─→ User can access /register

Scenario 2: User Clears Cookies
         │
         └─→ payment_verified cookie deleted manually
             │
             └─→ User visits /agent/register
                 │
                 └─→ check-payment finds no cookie
                     │
                     └─→ Shows "Payment Required"
                         │
                         └─→ User must pay again
                             │
                             └─→ Prevents cookie manipulation

Scenario 3: Cookie Expires (24 hours)
         │
         └─→ Browser auto-deletes payment_verified cookie
             │
             └─→ User visits /agent/register
                 │
                 └─→ check-payment finds no cookie
                     │
                     └─→ Shows "Payment Required"
                         │
                         └─→ User must pay again
                             │
                             └─→ Safety mechanism against old payments

Scenario 4: Payment Verification Fails
         │
         └─→ setPaymentVerified() fails (server error)
             │
             └─→ No cookie set
                 │
                 └─→ User still sees "Payment Required"
                     │
                     └─→ User can retry payment
                         │
                         └─→ Prevents false positives
```

---

## Execution Timeline

```
T=0:00   User visits /registration-payment
         │
T=0:15   User clicks "Pay with Paystack"
         │
T=0:30   Paystack checkout loads
         │
T=2:00   User completes payment
         │
T=2:05   Paystack processes payment
         │
T=2:10   Payment SUCCESS
         │
         Paystack redirects with ?reference=abc123
         │
T=2:15   Frontend catches reference parameter
         │
         POST /api/paystack/register/verify (reference + agentId)
         │
T=2:20   Backend validates with Paystack API
         │
T=2:25   Paystack confirms payment successful
         │
T=2:30   Backend calls: await setPaymentVerified(agentId)
         │
T=2:35   Cookie: payment_verified = agentId (expires T+24h)
         │
T=2:40   Backend returns {success: true}
         │
T=2:45   Frontend shows /agent/payment-success page
         │
T=3:00   User clicks "Go to Registration" or navigates to /agent/register
         │
T=3:05   Page loads useEffect
         │
T=3:10   Calls GET /api/agent/check-payment
         │
T=3:15   Backend checks for payment_verified cookie
         │
T=3:20   ✅ Cookie found! Returns {verified: true}
         │
T=3:25   Frontend renders registration form
         │
T=5:00   User fills out form
         │
T=7:00   User clicks "Create Account"
         │
T=7:05   Frontend calls handleSubmit()
         │
T=7:10   Backend inserts agent data to Supabase
         │
T=7:15   ✅ Insert successful
         │
T=7:20   Frontend calls: await clearPaymentGate()
         │
T=7:25   Backend deletes: payment_verified cookie
         │
T=7:30   Frontend redirects to /agent/registration-payment
         │
T=7:35   User sees success message
         │
T=7:40   ✅ COMPLETE - Payment verified → Form filled → Account created
```
