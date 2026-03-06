# Agent Property Publishing Permissions System

## Overview

This system allows admins to grant property publishing and editing permissions to agents. When an agent with these permissions publishes or edits a property, the property remains unpublished (`is_approved: false`) pending admin approval in the Properties tab.

## Features

- **Admin Controls**: Admins grant property publishing/editing permissions via Agent Management tab
- **Four Permission Toggles**: Separate toggles for wholesale products and properties (publish + edit)
- **Approval Workflow**: Properties published by agents require admin approval before going live
- **Audit Trail**: Tracks which agent published each property via `published_by_agent_id`

## Database Schema

### Agents Table Columns

```sql
-- Existing columns
can_publish_products BOOLEAN DEFAULT false
can_update_products BOOLEAN DEFAULT false

-- New columns (added via migration script)
can_publish_properties BOOLEAN DEFAULT false
can_update_properties BOOLEAN DEFAULT false
```

### Properties Table Columns

```sql
-- Existing columns
id UUID PRIMARY KEY
title VARCHAR(255) NOT NULL
price DECIMAL(12,2) NOT NULL
currency VARCHAR(3) DEFAULT 'GHS'
category VARCHAR(100) NOT NULL
status VARCHAR(20) DEFAULT 'Published'
created_at TIMESTAMP
updated_at TIMESTAMP

-- New columns (added via migration script)
is_approved BOOLEAN DEFAULT true
published_by_agent_id UUID REFERENCES agents(id)
```

**Important**: By default, `is_approved = true` for existing properties. When an agent publishes a new property with permissions, it will be created with `is_approved = false`.

## Implementation Details

### Agent Management UI

Located in: `components/admin/tabs/AgentManagementTab.tsx`

**Permissions Section**:
- **Wholesale Products** section
  - Switch: "Publish" (can_publish_products)
  - Switch: "Edit" (can_update_products)
- **Properties** section
  - Switch: "Publish" (can_publish_properties)
  - Switch: "Edit" (can_update_properties)

Each toggle updates the agent record via API calls.

### API Routes

#### Publish Property Permission
**Route**: `PUT /api/admin/agents/[id]/publish-property-permission`

**File**: `app/api/admin/agents/[id]/publish-property-permission/route.ts`

Request body:
```json
{
  "can_publish_properties": true/false
}
```

Response:
```json
{
  "success": true,
  "message": "Agent granted property publishing permission",
  "agent": {
    "id": "uuid",
    "full_name": "Agent Name",
    "can_publish_properties": true,
    "updated_at": "2026-02-27T12:00:00Z"
  }
}
```

#### Update Property Permission
**Route**: `PUT /api/admin/agents/[id]/update-property-permission`

**File**: `app/api/admin/agents/[id]/update-property-permission/route.ts`

Request body:
```json
{
  "can_update_properties": true/false
}
```

Response:
```json
{
  "success": true,
  "message": "Agent granted property editing permission",
  "agent": {
    "id": "uuid",
    "full_name": "Agent Name",
    "can_update_properties": true,
    "updated_at": "2026-02-27T12:00:00Z"
  }
}
```

## Admin Approval Workflow

### Properties Tab
In the Properties tab, admins will see:
1. All properties with filters for approval status
2. Toggle or button to approve/reject agent-published properties
3. Shows which agent published the property (via published_by_agent_id)

**To implement approval**:
- Filter properties where `is_approved = false`
- Show agent name and details
- Provide approve/reject buttons
- Update `is_approved` field when approving

### Agent Publishing Flow
When an agent with `can_publish_properties = true` publishes a property:
1. Set `published_by_agent_id` to the agent's ID
2. Set `is_approved = false` (CRITICAL)
3. Set `status = 'Unpublished'` or similar unpublished state
4. Property becomes visible to admin only in Properties tab pending approval
5. When admin approves: Set `is_approved = true` and `status = 'Published'`

## User Permissions Model

