# Features Testing & Verification Checklist

## Pre-Testing Setup

- [ ] Ensure all dependencies are installed
- [ ] Run `npm install` or `pnpm install`
- [ ] Start development server
- [ ] Clear browser cache
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile device or mobile emulator

---

## Feature 1: Manual Payment Option - Testing

### A. Payment Button Visibility

#### Test 1: Both buttons visible
- [ ] Visit `/agent/register` and go through registration
- [ ] Reach the `/agent/registration-payment` page
- [ ] **Verify**: See TWO buttons side by side:
  - Left button: "Pay ₵47 via Paystack" (green)
  - Right button: "Pay ₵45 Manually" (blue)
- [ ] **Screen sizes tested**:
  - [ ] Desktop (1920x1080)
  - [ ] Tablet (768x1024)
  - [ ] Mobile (375x667)

#### Test 2: Button styling
- [ ] Paystack button has green gradient
- [ ] Manual button has blue gradient
- [ ] Both buttons have proper spacing (gap-3 between them)
- [ ] Info banner displays: "💰 Save ₵2 with manual payment"
- [ ] Banner is blue background with proper contrast

### B. Manual Payment Dialog

#### Test 3: Dialog opens correctly
- [ ] Click "Pay ₵45" button
- [ ] **Verify**: Dialog modal opens with:
  - [ ] Header: "Manual Payment Instructions" (blue gradient)
  - [ ] Icon: CreditCard icon in header
  - [ ] Content area properly styled
  - [ ] Dialog is centered on screen
  - [ ] Background has dark overlay
  - [ ] Dialog is dismissible with X button (if present)

#### Test 4: Payment Code Generation
- [ ] Dialog shows "Amount to Pay: ₵45.00"
- [ ] **5-digit payment code displays prominently**:
  - [ ] Code is large font (text-2xl)
  - [ ] Code is bold (font-bold)
  - [ ] Code is monospace font
  - [ ] Code is in blue box with border
  - [ ] Code is different each time dialog opens
- [ ] Generate dialog 5 times, verify codes are all different
- [ ] Codes are between 10000-99999

#### Test 5: Dialog Content
- [ ] Section: "How to Pay:"
  - [ ] Shows 4 steps
  - [ ] Step 1: Transfer ₵45
  - [ ] Step 2: Use code as reference
  - [ ] Step 3: Click "Completed Payment"
  - [ ] Step 4: Contact admin via WhatsApp
- [ ] Green banner: "💚 You're saving ₵2!"
- [ ] Helper text: "After clicking, you'll be redirected to WhatsApp"

#### Test 6: Dialog Buttons
- [ ] "Cancel" button closes dialog without action
- [ ] "✓ Completed Payment" button initiates WhatsApp
- [ ] Buttons are properly styled
- [ ] Button state changes while processing

### C. Email Validation

#### Test 7: Email Required
- [ ] Don't enter email, click "Pay ₵45"
- [ ] **Verify**: Error message "Please enter your email address"
- [ ] Dialog does NOT open
- [ ] Email input highlights in red (error state)

#### Test 8: Email Format Validation
- [ ] Enter invalid email (e.g., "notanemail")
- [ ] Click "Pay ₵45"
- [ ] **Verify**: Error message "Please enter a valid email address"
- [ ] Dialog does NOT open

#### Test 9: Valid Email
- [ ] Enter valid email (e.g., "agent@example.com")
- [ ] Click "Pay ₵45"
- [ ] **Verify**: Dialog opens successfully
- [ ] Email is saved in database (check with admin)

### D. WhatsApp Integration

#### Test 10: WhatsApp Opens Correctly
- [ ] Complete the manual payment flow
- [ ] Click "✓ Completed Payment"
- [ ] **Verify**: New WhatsApp window/tab opens
- [ ] WhatsApp link is properly formatted
- [ ] URL contains admin number: `+233242799990`

