# Deployment Checklist - v2.2.0

## Pre-Deployment Verification

### Code Review
- [ ] Review `/app/api/paystack/register/verify/route.ts` changes
- [ ] Review `/app/agent/registration-complete/page.tsx` changes
- [ ] Review `/app/agent/registration-payment/page.tsx` changes
- [ ] Review `/components/agent/AgentPublishNewProperties.tsx` changes
- [ ] Verify no console.log debug statements remaining
- [ ] Verify imports are correct
- [ ] Check TypeScript compilation - no errors
- [ ] Check for missing semicolons or syntax issues

### Configuration Check
- [ ] `PAYSTACK_SECRET_KEY` configured in environment
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set correctly
- [ ] `NEXT_PUBLIC_APP_URL` set correctly
- [ ] WhatsApp number +233242799990 is correct
- [ ] Paystack webhook configured (if applicable)

### Database Verification
- [ ] Agents table has all required columns:
  - [ ] `isapproved` (boolean, default false)
  - [ ] `can_publish_properties` (boolean)
  - [ ] `can_update_properties` (boolean)
  - [ ] `email` (varchar)
- [ ] Properties table has required columns:
  - [ ] `is_approved` (boolean, default false)
  - [ ] `published_by_agent_id` (uuid)
- [ ] Run backup of agents and properties tables

### Test Environment Setup
- [ ] Have Paystack test credentials ready
- [ ] Have test agent account created
- [ ] Have test payment method configured
- [ ] WhatsApp web accessible
- [ ] Email inbox available for receipt checks

---

## Pre-Deployment Testing

### Test 1: Auto-Approval Flow
**Goal**: Verify agents are auto-approved on payment

```
✓ Steps:
  [ ] Create new test agent account
  [ ] Verify in DB: isapproved = false
  [ ] Complete Paystack payment
  [ ] Immediately check DB after payment success
  [ ] Verify: isapproved = true
  [ ] Verify: can_publish_properties = true
  [ ] Verify: can_update_properties = true
  [ ] Verify: updated_at timestamp is recent
  
✓ Expected Result:
  [ ] Agent status updated within 5 seconds of payment
  [ ] All three fields changed correctly
  [ ] No errors in logs
```

### Test 2: WhatsApp Integration
**Goal**: Verify WhatsApp message pre-fill works

```
✓ Steps:
  [ ] Complete payment and land on registration-complete page
  [ ] Verify WhatsApp message pre-filled with:
    [ ] Agent name
    [ ] Agent ID
    [ ] Payment amount (₵47.00)
    [ ] Timestamp
    [ ] Account status message
    [ ] Benefits list
    [ ] Support number
  [ ] Click "Send WhatsApp" button
  [ ] Verify WhatsApp web opens (or app)
  [ ] Verify message is pre-filled
  [ ] Send message from WhatsApp
  [ ] Verify message received (check WhatsApp for delivery)
  [ ] Return to page and click "Go to Dashboard"
  [ ] Verify dashboard access granted

✓ Expected Result:
  [ ] WhatsApp web/app opens automatically
  [ ] Message pre-filled and ready to send
  [ ] Can successfully send and go to dashboard
  [ ] Admin receives agent details via WhatsApp
```

### Test 3: Urgency Elements Display
**Goal**: Verify payment page urgency elements show correctly

```
✓ Steps:
  [ ] Go to registration page
  [ ] Complete registration form
  [ ] Reach payment page
  [ ] Scroll to see all elements:
    [ ] 24-hour countdown visible
    [ ] "Limited slots available" message visible
    [ ] Real earnings section visible:
      [ ] Ama Mensah: ₵2,500/month shown
      [ ] Kwame Asante: ₵3,200/month shown
      [ ] John Osei: ₵1,800/month shown
    [ ] Social proof visible: "14 agents paid in last hour"
    [ ] "View video testimonials" link visible
    [ ] Payment button still accessible below

✓ Expected Result:
  [ ] All urgency elements visible
  [ ] No overlapping text
  [ ] Link to testimonials works
  [ ] Styling looks good on mobile and desktop
```

