# Database Migration Checklist

Run these SQL migrations in your Supabase SQL Editor in the order listed:

## 1. Add Timeline Columns to Fashion Products
**File:** `/scripts/add-timeline-columns.sql`

Adds:
- `estimated_timeline_days` (INTEGER) - stores the number of days for product completion
- `express_sewing_charge` (DECIMAL) - stores express/rush order charges

Creates indexes for faster queries.

```sql
-- Copy and paste from /scripts/add-timeline-columns.sql
```

## 2. Update Fashion Project Requests Table
**File:** `/scripts/create-fashion-project-requests-table.sql`

Creates the `fashion_project_requests` table with:
- `measurements` as TEXT (not JSONB)
- All required columns for storing project inquiries
- Proper foreign keys and constraints

```sql
-- Copy and paste from /scripts/create-fashion-project-requests-table.sql
```

## 3. Update Fashion Referrals Table
**File:** `/scripts/update-fashion-referrals-table.sql`

Adds missing columns:
- `referrer_whatsapp` - referrer's phone number
- `product_code` - product code being referred
- `product_name` - product name for easy reference
- `whatsapp_message_sent` - tracking message status

```sql
-- Copy and paste from /scripts/update-fashion-referrals-table.sql
```

## Verification Steps

After running all migrations:

1. **Check fashion_products table:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'fashion_products' 
   ORDER BY ordinal_position;
   ```

2. **Check fashion_project_requests table:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'fashion_project_requests' 
   ORDER BY ordinal_position;
   ```

3. **Check fashion_referrals table:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'fashion_referrals' 
   ORDER BY ordinal_position;
   ```

## Quick Test

After migration, test by:

1. **Admin Tab - Fashion Avenue:**
   - Create a new product with timeline
   - Edit the product and verify timeline loads correctly
   - Upload images and test delete functionality
   - Verify commission and express charge are saved

2. **Public Page - Fashion Avenue:**
   - View products and verify timelines display
   - Click "Request Project" and submit with measurements
   - Click "Refer & Earn" and submit referral
   - Check admin tabs to verify data was saved

3. **Admin Tabs:**
   - Check "Fashion Requests" tab shows submitted requests
   - Check "Fashion Referrals" tab shows submitted referrals