```
┌─────────────────────────────────────────────┐
│                  Admin                      │
│  • Full access to Properties tab            │
│  • Can manage agent permissions             │
│  • Can approve/reject agent properties      │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│          Agent (if permissions granted)    │
│  • Can publish properties (if allowed)      │
│  • Can edit properties (if allowed)         │
│  • Properties are unpublished until admin   │
│    approves in Properties tab              │
└─────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Database Migration

Run the following SQL migration scripts in order:

**Step 1**: Add agent permission columns
```bash
# File: scripts/add-property-permissions-to-agents.sql
# This adds can_publish_properties and can_update_properties to agents table
```

**Step 2**: Add property approval columns
```bash
# File: scripts/add-property-approval-column.sql
# This adds is_approved and published_by_agent_id to properties table
```

### 2. Component Updates

The Agent Management tab has been updated with:
- New Agent interface fields for property permissions
- Two new toggle functions: `togglePublishPropertyPermission` and `toggleUpdatePropertyPermission`
- UI showing 4 toggles organized in "Wholesale Products" and "Properties" sections
- Existing permission toggles preserved for backward compatibility

### 3. API Route Creation

Two new API routes have been created:
- `app/api/admin/agents/[id]/publish-property-permission/route.ts`
- `app/api/admin/agents/[id]/update-property-permission/route.ts`

### 4. Properties Tab Integration (To be implemented)

The Properties tab needs to be updated to:
- Display approval status (approved/pending)
- Show which agent published unapproved properties
- Provide approve/reject functionality
- Filter properties by approval status

## Testing Checklist

- [ ] Verify agent permission columns added to database
- [ ] Verify property approval columns added to database
- [ ] Test toggling publish permission for an agent
- [ ] Test toggling edit permission for an agent
- [ ] Verify permissions persist in agent record
- [ ] Create test agent and grant property permissions
- [ ] (When integrated) Verify agent can publish properties
- [ ] (When integrated) Verify property is unpublished until approved
- [ ] (When integrated) Test approving property in Properties tab
- [ ] (When integrated) Verify approved property goes live

## Troubleshooting

### Columns Not Found Error
If you get "column not found" errors, ensure the SQL migration scripts have been run in your Supabase database.

### Permissions Not Updating
1. Check browser console for API errors
2. Verify the API routes exist in `app/api/admin/agents/[id]/`
3. Ensure agent ID is valid UUID format
4. Check Supabase table columns exist

### Properties Not Appearing
1. Ensure `is_approved` column exists in properties table
2. Verify `published_by_agent_id` is properly set when agent publishes
3. Check database indexes are created for performance

## Future Enhancements

1. **Bulk Approvals**: Approve multiple properties at once
2. **Approval Notifications**: Notify agents when properties are approved/rejected
3. **Rejection Reasons**: Add reason field for rejected properties
4. **Audit Logging**: Track all approval/rejection actions
5. **Auto-Approval Rules**: Allow admins to set auto-approval rules based on agent rating
6. **Agent Performance Metrics**: Track approval rates per agent

## Files Modified/Created

- **Modified**: `components/admin/tabs/AgentManagementTab.tsx`
  - Added property permission fields to Agent interface
  - Added two new toggle functions
  - Updated UI with 4 permission toggles

- **Created**: `app/api/admin/agents/[id]/publish-property-permission/route.ts`
  - Handles publish property permission updates

- **Created**: `app/api/admin/agents/[id]/update-property-permission/route.ts`
  - Handles edit property permission updates

- **Created**: `scripts/add-property-permissions-to-agents.sql`
  - Database migration for agent permission columns

- **Created**: `scripts/add-property-approval-column.sql`
  - Database migration for property approval columns

## Support

For issues or questions, refer to:
1. Check database schema: `SELECT * FROM agents LIMIT 1;` (should show new columns)
2. Check properties schema: `SELECT * FROM properties LIMIT 1;` (should show new columns)
3. Review API responses in browser Network tab
4. Check Supabase logs for database errors