### Test 4: Property Publishing Control
**Goal**: Verify properties default to unpublished

```
✓ Steps:
  [ ] Login as approved agent
  [ ] Go to /agent/publish-properties
  [ ] Fill property details
  [ ] Click "Submit Property"
  [ ] See success modal with message about unpublished status
  [ ] Check database: property has is_approved = false
  [ ] Go to marketplace/property listing page
  [ ] Property should NOT appear in listings
  [ ] (Admin) Go to admin property management
  [ ] Find property with is_approved = false
  [ ] Click approve/publish
  [ ] Check: is_approved changed to true
  [ ] Go back to marketplace
  [ ] Property NOW appears in listings

✓ Expected Result:
  [ ] Property never visible without is_approved = true
  [ ] Success message clearly explains pending status
  [ ] Admin can control visibility completely
  [ ] No database errors during transitions
```

### Test 5: Email Capture & Paystack Receipt
**Goal**: Verify email collected and receipt sent

```
✓ Steps:
  [ ] During registration, go to payment page
  [ ] Enter email address
  [ ] Complete Paystack payment
  [ ] Check email inbox
  [ ] Should have receipt from Paystack with:
    [ ] Payment amount (₵47.00)
    [ ] Transaction reference
    [ ] Date/time of transaction
    [ ] Merchant details
  [ ] Verify email matches what was entered

✓ Expected Result:
  [ ] Email received within 30 seconds of payment
  [ ] All payment details in email
  [ ] Email from Paystack (not our system)
```

### Test 6: End-to-End Journey
**Goal**: Complete full user journey

```
✓ Steps:
  [ ] 1. Register new agent at /agent/register
    [ ] See testimonials preview section
    [ ] Fill all form fields
    [ ] Click register
  
  [ ] 2. Land on payment page
    [ ] See urgency elements (24-hr, earnings, social proof)
    [ ] Enter email
    [ ] Click "Pay with Paystack"
  
  [ ] 3. Paystack payment
    [ ] Complete payment
    [ ] See success message
  
  [ ] 4. Auto-approval happens
    [ ] Verify in database (isapproved = true)
    [ ] Check logs - no errors
  
  [ ] 5. Registration complete page
    [ ] See enhanced WhatsApp message
    [ ] Dashboard button is disabled
    [ ] Click "Send WhatsApp"
    [ ] Send message from WhatsApp
  
  [ ] 6. Access dashboard
    [ ] Click "Go to Dashboard" (now enabled)
    [ ] Dashboard loads successfully
    [ ] Can see "Publish Properties" option
  
  [ ] 7. Publish property
    [ ] Go to /agent/publish-properties
    [ ] Fill property details
    [ ] Submit property
    [ ] See success message about unpublished status
    [ ] Check database: is_approved = false
  
  [ ] 8. Admin approves
    [ ] (As admin) Find property
    [ ] Approve/publish property
    [ ] Check: is_approved = true
    [ ] Go to marketplace - property visible

✓ Expected Result:
  [ ] Complete flow takes ~5 minutes
  [ ] No errors at any step
  [ ] Agent satisfied with instant access
  [ ] Property visibility controlled correctly
```

---

## Performance Tests

### Test 7: Auto-Approval Speed
**Goal**: Verify instant approval performance

```
✓ Steps:
  [ ] Make Paystack payment
  [ ] Note time payment completes
  [ ] Immediately query database
  [ ] Measure time until isapproved = true
  [ ] Should be < 5 seconds

✓ Expected Result:
  [ ] Approval within 5 seconds
  [ ] No database locks
  [ ] No slow query warnings
```

### Test 8: Concurrent Payments
**Goal**: Verify multiple agents can pay simultaneously

```
✓ Steps:
  [ ] Have 3 separate browsers/devices
  [ ] Start payment process on all 3
  [ ] Complete payment on all 3 simultaneously
  [ ] Check database for all 3
  [ ] All should show isapproved = true
  [ ] No conflicts or errors

✓ Expected Result:
  [ ] All agents approved successfully
  [ ] No database conflicts
  [ ] All emails sent
  [ ] All WhatsApp messages work
```

