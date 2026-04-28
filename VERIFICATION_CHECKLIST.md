# Complete Verification Checklist

Use this checklist to verify all fixes are working correctly.

## Pre-Migration Checklist

- [ ] Backup your database (if applicable)
- [ ] Have all migration files available
- [ ] Have Supabase SQL Editor open
- [ ] Ready to copy/paste SQL code

## Migration Execution Checklist

### Step 1: Timeline Columns Migration
- [ ] Open file: `/scripts/add-timeline-columns.sql`
- [ ] Copy entire contents
- [ ] Paste in Supabase SQL Editor
- [ ] Run query
- [ ] Verify success (no error messages)

### Step 2: Project Requests Table Migration
- [ ] Open file: `/scripts/create-fashion-project-requests-table.sql`
- [ ] Copy entire contents
- [ ] Paste in Supabase SQL Editor
- [ ] Run query
- [ ] Verify success (no error messages)

### Step 3: Referrals Table Migration
- [ ] Open file: `/scripts/update-fashion-referrals-table.sql`
- [ ] Copy entire contents
- [ ] Paste in Supabase SQL Editor
- [ ] Run query
- [ ] Verify success (no error messages)

## Post-Migration Verification

### Database Structure Verification
Run these queries in Supabase to verify tables exist:

```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

- [ ] Table `fashion_products` exists
- [ ] Table `fashion_project_requests` exists
- [ ] Table `fashion_referrals` exists

### Column Verification

**For fashion_products:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fashion_products' 
ORDER BY ordinal_position;
```
- [ ] Column `estimated_timeline_days` exists (INTEGER)
- [ ] Column `express_sewing_charge` exists (DECIMAL)
- [ ] Column `completion_time` exists (still there for backward compatibility)

**For fashion_project_requests:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fashion_project_requests' 
ORDER BY ordinal_position;
```
- [ ] Column `measurements` exists (TEXT, not JSONB)
- [ ] Column `client_name` exists
- [ ] Column `client_whatsapp` exists
- [ ] Column `additional_notes` exists

**For fashion_referrals:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fashion_referrals' 
ORDER BY ordinal_position;
```
- [ ] Column `referrer_whatsapp` exists
- [ ] Column `product_code` exists
- [ ] Column `product_name` exists
- [ ] Column `whatsapp_message_sent` exists

## Frontend Testing Checklist

### Admin Tab - Fashion Avenue

#### Create Product Test
- [ ] Navigate to Admin > Fashion Avenue tab
- [ ] Click "Add Product" button
- [ ] Fill in Product Name: "Test Product"
- [ ] Fill in Product Code: "TEST-001"
- [ ] Fill in Category (select any)
- [ ] Fill in Base Price: "100"
- [ ] Fill in Timeline: "10" (just the number)
- [ ] Fill in Express Charge: "25"
- [ ] Fill in Commission: "15"
- [ ] Upload at least one image
- [ ] Click "Create Product"
- [ ] Verify alert shows "Product saved successfully!"
- [ ] Verify product appears in the products list

#### Edit Product Test
- [ ] Click "Edit" on the product you just created
- [ ] **CRITICAL CHECK:** Verify Timeline field shows "10"
- [ ] **CRITICAL CHECK:** Verify Express Charge field shows "25"
- [ ] **CRITICAL CHECK:** Verify Commission field shows "15"
- [ ] Change Timeline to "15"
- [ ] Change Express Charge to "30"
- [ ] Change Commission to "20"
- [ ] Click "Update Product"
- [ ] Verify alert shows "Product saved successfully!"
- [ ] Click "Edit" again on the same product
- [ ] **CRITICAL CHECK:** Verify Timeline shows "15"
- [ ] **CRITICAL CHECK:** Verify Express Charge shows "30"
- [ ] **CRITICAL CHECK:** Verify Commission shows "20"

#### Image Management Test
- [ ] In Edit form, scroll to Images section
- [ ] Click to add more images (or click on existing ones)
- [ ] After adding image, hover over it
- [ ] **Verify red X button appears on hover**
- [ ] Click the X button
- [ ] **Verify image is removed from the preview**
- [ ] Save the product
- [ ] Edit the product again
- [ ] **Verify deleted image is not shown**

### Public Page - Fashion Avenue

#### Product Display Test
- [ ] Navigate to /fashion-avenue
- [ ] Verify products display in grid
- [ ] **Verify Timeline displays** (e.g., "10 days", "15 days")
- [ ] **Verify Commission displays** in green badge if > 0
- [ ] Verify product images display (squares, vertical aspect ratio)
- [ ] Click on product image
- [ ] **Verify image modal opens** with full-screen image
- [ ] Close modal

#### Project Request Test
- [ ] Click any product card
- [ ] Click "Request Project" button
- [ ] **Verify Modal Opens** with form
- [ ] Fill Form:
  - [ ] Name: "Test User"
  - [ ] Location: "Accra"
  - [ ] WhatsApp: "0242799990"
  - [ ] Timeline: "14 days"
  - [ ] Measurements: "Chest 50cm, Waist 30cm" (**NOT JSON!**)
  - [ ] Notes: "Test note"
