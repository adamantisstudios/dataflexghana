# Agent Publishing Permissions - Troubleshooting Guide

## Issues Fixed

### 1. Permission Toggle Not Persisting (PGRST204 Error)

**Problem:** When admins toggled the "Can Publish Products" switch for agents, the permission would unchecked/reset when searching or refreshing.

**Root Cause:** Direct Supabase database updates were hitting schema cache issues (PGRST204 error), causing the operation to fail silently while the UI showed the change temporarily.

**Solution:** Updated the `togglePublishPermission` function in `AgentManagementTab.tsx` to use the dedicated API endpoint (`/api/admin/agents/[id]/publish-permission`) instead of direct database queries. This approach:
- Uses proper Supabase admin credentials server-side
- Avoids schema cache issues
- Provides better error handling
- Ensures database consistency

**How to Test:**
1. Go to Admin Dashboard → Agent Management Tab
2. Search for an agent
3. Click "View Details"
4. Toggle "Can Publish Products" switch ON
5. Close the dialog
6. Search for the same agent again
7. Click "View Details" - permission should still be ON

### 2. Product Image Upload Failing (onProgress Callback Error)

**Problem:** When agents tried to upload product images, they got error: `TypeError: onProgress is not a function`

**Root Cause:** The callback validation was happening after the file upload completed, but the error was being thrown in the wrong place in the execution flow.

**Solution:** Updated `wholesale-image-upload.ts` to:
- Move the progress callback to after the URL retrieval (not before)
- Add try-catch around the callback invocation to prevent callback errors from breaking the upload
- Ensure the upload completes successfully even if the callback fails

**How to Test:**
1. Log in as an agent with publish permission
2. Go to "Publish Products" page
3. Try uploading product images
4. Images should upload successfully without errors
5. Progress bar should show and complete

### 3. Agent Permissions Not Refreshing in Publish Products Page

**Problem:** Even after admin granted permissions, agents couldn't access the publish products page without logging out/in.

**Root Cause:** The permission check was only happening on initial page load, not refreshing with latest database values.

**Solution:** Enhanced the permission check in `publish-products/page.tsx`:
- Added console logging to track permission verification
- Improved error handling and messaging
- Clearer feedback on why access is denied
- Better validation of agent data from database

**How to Test:**
1. Admin grants agent publishing permission via Agent Management tab
2. Agent opens "Publish Products" page immediately (no logout needed)
3. Permission should be recognized and page should load
4. Agent can now upload and submit products

## Database Verification

To verify the `can_publish_products` column exists in your Supabase database:

```sql
-- Check the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agents' AND column_name = 'can_publish_products';

-- See which agents have publish permission
SELECT id, full_name, can_publish_products 
FROM agents 
WHERE can_publish_products = true;
```

## API Endpoint Details

### Update Agent Publishing Permission

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
  "message": "Publishing permission updated",
  "agent": {
    "id": "agent-uuid",
    "full_name": "Agent Name",
    "can_publish_products": true
  }
}
```

**Error Responses:**
- 400: Missing agent ID or invalid boolean value
- 404: Agent not found
- 500: Database error

## Workflow After Fixes

### For Admins:
1. Navigate to Agent Management tab
2. Search for desired agent
3. Click "View Details"
4. Toggle "Can Publish Products" switch
5. Permission updates immediately via API
6. Permission persists across page refreshes and searches

### For Agents:
1. Access the platform with agent credentials
2. Navigate to "Publish Products" page
3. If permission granted: See product submission form
4. Upload images: Click upload button, select images, wait for completion
5. Fill form and submit products for admin review

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Permission still shows as OFF after toggle | API call failed | Check browser console for error, try toggle again |
| Image upload fails with callback error | Callback not provided | Ensure progressCallback is defined in all upload calls |
| Agent can't access publish page after permission granted | Permission not refreshed | Agent needs to refresh page or log out/in |
| PGRST204 error in console | Outdated schema cache | Use API endpoint (now implemented) instead of direct DB |

## Files Modified

1. **components/admin/tabs/AgentManagementTab.tsx**
   - Updated `togglePublishPermission` to use API endpoint

2. **lib/wholesale-image-upload.ts**
   - Fixed `onProgress` callback error handling
   - Moved callback execution to safer location

3. **app/agent/publish-products/page.tsx**
   - Enhanced permission check logging
   - Improved error messages
   - Better validation flow

## Verification Checklist

- [ ] Admin can toggle publishing permission without PGRST204 errors
- [ ] Permission toggle persists after page refresh
- [ ] Permission toggle persists after searching for agent
- [ ] Agent can upload images without "onProgress is not a function" error
- [ ] Agent with permission can access Publish Products page
- [ ] Agent without permission sees access denied message
- [ ] Product submission creates product with `created_by` = agent ID
- [ ] Products appear in Admin Product Management with agent name