---

## Security Checks

### Test 9: Permission Enforcement
**Goal**: Verify only approved agents can publish

```
✓ Steps:
  [ ] Create agent without payment
  [ ] Try to access /agent/publish-properties
  [ ] Should see access denied or permission message
  [ ] Verify cannot submit properties
  [ ] (As approved agent) Can access
  [ ] Can successfully submit

✓ Expected Result:
  [ ] Non-approved agents cannot publish
  [ ] Approved agents can publish
  [ ] Proper error messages shown
```

### Test 10: Data Validation
**Goal**: Verify input validation works

```
✓ Steps:
  [ ] Try property submission with:
    [ ] Missing title → Should fail
    [ ] Missing price → Should fail
    [ ] Invalid price (negative) → Should fail
    [ ] Missing images → Should fail
    [ ] Invalid agent ID → Should return 404
  
✓ Expected Result:
  [ ] All validations work
  [ ] Specific error messages shown
  [ ] No invalid properties created
```

---

## Rollback Plan

### If Deployment Fails

**Step 1: Stop Services**
```bash
# Stop application
# Check logs for errors
# Note: deployment time and failure type
```

**Step 2: Rollback Code**
```bash
# Revert the 4 modified files to previous version
# OR restore from git history
git revert <commit-hash>
git push
```

**Step 3: Restore Database (If Needed)**
```bash
# If database was modified:
# Restore from backup created pre-deployment
# Restore agents_backup table if corrupted
# Restore properties_backup table if corrupted
```

**Step 4: Verify Rollback**
- [ ] Test registration flow
- [ ] Test payment flow
- [ ] Test property publishing
- [ ] Verify no data loss

---

## Post-Deployment Verification

### Immediately After Deployment (First Hour)

- [ ] Check error logs - should be empty
- [ ] Monitor Supabase database - no connection issues
- [ ] Test one complete registration flow
- [ ] Verify one payment processes correctly
- [ ] Check Paystack webhook deliveries
- [ ] Monitor error rate from Vercel

### First Day Monitoring

- [ ] Check conversion metrics (regs → payments)
- [ ] Monitor auto-approval - should happen instantly
- [ ] Check WhatsApp message delivery
- [ ] Monitor property publishing workflows
- [ ] Review agent feedback
- [ ] Check database query performance

### First Week Monitoring

- [ ] Compare conversion rate vs previous week
- [ ] Analyze payment drop-off points
- [ ] Review agent support requests
- [ ] Check property approval workflow
- [ ] Monitor database size growth
- [ ] Validate admin tools still work

---

## Success Metrics to Track

| Metric | Baseline | Target | Current |
|--------|----------|--------|---------|
| Registration/day | X | X | [ ] |
| Payment/day | Y | Y×1.2 | [ ] |
| Conversion % | Y/X | (Y×1.2)/X | [ ] |
| Auto-approval time | N/A | <5s | [ ] |
| Property approval rate | N/A | 100% | [ ] |
| Admin approval time | N/A | <24h | [ ] |
| WhatsApp engagement | N/A | >80% | [ ] |

---

## Sign-Off

### By Developer
- [ ] All code reviewed
- [ ] All tests passed
- [ ] No breaking changes
- [ ] Documentation complete
- [ ] Ready for deployment

**Signature**: ________________  
**Date**: ________________

### By QA
- [ ] All test scenarios passed
- [ ] No bugs found
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Approved for production

**Signature**: ________________  
**Date**: ________________

### By Admin
- [ ] Understands new workflows
- [ ] Ready for agent support
- [ ] Property approval process trained
- [ ] Rollback plan reviewed
- [ ] Approved for deployment

**Signature**: ________________  
**Date**: ________________

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Dev Lead | | | |
| DevOps | | | |
| Admin | | | |
| Paystack Support | | | |

---

**Deployment Checklist Version**: v2.2.0  
**Last Updated**: February 28, 2026  
**Status**: Ready for Review
