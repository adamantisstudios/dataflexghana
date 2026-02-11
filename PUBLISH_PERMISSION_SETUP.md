# Agent Product Publishing Permission System

This guide explains how to set up and use the new agent product publishing permission system.

## Overview

The publishing permission system allows admins to:
- Grant/revoke product publishing permissions to agents
- Manage who can publish products in the wholesale/marketplace system
- Track publishing permissions in the agent details view
- Control agent access to publishing features

## Database Changes

### Adding the Column

A migration script has been created to safely add the `can_publish_products` column to the agents table.

**File:** `scripts/add-publish-permission-column.sql`

**To apply the migration:**

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the contents of `scripts/add-publish-permission-column.sql`
5. Run the query

**What it does:**
- Adds `can_publish_products` BOOLEAN column (default FALSE)
- Creates indexes for performance
- Adds documentation comments
- Is safe to run multiple times (uses IF NOT EXISTS)

### Column Details

```sql
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS can_publish_products BOOLEAN DEFAULT FALSE;
```

- **Column Name:** `can_publish_products`
- **Type:** BOOLEAN
- **Default:** FALSE (agents cannot publish by default)
- **Indexed:** Yes (for performance)

## API Endpoints

### Publish Permission Endpoint

**Endpoint:** `PUT /api/admin/agents/[id]/publish-permission`

**Request Body:**
```json
{
  "can_publish_products": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Agent granted publish permission",
  "agent": {
    "id": "agent-uuid",
    "full_name": "Agent Name",
    "can_publish_products": true,
    "updated_at": "2026-02-09T12:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "error": "Agent not found"
}
```

**GET /api/admin/agents/[id]/publish-permission**

Retrieves the current publishing permission status for an agent.

## UI Components

### Agent Management Tab

**Location:** `components/admin/tabs/AgentManagementTab.tsx`

Features:
- Search agents by name, phone, or ID
- View agent details in a modal dialog
- Toggle publishing permission with a switch control
- Real-time updates to agent records
- Success/error toast notifications

**Publishing Permission Toggle:**
```tsx
<Switch
  checked={selectedAgent.can_publish_products || false}
  onCheckedChange={(checked) => togglePublishPermission(selectedAgent, checked)}
  disabled={operationLoading}
/>
```

## Usage Workflow

### Granting Publishing Permission

1. Navigate to **Admin > Dashboard**
2. Go to **Agent Management** tab
3. Search for the agent by name, phone, or ID
4. Click **View Details** on the agent card
5. In the details dialog, find "Can Publish Products"
6. Toggle the switch to enable publishing
7. Confirmation toast will appear

### Revoking Publishing Permission

1. Follow steps 1-4 above
2. Toggle the switch to disable publishing
3. Agent will no longer be able to publish products

### Checking Permission Status

- In Agent List: View agent details to see current permission status
- In API: Call `GET /api/admin/agents/[id]/publish-permission` to check status

## Integration Points

### Frontend

The system integrates with:
- **Agent Dashboard:** Checks permission before showing publish options
- **Product Management:** Restricts publishing if permission is false
- **Admin Panel:** Provides admin controls for permission management

### Backend

The system checks the `can_publish_products` field when:
- Agent attempts to publish products
- Admin retrieves agent details
- System generates permission reports

## Error Handling

### Common Errors

**400 Bad Request**
- Missing required field
- Invalid boolean value
- Malformed request body

**404 Not Found**
- Agent ID does not exist
- Check agent UUID is correct

**500 Internal Server Error**
- Database connection issue
- Check Supabase environment variables

### Debugging

Check browser console for:
- API response status codes
- Error messages from server
- Toast notifications for user feedback

## Security Considerations

1. **Permission Checks:** Always verify admin authentication before allowing permission changes
2. **Audit Trail:** Consider logging permission changes for compliance
3. **Scope:** Only admins can grant/revoke permissions
4. **Defaults:** New agents default to false (cannot publish)

## Testing

### Test Case 1: Grant Permission
1. Search for an agent
2. View their details
3. Toggle publish permission ON
4. Verify toast shows success
5. Close and re-open to confirm persistence

### Test Case 2: Revoke Permission
1. Open details for agent with permission
2. Toggle publish permission OFF
3. Verify agent can no longer publish

### Test Case 3: API Test
```bash
# Check permission
curl -X GET http://localhost:3000/api/admin/agents/[AGENT_ID]/publish-permission

# Update permission
curl -X PUT http://localhost:3000/api/admin/agents/[AGENT_ID]/publish-permission \
  -H "Content-Type: application/json" \
  -d '{"can_publish_products": true}'
```

## Future Enhancements

- Bulk permission updates for multiple agents
- Permission audit logs
- Conditional publishing (based on tier, compliance status)
- Permission expiration dates
- Publishing quotas per agent
- Detailed publishing analytics

## Support & Troubleshooting

### Issue: Column doesn't exist after migration

**Solution:**
1. Check if migration script ran successfully
2. Verify no SQL errors in Supabase console
3. Manually inspect agents table in Supabase
4. Run migration again if needed

### Issue: 400 error when updating permission

**Solution:**
1. Verify request body format
2. Check agent ID is valid UUID
3. Ensure request includes `can_publish_products` boolean
4. Check browser console for detailed error

### Issue: Permission toggle not working in UI

**Solution:**
1. Check browser console for JavaScript errors
2. Verify API endpoint is accessible
3. Confirm Supabase connection is active
4. Check network tab for API response status

## Files Modified

- `scripts/add-publish-permission-column.sql` - Database migration
- `app/api/admin/agents/[id]/publish-permission/route.ts` - New API endpoint
- `components/admin/tabs/AgentManagementTab.tsx` - UI controls (already present)
- `app/api/admin/agents/[id]/summary/route.ts` - Fixed summary endpoint

## Deployment Checklist

- [ ] Run database migration script
- [ ] Verify column exists in Supabase
- [ ] Deploy API changes
- [ ] Deploy frontend changes
- [ ] Test permission toggle in admin panel
- [ ] Test API endpoints
- [ ] Monitor error logs for issues
