# Migration Instructions

## Running the Database Migration

The missing columns `product_code` and `commission_amount` have been added to fix the data persistence bug.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor**
4. Click **+ New Query**
5. Copy the entire contents of `/scripts/add-missing-fashion-columns.sql`
6. Paste into the query editor
7. Click **Run** to execute the migration

### Option 2: Using v0 System Action

If you have database connection configured, the migration script can be executed programmatically.

## What the Migration Does

1. **Adds `product_code` column** - VARCHAR(100) field to store unique product codes
2. **Adds `commission_amount` column** - DECIMAL(10, 2) field to store referral commission amounts
3. **Auto-generates product codes** for existing products using format: `{CATEGORY_PREFIX}-{YYYYMMDD}-{RECORD_ID}`
   - Traditional Wear: `TRAD-*`
   - Casual Wear: `CASU-*`
   - Evening Wear: `EVEN-*`
   - Accessories: `ACCE-*`
   - Custom Design: `CUST-*`
4. **Creates unique constraint** on product_code to prevent duplicates
5. **Adds database indexes** for performance optimization

## Expected Results After Migration

### For Existing Products
- Each product will have an auto-generated `product_code`
- `commission_amount` will default to 0.00

### For New Products (After Migration)
- Product code automatically generated on creation
- Commission amount can be set by admin
- Both values persist correctly on edits
- Values display correctly on both admin and public pages

## Verification

After running the migration, verify by:

1. **Check column existence:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'fashion_products' 
   AND column_name IN ('product_code', 'commission_amount');
   ```

2. **View sample data:**
   ```sql
   SELECT id, title, product_code, commission_amount 
   FROM fashion_products 
   LIMIT 5;
   ```

3. **In the admin panel:**
   - Navigate to Fashion Avenue tab
   - Check that products show product codes
   - Create a new product and verify code is generated
   - Set a commission_amount and verify it persists when editing

4. **On the public page:**
   - Visit /fashion-avenue
   - Verify commission badges appear for products with commissions

## Rollback (If Needed)

If you need to rollback, you can drop the columns:
```sql
-- WARNING: This removes the data!
ALTER TABLE fashion_products DROP COLUMN IF EXISTS product_code;
ALTER TABLE fashion_products DROP COLUMN IF EXISTS commission_amount;
```

However, this should not be necessary as the migration is non-destructive and backward-compatible.

## Support

If you encounter any issues:
1. Check that the migration script ran without errors
2. Verify the Supabase connection is working
3. Check that you have proper database permissions
4. Review the console for any error messages
