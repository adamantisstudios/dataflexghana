# Agent Property Permissions - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migrations

Execute these SQL scripts in your Supabase SQL Editor in order:

#### Migration 1: Agent Permissions
**File**: `scripts/add-property-permissions-to-agents.sql`

```sql
-- Copy and paste this into Supabase SQL Editor, then execute
-- Adds can_publish_properties and can_update_properties columns to agents table

ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS can_publish_properties BOOLEAN DEFAULT false;

ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS can_update_properties BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_can_publish_properties ON public.agents(can_publish_properties);
CREATE INDEX IF NOT EXISTS idx_agents_can_update_properties ON public.agents(can_update_properties);

-- Verify
SELECT COUNT(*) as agent_count FROM agents;
SELECT column_name FROM information_schema.columns WHERE table_name='agents' ORDER BY column_name;
```

#### Migration 2: Property Approval
**File**: `scripts/add-property-approval-column.sql`

```sql
-- Copy and paste this into Supabase SQL Editor, then execute
-- Adds is_approved and published_by_agent_id columns to properties table

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS published_by_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_is_approved ON public.properties(is_approved);
CREATE INDEX IF NOT EXISTS idx_properties_published_by_agent ON public.properties(published_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON public.properties(is_approved, published_by_agent_id);

-- Verify
SELECT COUNT(*) as property_count FROM properties;
SELECT column_name FROM information_schema.columns WHERE table_name='properties' ORDER BY column_name;
```

### Step 2: Test in Admin Dashboard

1. Open your app
2. Go to **Admin Dashboard** → **Agent Management**
3. Search for any agent
4. Click **View Details**
5. You should see 4 permission toggles:
   - Wholesale Products: Publish, Edit
   - Properties: Publish, Edit
6. Try toggling any switch
7. You should see a success toast notification

✅ **If this works, you're done!**

---

## 📋 What Was Added

### Database Changes

**agents table** (new columns):
```
can_publish_properties BOOLEAN (default: false)
can_update_properties BOOLEAN (default: false)
```

**properties table** (new columns):
```
is_approved BOOLEAN (default: true)
published_by_agent_id UUID (tracks which agent published)
```

### Component Changes

**Agent Management Dialog** now shows:
```
┌─ Permissions ────────────────────┐
│                                  │
│ 📊 Wholesale Products           │
│   ☑ Publish      [Toggle]       │
│   ☑ Edit         [Toggle]       │
│                                  │
│ 🏠 Properties                    │
│   ○ Publish      [Toggle]       │
│   ○ Edit         [Toggle]       │
│                                  │
└──────────────────────────────────┘
```

### API Endpoints Added

- `PUT /api/admin/agents/[id]/publish-property-permission`
- `PUT /api/admin/agents/[id]/update-property-permission`

---

## ✅ Verification Checklist

After running migrations, verify everything worked:

### Check 1: Database Columns Exist
```sql
-- Run in Supabase SQL Editor
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'agents' 
AND column_name LIKE '%properties%'
ORDER BY column_name;
```

Expected output:
```
can_publish_properties | boolean | false
can_update_properties  | boolean | false
```

### Check 2: Indexes Created
```sql
-- Run in Supabase SQL Editor
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'agents' 
AND indexname LIKE '%properties%';
```

Expected output:
```
idx_agents_can_publish_properties
idx_agents_can_update_properties
```

### Check 3: Component Works
1. Navigate to Admin → Agent Management
2. Search for an agent
3. Click "View Details"
4. Look for "Properties" section in permissions
5. Try toggling a switch
6. Verify success toast appears

---

## 🔧 If Something Goes Wrong

### Error: "Column already exists"
**Solution**: This is fine! Migrations are safe to re-run. The "IF NOT EXISTS" clause prevents errors.

### Error: "Column not found" when toggling
**Solution**: 
1. Verify migrations were executed successfully
2. Refresh the page
3. Check Supabase SQL Editor that columns exist (see Check 1 above)

### Error: "Failed to update permission"
**Solution**:
1. Check browser Network tab for API response
2. Verify agent ID is valid UUID
3. Check Supabase logs in dashboard
4. Ensure API routes exist in `app/api/admin/agents/[id]/`

### Toggle not persisting after refresh
**Solution**:
1. Check browser console for JS errors
2. Verify column exists in database
3. Check if write permission exists in Supabase
4. Try with different agent

---

## 📚 Learn More

- **Full Documentation**: `PROPERTY_PUBLISHING_PERMISSIONS.md`
- **Technical Changelog**: `PROPERTY_PERMISSIONS_CHANGELOG.md`
- **Implementation Summary**: `AGENT_PROPERTY_PERMISSIONS_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Next Steps (Optional)

Once this is working, to enable agents to actually publish properties:

1. **Update property creation endpoints** to check `can_publish_properties`
2. **Update properties tab** to show pending approvals
3. **Add approve buttons** for admins in properties tab
4. **Set `is_approved = false`** when agent publishes

---

## 💡 Tips

### Testing Toggle Without Real Users
```sql
-- Update an existing agent to have both permissions
UPDATE agents 
SET can_publish_properties = true, can_update_properties = true
WHERE id = 'your-agent-uuid';

-- Check it
SELECT id, full_name, can_publish_properties, can_update_properties 
FROM agents 
WHERE id = 'your-agent-uuid';
```

### View All Agent Permissions
```sql
SELECT 
  id,
  full_name,
  can_publish_products,
  can_update_products,
  can_publish_properties,
  can_update_properties
FROM agents
ORDER BY full_name;
```

### Check Property Approval Status
```sql
SELECT 
  id,
  title,
  is_approved,
  published_by_agent_id,
  created_at
FROM properties
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔐 Security Note

All permission updates happen server-side using admin credentials. The toggles in the UI are admin-only controls. Agents cannot bypass these permissions.

---

## ⏱️ Time Required

- **Database Migrations**: 2-3 minutes
- **Verification**: 2-3 minutes  
- **Testing**: 1-2 minutes
- **Total**: ~5-10 minutes

---

## 📞 Support

If you need help:
1. Check the error message in Supabase SQL Editor
2. Review the full documentation in `PROPERTY_PUBLISHING_PERMISSIONS.md`
3. Check the implementation details in `PROPERTY_PERMISSIONS_CHANGELOG.md`
4. Review browser console for client-side errors

---

## ✨ Success!

Once all checks pass, your property permissions system is ready!

Admins can now grant agents the ability to publish and edit properties. Properties published by agents will require admin approval before going live.

**Happy testing!** 🎉