- [ ] Click "Submit" or "Send" button
- [ ] **CRITICAL CHECK:** Do NOT see JSON error
- [ ] **Verify WhatsApp opens** with pre-filled message
- [ ] Message should include:
  - [ ] Product name
  - [ ] Product code
  - [ ] Client name
  - [ ] Measurements (plain text)
  - [ ] Product link
- [ ] Close WhatsApp (or actually send if you want to test full flow)
- [ ] Modal should close

#### Referral Test
- [ ] Click any product card
- [ ] Click "Refer & Earn" button
- [ ] **Verify Modal Opens** with referral form
- [ ] Fill Form:
  - [ ] Your Name: "Jane Doe"
  - [ ] Friend's WhatsApp: "0551234567"
- [ ] Click "Submit" or "Send" button
- [ ] **Verify WhatsApp opens** with referral message
- [ ] Message should include:
  - [ ] "Recommendation from Jane Doe"
  - [ ] Product name
  - [ ] Product code
  - [ ] Referral link
  - [ ] Designer contact info
- [ ] Close WhatsApp

### Admin Dashboard - New Tabs

#### Fashion Requests Tab
- [ ] Go to Admin Dashboard
- [ ] **Verify "Fashion Requests" tab exists** (between Fashion Avenue and other tabs)
- [ ] Click "Fashion Requests"
- [ ] **Verify table shows request(s)** from your project request submission
- [ ] **Verify columns display:**
  - [ ] Client Name
  - [ ] Product Code
  - [ ] WhatsApp
  - [ ] Timeline Preference
  - [ ] Status
- [ ] **CRITICAL:** Click to expand/view request details
- [ ] **CRITICAL:** Verify Measurements display as **plain text** (NOT as JSON error)

#### Fashion Referrals Tab
- [ ] Go to Admin Dashboard
- [ ] **Verify "Fashion Referrals" tab exists**
- [ ] Click "Fashion Referrals"
- [ ] **Verify table shows referral(s)** from your referral submission
- [ ] **Verify columns display:**
  - [ ] Referrer Name
  - [ ] Product Code
  - [ ] Product Name
  - [ ] Status
- [ ] Click to expand/view referral details
- [ ] Verify all referral information is displayed

## Error-Free Verification

### Check Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Click "Console" tab
- [ ] Perform all the tests above
- [ ] **Verify NO red error messages appear**
- [ ] **Verify NO "is not valid JSON" errors**
- [ ] Note any warnings (yellow) and report if unexpected

### Check Network Tab
- [ ] In DevTools, click "Network" tab
- [ ] Perform project request submission
- [ ] Verify POST to `/api/fashion/project-request` returns 201
- [ ] Verify response body contains `success: true`
- [ ] Perform referral submission
- [ ] Verify POST to `/api/fashion/referral` returns 201
- [ ] Verify response body contains `success: true`

## Final Comprehensive Test

Perform this sequence to verify everything works together:

1. **Create Product in Admin**
   - [ ] Admin > Fashion Avenue
   - [ ] Create product with timeline "12"
   - [ ] Product appears in list

2. **View Product on Public Page**
   - [ ] Go to /fashion-avenue
   - [ ] Verify new product shows "12 days"
   - [ ] Click on product

3. **Submit Project Request**
   - [ ] Click "Request Project"
   - [ ] Fill all fields (measurements as plain text)
   - [ ] Submit
   - [ ] WhatsApp opens

4. **Submit Referral**
   - [ ] Click "Refer & Earn"
   - [ ] Fill name and friend WhatsApp
   - [ ] Submit
   - [ ] WhatsApp opens

5. **Verify in Admin**
   - [ ] Go to Admin Dashboard
   - [ ] Check Fashion Requests tab - new request appears
   - [ ] Check Fashion Referrals tab - new referral appears
   - [ ] Verify measurements show correctly (plain text)

6. **Edit Product in Admin**
   - [ ] Go to Admin > Fashion Avenue
   - [ ] Edit the product you created
   - [ ] **Verify all fields load correctly** (especially Timeline)
   - [ ] Update product
   - [ ] Verify changes appear on public page

## Sign-Off

- [ ] All migrations completed successfully
- [ ] No database errors
- [ ] All timeline fields load and save correctly
- [ ] All measurements stored as plain text (no JSON errors)
- [ ] All images upload and delete correctly
- [ ] All project requests save to database
- [ ] All referrals save to database
- [ ] Admin tabs display all data correctly
- [ ] No console errors during testing
- [ ] WhatsApp messages generate correctly

---

**Date Completed:** ________________

**By:** ________________

**Notes:** 
```
(Add any notes about testing or issues encountered)



```

## If Any Test Fails

1. Check `/BUG_FIXES_APPLIED.md` for detailed fix information
2. Verify migration was actually run (no error, but did it complete?)
3. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
4. Check browser console for specific error messages
5. Check Supabase logs for database errors
6. Review the relevant API endpoint code
7. Document the error and create an issue report