#### Test 11: WhatsApp Message Content
The pre-filled message should contain:
- [ ] Header: "✅ *MANUAL PAYMENT RECEIVED - ACCOUNT ACTIVATION REQUEST*"
- [ ] "Hello Dataflex Admin,"
- [ ] Agent Name (correct)
- [ ] Agent ID (correct)
- [ ] Email (correct)
- [ ] Payment Code/Reference (correct)
- [ ] "Amount Paid: ₵45.00"
- [ ] "Payment Method: Manual Transfer"
- [ ] Timestamp (formatted correctly)
- [ ] Status: ✅ Payment Completed
- [ ] Account activation request
- [ ] List of features ready to use
- [ ] Signature with agent name

#### Test 12: Message Formatting
- [ ] Message has proper line breaks
- [ ] Text is readable in WhatsApp
- [ ] Bold text formatting works (*text*)
- [ ] No special character encoding issues
- [ ] Message doesn't exceed WhatsApp limit

#### Test 13: WhatsApp Mobile Testing
- [ ] On mobile device, clicking opens WhatsApp app (not web)
- [ ] Message auto-populates in chat compose
- [ ] Message sends successfully
- [ ] Can manually edit message before sending

### E. Button States & Disabled States

#### Test 14: Button Disabling
- [ ] When processing: Buttons should be disabled
- [ ] No email: Buttons should be disabled
- [ ] Valid email: Buttons should be enabled
- [ ] During WhatsApp open: Buttons disabled (briefly)

#### Test 15: Loading States
- [ ] Paystack button shows "Processing..." while processing
- [ ] Paystack button shows spinner icon
- [ ] Manual button shows "Processing..." when completing payment
- [ ] Both buttons return to normal state after action

### F. Comparison with Paystack Option

#### Test 16: Both Payment Methods Work
- [ ] Test Paystack payment still works as before
- [ ] Test manual payment workflow
- [ ] Both should work independently
- [ ] Users can switch between options before confirming

---

## Feature 2: Additional Services Section - Testing

### A. Section Visibility & Placement

#### Test 17: Section Appears on Page
- [ ] Visit `/no-registration` page
- [ ] Scroll to find "Additional Services & Support" section
- [ ] **Location**: Should appear BEFORE "Business Registration and Compliance"
- [ ] Section has proper background color (light gray gradient)
- [ ] Section has proper padding/margins

#### Test 18: Section Header
- [ ] Title: "Additional Services & Support" (large, bold)
- [ ] Subtitle explains platform support
- [ ] Text mentions "faster and with convenience"
- [ ] Header is centered and styled consistently

### B. Services Display

#### Test 19: Services Count
- [ ] Count all visible service cards
- [ ] **Should be 28+ services**:
  - [ ] 6 Personal Documents
  - [ ] 6 Business & Corporate
  - [ ] 4 Tax & Finance
  - [ ] 4 Property & Legal
  - [ ] 4 Banking & Financial
  - [ ] 4 Education & Employment

#### Test 20: Service Cards Structure
Each card should display:
- [ ] Service icon (category-related)
- [ ] Service title (bold, large)
- [ ] Short description (1-2 sentences)
- [ ] "Inquire via WhatsApp" button (green)
- [ ] Card has rounded corners
- [ ] Card has subtle shadow
- [ ] Card has hover effect (shadow increases)

#### Test 21: Service Categories
Categories are clearly labeled:
- [ ] "Personal Documents & Services" header
- [ ] "Business & Corporate Services" header
- [ ] "Tax & Finance Services" header
- [ ] "Property & Legal Services" header
- [ ] "Banking & Financial Services" header
- [ ] "Education & Employment Services" header
- [ ] Each category has underline accent (green gradient)

### C. Responsive Design

#### Test 22: Mobile Layout (375px width)
- [ ] Services display in **1 column**
- [ ] Cards are full width (minus padding)
- [ ] Text is readable
- [ ] Buttons are easily clickable
- [ ] Category headers are visible
- [ ] No horizontal scrolling

#### Test 23: Tablet Layout (768px width)
- [ ] Services display in **2 columns**
- [ ] Cards are balanced width
- [ ] Gap between cards is proper
- [ ] All content fits without scrolling
- [ ] Layout is symmetrical

#### Test 24: Desktop Layout (1920px width)
- [ ] Services display in **3 columns**
- [ ] Even distribution across width
- [ ] Cards are same size
- [ ] Good use of horizontal space
- [ ] Balanced visual appearance

### D. Service Inquiry Functionality

