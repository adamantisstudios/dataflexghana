# Quick Setup Instructions

## Step 1: Run Database Migrations

Execute these SQL scripts in Supabase SQL Editor in this order:

### 1. Create Project Requests Table
```
Copy and paste the contents of:
/scripts/create-fashion-project-requests-table.sql
```

### 2. Update Referrals Table
```
Copy and paste the contents of:
/scripts/update-fashion-referrals-table.sql
```

### 3. Add Missing Product Columns (if not already done)
```
Copy and paste the contents of:
/scripts/add-missing-fashion-columns.sql
```

## Step 2: Verify Environment Variables

Ensure your Supabase credentials are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BASE_URL` (set to your domain for referral links)

## Step 3: Test the Implementation

### Test Admin Form Loading
1. Go to Admin Dashboard
2. Navigate to "Fashion Avenue" tab
3. Click "Edit" on any product
4. Verify that "Completion Time" and "Express Charge" fields load with correct values
5. All values should display properly without being blank

### Test Project Request Flow
1. Go to Fashion Avenue public page (not admin)
2. Click "Request Project" button on any product
3. Fill in all fields:
   - Your Full Name
   - Your Location
   - WhatsApp Contact Number (e.g., 0242799990 or +233242799990)
   - Timeline Preference
   - Measurements
   - Additional notes
4. Click "Send to WhatsApp"
5. Verify WhatsApp message is formatted professionally
6. Go to admin "Fashion Requests" tab
7. Your request should appear in the list
8. Try updating the status from dropdown

### Test Referral Flow
1. Go to Fashion Avenue public page
2. Click "Refer & Earn" on any product
3. Enter:
   - Your Name
   - Friend's WhatsApp Number
4. Click "Send Referral"
5. Verify message is formatted professionally
6. Go to admin "Fashion Referrals" tab
7. Your referral should appear
8. Try changing the status to "contacted", "earned", or "paid"

### Verify Database Entries
In Supabase:

**Check Project Requests**:
```sql
SELECT * FROM fashion_project_requests ORDER BY created_at DESC LIMIT 5;
```

**Check Referrals**:
```sql
SELECT * FROM fashion_referrals WHERE product_code IS NOT NULL ORDER BY created_at DESC LIMIT 5;
```

## Step 4: Customize WhatsApp Details

To change the designer WhatsApp number that receives messages:

**File**: `/app/api/fashion/project-request/route.ts`
- Find: `const designerNumber = '233242799990';`
- Replace with your actual WhatsApp number

**File**: `/app/api/fashion/referral/route.ts`
- Find: `const designerNumber = '233242799990';`
- Replace with your actual WhatsApp number

## Step 5: Customize Base URL

For referral links to work correctly, set in your environment:
```
NEXT_PUBLIC_BASE_URL=https://yourwebsite.com
```

Or it will default to `localhost:3000` in development.

## Troubleshooting

### Admin form fields not loading
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Refresh the page
- Check console for errors (F12)

### WhatsApp messages not sending
- Verify phone number format (should be 10-15 digits)
- Check WhatsApp isn't blocking the link
- Try manually opening https://wa.me/[number]?text=[message]

### Data not saving to database
- Check Supabase connection in console
- Verify RLS policies are set correctly
- Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Look for database constraint errors in network tab

### Admin tabs not showing
- Hard refresh admin page (Ctrl+F5)
- Check imports in `/app/admin/page.tsx`
- Verify tab components exist in `/components/admin/tabs/`

## Files Modified/Created

### New Files:
- `/components/admin/tabs/FashionProjectRequestsTab.tsx`
- `/components/admin/tabs/FashionReferralsTab.tsx`
- `/app/api/fashion/project-request/route.ts` (updated)
- `/app/api/fashion/referral/route.ts` (updated)
- `/app/api/admin/fashion/project-requests/route.ts`
- `/app/api/admin/fashion/project-requests/[id]/route.ts`
- `/app/api/admin/fashion/referrals-list/route.ts`
- `/app/api/admin/fashion/referrals-list/[id]/route.ts`
- `/scripts/create-fashion-project-requests-table.sql`
- `/scripts/update-fashion-referrals-table.sql`

### Modified Files:
- `/app/admin/page.tsx` (added tab imports and config)
- `/app/fashion-avenue/page.tsx` (updated request/referral handlers)
- `/components/admin/tabs/FashionAvenueTab.tsx` (fixed form field parsing)

## Support

If you encounter any issues:
1. Check the `/COMPLETE_IMPLEMENTATION_GUIDE.md` for detailed information
2. Review console errors (F12 → Console tab)
3. Check network tab for API errors
4. Verify database tables exist with correct schema
5. Ensure all environment variables are set correctly
