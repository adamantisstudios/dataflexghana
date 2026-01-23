# Commission Rate Precision Fix - Step by Step Instructions

## Problem
- Commission rates were being truncated from `numeric(5,2)` to 2 decimal places
- Example: Setting 0.005 (0.5%) would be saved as 0.01 (1%)
- Views depending on the column prevented direct ALTER TABLE operations

## Solution
We've created a comprehensive safe migration that:
1. Drops ALL dependent views
2. Changes the column type to `numeric(10,6)` (supports 6 decimal places)
3. Recreates all views with proper precision

## Steps to Apply the Fix

### Step 1: Run the Migration Script
Go to the Vars section in v0 and navigate to your Supabase SQL editor, then:
1. Copy the entire contents of `scripts/043_comprehensive_commission_rate_fix.sql`
2. Paste it into your Supabase SQL editor
3. Click "Run" to execute

**This script will:**
- Drop all 9 dependent views safely
- Alter the commission_rate column to numeric(10,6)
- Recreate all views with proper calculations

### Step 2: Verify the Migration Worked
After running the script, check that:
- ✅ No error messages appear
- ✅ The SELECT statement at the end shows data with precise decimal places
- ✅ All data bundles are still accessible

### Step 3: Test Commission Calculations
1. Go to Admin > Data (Data Bundles tab)
2. Edit a bundle and set commission_rate to: `0.005` (this is 0.5%)
3. Verify in the form that it shows: `0.5000%` and `₵0.145` for a ₵29 bundle
4. Save the bundle
5. Reload the page - verify the value persists correctly

### Step 4: Check Agent Pages
Navigate to:
- **Admin > Agents > [Agent Name] > Data Orders** - Verify commission amounts display correctly
- **Admin > Agents > [Agent Name] > Wallet** - Verify earned commissions are calculated correctly
- **Admin > Agent Performance** - Verify commission summaries are accurate

## Key Changes Made
1. `scripts/043_comprehensive_commission_rate_fix.sql` - Safe migration script
2. `lib/commission-utils.ts` - New utility functions for consistent formatting
3. `components/admin/tabs/DataTab.tsx` - Enhanced validation for 6 decimal places

## What Gets Preserved
- All existing data and order records
- All commission calculations (recalculated with new precision)
- User data and references
- View functionality across the entire app

## Troubleshooting

### If you get an error about a different view:
The error message will tell you the view name. Add it to the DROP VIEW list in the migration script and try again.

### If commission amounts look wrong:
This is expected during testing. The new precision means rates like 0.005 will now correctly calculate to ₵0.145 instead of ₵0.29.

### If you need to rollback:
Simply re-create the column as `numeric(5,2)` and re-run the migration scripts that created your views originally.