#### Test 25: WhatsApp Button Click
- [ ] Click "Inquire via WhatsApp" button on first service
- [ ] **Verify**: New WhatsApp window/tab opens
- [ ] Correct admin number: `+233242799990`
- [ ] Message is pre-filled

#### Test 26: Message Content for Services
Pre-filled message should contain:
- [ ] "Hello! I'm interested in learning more about: *[Service Name]*"
- [ ] Service name is correct and bold
- [ ] "Please provide me with detailed information..."
- [ ] "Thank you!"
- [ ] Proper formatting
- [ ] No encoding issues

#### Test 27: Different Services Generate Different Messages
- [ ] Click Inquiry on "National ID Application"
  - [ ] Message says: "*National ID Application*"
- [ ] Click Inquiry on "VAT Registration"
  - [ ] Message says: "*VAT Registration*"
- [ ] Click Inquiry on "Land Title Registration"
  - [ ] Message says: "*Land Title Registration*"
- [ ] Each service name is correctly populated

#### Test 28: Footer CTA Button
- [ ] Scroll to bottom of services section
- [ ] Section: "Can't Find What You're Looking For?"
- [ ] Button text: "Contact Us on WhatsApp"
- [ ] Button styling: White background on green
- [ ] Clicking opens WhatsApp
- [ ] Message is for custom inquiry

### E. Icon & Styling

#### Test 29: Service Icons
- [ ] All service cards have icons
- [ ] Icons are consistent (Lucide React)
- [ ] Icons are properly sized (h-6 w-6)
- [ ] Icon background is gradient (emerald/green)
- [ ] Icons change color on hover

#### Test 30: Color Consistency
- [ ] All buttons are same color (emerald to green gradient)
- [ ] Section background is consistent with page
- [ ] Text colors have proper contrast
- [ ] Icons are themed correctly

### F. Content Accuracy

#### Test 31: Service Titles
Verify correct titles are displayed:
- [ ] "National ID Application"
- [ ] "Driver's License (New / Renewal)"
- [ ] "Marriage Certificate"
- [ ] "Police Clearance Certificate"
- [ ] "Business Name Reservation"
- [ ] "VAT Registration"
- [ ] "Trademark Registration"
- [ ] "Land Title Registration"
- [ ] (And all others)

#### Test 32: Service Descriptions
- [ ] Descriptions are clear and concise
- [ ] Descriptions are 1-2 sentences
- [ ] Grammar and spelling are correct
- [ ] Descriptions match the service

### G. Integration on Page

#### Test 33: Placement on Page
- [ ] Section appears after AFA Context Section
- [ ] Section appears BEFORE Business Registration Form
- [ ] Proper spacing between sections
- [ ] No overlapping content

#### Test 34: Page Flow
- [ ] User can scroll through all sections
- [ ] Services section fits naturally on page
- [ ] No layout breaks
- [ ] Footer is still accessible

### H. Special Cases

#### Test 35: Custom Service Inquiry
- [ ] Click "Contact Us on WhatsApp" at bottom
- [ ] Message says: "Custom Service Request"
- [ ] Message asks about specific needs
- [ ] User can still customize before sending

#### Test 36: Multiple Inquiries
- [ ] Click multiple service buttons
- [ ] Each opens new WhatsApp window
- [ ] Each message has correct service name
- [ ] No messages conflict or overlap

---

## Cross-Browser Testing

### Test on Multiple Browsers

#### Chrome/Edge
- [ ] Manual payment works
- [ ] Services display correctly
- [ ] WhatsApp links open properly
- [ ] Responsive design works
- [ ] No console errors

#### Firefox
- [ ] Manual payment works
- [ ] Services display correctly
- [ ] WhatsApp links open properly
- [ ] Responsive design works
- [ ] No console errors

#### Safari (iPhone/Mac)
- [ ] Manual payment works
- [ ] Services display correctly
- [ ] WhatsApp links open mobile app
- [ ] Responsive design works
- [ ] No console errors

---

## Performance Testing

#### Test 37: Page Load Time
- [ ] Page loads within reasonable time
- [ ] No performance issues
- [ ] No slow animations
- [ ] Images load properly (if any)

#### Test 38: Smooth Interactions
- [ ] Dialog opens smoothly
- [ ] Buttons respond instantly
- [ ] No lag or stuttering
- [ ] Hover effects are smooth

