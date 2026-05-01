# Salon & Beauty Services - Database Setup Guide

## Quick Start

### Step 1: Access Supabase SQL Editor
1. Log into your Supabase project
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**

### Step 2: Copy the SQL Script
1. Open the file: `/scripts/001_create_salon_tables.sql`
2. Copy all content (Ctrl+A, Ctrl+C)

### Step 3: Paste and Execute
1. Paste the SQL into the Supabase editor (Ctrl+V)
2. Click the **"Run"** button (or Ctrl+Enter)
3. Wait for the script to complete

### Step 4: Verify Tables Were Created
1. Go to **Table Editor** in Supabase
2. Verify these tables exist:
   - `salon_categories` ✅
   - `salon_services` ✅
   - `salon_bookings` ✅
   - `salon_locations` ✅

## What the Script Creates

### 1. salon_categories
8 predefined beauty service categories:
- Braiding Services
- Hair Styling
- Hair Care & Treatment
- Nail Services
- Makeup Services
- Massage & Spa
- Waxing & Epilation
- Special Services

### 2. salon_locations
117 Accra suburbs and towns organized by region:
- Central Accra: 34 locations
- Western Accra: 22 locations
- Northern Accra: 27 locations
- Eastern & Coastal Accra: 17 locations

### 3. salon_services
Table for storing beauty services with:
- Service details (name, code, description)
- Pricing (base & express)
- Duration and category
- Provider information
- Image URLs
- Status tracking

Includes 4 sample services for testing.

### 4. salon_bookings
Table for storing client booking requests with:
- Service reference
- Client information (name, WhatsApp)
- Booking preferences (date, time, location)
- Status tracking
- Timestamps

## Features Enabled

### Security (RLS)
- Row Level Security enabled on all tables
- Public read access to services, categories, locations
- Public create/read for bookings (for clients)
- Ready for admin authentication integration

### Performance
- Indexes created on frequently queried columns:
  - `idx_salon_services_category_id`
  - `idx_salon_services_status`
  - `idx_salon_bookings_service_id`
  - `idx_salon_bookings_status`
  - `idx_salon_bookings_created_at`
  - `idx_salon_locations_name`

### Data Integrity
- Foreign keys ensure referential integrity
- Cascade delete for related records
- Unique constraints on critical fields
- Timestamps on all records

## API Integration Ready

The script fully supports the API endpoints:
- `GET /api/salon/services` - Fetch services (with optional category filter)
- `POST /api/salon/services` - Create service
- `DELETE /api/salon/services/[id]` - Delete service
- `GET /api/salon/categories` - Fetch categories
- `POST /api/salon/categories` - Create category
- `GET /api/salon/bookings` - Fetch bookings (with filters)
- `POST /api/salon/bookings` - Create booking

## Troubleshooting

### Script Fails to Run
- Check for syntax errors (should be none)
- Verify you're connected to correct Supabase project
- Try running smaller sections first
- Check Supabase status page

### Tables Already Exist
- Script uses `CREATE TABLE IF NOT EXISTS`
- Safe to run multiple times
- Existing data won't be affected

### Need to Reset
To clear all salon data and start fresh:
```sql
DROP TABLE IF EXISTS salon_bookings CASCADE;
DROP TABLE IF EXISTS salon_services CASCADE;
DROP TABLE IF EXISTS salon_categories CASCADE;
DROP TABLE IF EXISTS salon_locations CASCADE;
```

Then re-run the full script.

## Next Steps After Setup

1. **Test the Connection**
   - Refresh the app
   - Check if salon page loads services

2. **Add Your Services**
   - Go to Admin Dashboard
   - Click "Salon & Beauty" tab
   - Click "Add Service"
   - Fill in details and submit

3. **Customize Categories** (optional)
   - Edit predefined categories if needed
   - Add new categories as required

4. **Upload Service Images**
   - Add image URLs to services
   - Test image display

5. **Test Booking Flow**
   - Visit `/salon` page
   - Search/filter services
   - Submit test booking
   - Verify WhatsApp message

## Database Backup

### Before Making Changes
```sql
-- Create a backup of your services
SELECT * INTO salon_services_backup FROM salon_services;
SELECT * INTO salon_bookings_backup FROM salon_bookings;
```

### Restore if Needed
```sql
-- Restore from backup
TRUNCATE salon_services CASCADE;
INSERT INTO salon_services SELECT * FROM salon_services_backup;
```

## Support

If you encounter any issues:
1. Check the Supabase documentation
2. Verify SQL syntax in the script
3. Ensure all tables are properly created
4. Check API route console logs for errors

---

**Database setup is complete and ready for use!**