---

## Accessibility Testing

#### Test 39: Keyboard Navigation
- [ ] Can tab through all buttons
- [ ] Can activate buttons with Enter key
- [ ] Dialog can be closed with Escape key
- [ ] Focus states are visible

#### Test 40: Screen Reader
- [ ] Button labels are descriptive
- [ ] Icons have proper alt text
- [ ] Dialog is properly announced
- [ ] Service titles are readable

---

## Security & Data Testing

#### Test 41: Email Data
- [ ] Email is saved to database
- [ ] Email is validated before use
- [ ] No SQL injection possible
- [ ] Email is properly encoded

#### Test 42: Payment Code
- [ ] Code is random and unique
- [ ] Code can be stored (if needed)
- [ ] No duplicate codes generated
- [ ] Code is never exposed in URL

#### Test 43: WhatsApp Links
- [ ] URLs are properly encoded
- [ ] Special characters are escaped
- [ ] No sensitive data in URL
- [ ] Links open safely

---

## Database Testing

#### Test 44: Agent Email Update
- [ ] Agent email is saved on manual payment start
- [ ] Email updates in database
- [ ] Email is visible in agent profile
- [ ] Can verify: SELECT email FROM agents WHERE id=?

#### Test 45: Payment Tracking (If Implemented)
- [ ] Payment code can be stored
- [ ] Payment method can be tracked
- [ ] Timestamp is accurate
- [ ] Data persists correctly

---

## Final Verification

### Before Going Live

- [ ] All tests passed
- [ ] No console errors
- [ ] No warnings in browser
- [ ] Code is clean and documented
- [ ] Database is updated
- [ ] WhatsApp admin number is correct
- [ ] All links work
- [ ] All assets load
- [ ] Page is optimized
- [ ] Mobile experience is good

### Post-Deployment

- [ ] Monitor WhatsApp inquiries
- [ ] Track manual payment usage
- [ ] Monitor service inquiry volume
- [ ] Check admin response times
- [ ] Get user feedback
- [ ] Monitor for errors in logs

---

## Quick Test Scenarios

### Scenario 1: Complete Manual Payment Flow
1. Visit registration page
2. Enter valid email
3. Click "Pay ₵45"
4. See dialog with unique code
5. Click "Completed Payment"
6. WhatsApp opens with message
7. Verify all details in message
8. Send message to admin
9. Admin responds

**Status**: ✅ PASS / ❌ FAIL

### Scenario 2: Browse and Inquire About Services
1. Visit /no-registration page
2. Scroll to Services section
3. Click random service button
4. WhatsApp opens with inquiry
5. Message has correct service name
6. Send to admin
7. Admin responds with info

**Status**: ✅ PASS / ❌ FAIL

### Scenario 3: Mobile User Flow
1. Visit registration on mobile
2. See payment buttons stack properly
3. Enter email
4. Click manual payment
5. Dialog displays well on mobile
6. Can read payment code clearly
7. Complete payment
8. WhatsApp opens on mobile app
9. Message is readable

**Status**: ✅ PASS / ❌ FAIL

---

## Known Issues & Resolutions

| Issue | Status | Resolution |
|-------|--------|-----------|
| Dialog not opening | - | Check email validation |
| WhatsApp not opening | - | Verify admin number format |
| Message encoding | - | Check character encoding |
| Services not showing | - | Check component import |
| Layout issues | - | Check responsive breakpoints |

---

## Sign-Off

**Tested By**: [Your Name]
**Date**: [Date]
**Status**: ✅ Ready for Production / ⚠️ Issues Found

**Notes**:
[Add any additional notes or observations]

---

## Quick Reference

### Critical Points to Test
1. ✅ Manual payment code generation (random & unique)
2. ✅ WhatsApp message has all required data
3. ✅ Services section appears in correct location
4. ✅ Responsive design works on all sizes
5. ✅ Email validation works properly
6. ✅ Both payment methods work independently
7. ✅ Admin number is correct
8. ✅ No database errors

### If Any Test Fails
1. Note the test number
2. Document the issue
3. Check the code
4. Fix the issue
5. Re-run the test
6. Verify the fix
7. Document the resolution

