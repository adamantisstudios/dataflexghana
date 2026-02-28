# Agent Property Permissions System - Pre-Deployment Checklist

## Database Setup

- [ ] Execute: `scripts/add-property-permissions-to-agents.sql`
  - Adds `can_publish_properties` BOOLEAN to agents table
  - Adds `can_update_properties` BOOLEAN to agents table
  - Creates indexes on both columns

- [ ] Execute: `scripts/add-property-approval-column.sql`
  - Adds `is_approved` BOOLEAN to properties table
  - Adds `published_by_agent_id` UUID to properties table
  - Ensures properties start as unapproved

- [ ] Verify in Supabase:
  ```sql
  SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'agents' AND column_name LIKE '%properties%';
  
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'properties' AND column_name IN ('is_approved', 'published_by_agent_id');
  ```

## Code Review

### Admin Components
- [ ] `components/admin/tabs/AgentManagementTab.tsx`
  - [ ] Agent interface includes new permission fields
  - [ ] Select queries include property permission columns
  - [ ] Four toggles visible (2 for products, 2 for properties)
  - [ ] Toggle functions handle property permissions
  - [ ] API endpoints correctly called for property permissions

### Agent Components
- [ ] `components/agent/AgentEditProperties.tsx`
  - [ ] Component logic mirrors AgentEditProducts exactly
  - [ ] Read-only mode works (isReadOnly = !canUpdateProperties)
  - [ ] Form submission sets `is_approved: false`
  - [ ] Delete always available regardless of permissions
  - [ ] Grid layout responsive (1/2/3 columns)
  - [ ] Badge shows Pending/Approved correctly
  - [ ] Search and filters work properly

- [ ] `app/agent/publish-properties/page.tsx`
  - [ ] Auth check redirects to login if needed
  - [ ] Agent approval check works
  - [ ] Permission check shows "Contact Admin" if needed
  - [ ] Component receives only `canUpdateProperties` prop
  - [ ] All three alert boxes display correctly

- [ ] `components/agent/AgentMenuCards.tsx`
  - [ ] "Publish Properties" menu item added
  - [ ] Home icon imported and used
  - [ ] Gradient color correct (amber)
  - [ ] onClick handler routes correctly

### API Routes
- [ ] `app/api/admin/agents/[id]/publish-property-permission/route.ts`
  - [ ] Validates admin authorization
  - [ ] Updates `can_publish_properties` field
  - [ ] Returns success/error JSON response

- [ ] `app/api/admin/agents/[id]/update-property-permission/route.ts`
  - [ ] Validates admin authorization
  - [ ] Updates `can_update_properties` field
  - [ ] Returns success/error JSON response

### Type Definitions
- [ ] `lib/supabase.ts`
  - [ ] Agent interface includes:
    - [ ] can_publish_properties?: boolean
    - [ ] can_update_properties?: boolean
    - [ ] can_publish_properties?: boolean
    - [ ] can_update_properties?: boolean

## Functionality Testing

### Admin Permission Management
- [ ] Log in as admin
- [ ] Navigate to "Agent Management" tab
- [ ] Find a test agent
- [ ] Click to open agent details
- [ ] Verify 4 toggles visible:
  - [ ] Wholesale Products → Publish
  - [ ] Wholesale Products → Edit
  - [ ] Properties → Publish
  - [ ] Properties → Edit
- [ ] Toggle "Properties → Publish" OFF and ON
  - [ ] Toast notification appears
  - [ ] Toggle state updates immediately
  - [ ] Refresh page - state persists
- [ ] Toggle "Properties → Edit" OFF and ON
  - [ ] Toast notification appears
  - [ ] Toggle state updates immediately
  - [ ] Refresh page - state persists
- [ ] Verify that toggling products doesn't affect properties and vice versa

### Agent With No Permissions
- [ ] Set agent with:
  - [ ] can_publish_properties = false
  - [ ] can_update_properties = false
- [ ] Log in as this agent
- [ ] Try to navigate to "/agent/publish-properties"
- [ ] Should see: "You don't have permission to publish or edit properties"
- [ ] Should NOT see AgentEditProperties component
- [ ] Menu item should exist but navigate to error page

### Agent With Publish Only
- [ ] Set agent with:
  - [ ] can_publish_properties = true
  - [ ] can_update_properties = false
- [ ] Log in as this agent
- [ ] Navigate to "Publish Properties"
- [ ] Should see alert: "✓ You have permission to publish new properties"
- [ ] Should NOT see alert about edit permission
- [ ] AgentEditProperties should render
- [ ] Properties should be in **smaller cards** (read-only mode)
- [ ] Verify NO Edit/Submit buttons visible
- [ ] Verify Delete button IS visible
- [ ] Click Delete - should work
- [ ] Try to click Edit (shouldn't exist) - should fail

### Agent With Edit Only
- [ ] Set agent with:
  - [ ] can_publish_properties = false
  - [ ] can_update_properties = true
- [ ] Should see alert: "✓ You have permission to edit your properties"
- [ ] Properties in read-only mode (smaller cards)
- [ ] Delete button only
- [ ] Verify Edit/Submit buttons NOT visible

### Agent With Both Permissions
- [ ] Set agent with:
  - [ ] can_publish_properties = true
  - [ ] can_update_properties = true
- [ ] Log in as this agent
- [ ] Navigate to "Publish Properties"
- [ ] Should see both permission alerts
- [ ] Properties should be in **larger cards** (editable mode)
- [ ] Verify Edit button visible
- [ ] Verify Submit button visible
- [ ] Verify Delete button visible
- [ ] Click Edit on a property:
  - [ ] Dialog opens
  - [ ] Fields populated correctly
  - [ ] Can modify fields
  - [ ] Submit button works
- [ ] After submission:
  - [ ] Toast says "Property submitted for admin approval"
  - [ ] Dialog closes
  - [ ] Property reloads
  - [ ] Badge shows "Pending" (amber)
- [ ] Edit again and Submit:
  - [ ] Property still shows "Pending"
  - [ ] No error occurs

### Approval Workflow
- [ ] Log in as admin
- [ ] Navigate to Properties tab
- [ ] Find properties with is_approved = false
- [ ] Click Approve on a property
- [ ] Navigate back to agent view (publish-properties)
- [ ] Verify property now shows "Approved" badge (green)
- [ ] Agent can still edit and resubmit
- [ ] After resubmit, badge reverts to "Pending"
- [ ] Admin approves again - "Approved" badge returns

### Filtering & Search
- [ ] Properties page should show filters:
  - [ ] Search by title/location
  - [ ] Filter by category (All, Houses for Sale, etc.)
  - [ ] Filter by status (All, Pending, Approved)
- [ ] Search should work (hide non-matching properties)
- [ ] Category filter should work
- [ ] Status filter should work
- [ ] Multiple filters combined should work

### Error Handling
- [ ] Try to submit property with empty fields
  - [ ] See form validation error
- [ ] Delete a property
  - [ ] Confirm dialog appears
  - [ ] On confirm, property deleted
  - [ ] Toast confirms deletion
- [ ] Manually edit database to set is_approved = null
  - [ ] Should not crash UI
  - [ ] Should treat as false (pending)
- [ ] Network disconnect during submit
  - [ ] Error toast appears
  - [ ] User can retry

## Browser Compatibility

- [ ] Chrome/Chromium - Full functionality
- [ ] Firefox - Full functionality
- [ ] Safari - Full functionality
- [ ] Mobile Chrome - Responsive layout works
- [ ] Mobile Safari - Responsive layout works

## Performance

- [ ] Load agent dashboard - no lag
- [ ] Open Properties page - loads within 2 seconds
- [ ] Filter properties - instant feedback
- [ ] Edit and submit - completes within 3 seconds
- [ ] Admin toggle permissions - instant update (within 1 second)

## Security

- [ ] Admin endpoints require auth
  - [ ] Try accessing API without token - should fail
  - [ ] Try accessing with wrong agent ID - should fail
- [ ] Agent can only see their own properties
  - [ ] Try to query properties by different agent ID
  - [ ] Should not see other agents' properties
- [ ] Agent cannot bypass permission checks
  - [ ] Try to edit property without permission (client-side)
  - [ ] Try calling API without permission (server-side)

## No Breaking Changes

- [ ] Existing wholesale products functionality unchanged
- [ ] All existing agents still have their permission settings
- [ ] Admin dashboard still works
- [ ] Properties tab still works
- [ ] No console errors or warnings
- [ ] Network requests show no 500 errors

## Documentation

- [ ] Read `FINAL_PROPERTY_VERIFICATION.md` - understand complete system
- [ ] Read `PROPERTY_PERMISSIONS_FINAL_SUMMARY.md` - implementation overview
- [ ] Read `AGENT_PROPERTIES_PUBLISHING_GUIDE.md` - agent user guide

## Final Sign-Off

- [ ] All code changes reviewed by developer
- [ ] All tests passed locally
- [ ] Database migrations executed
- [ ] No errors in Supabase logs
- [ ] No errors in browser console
- [ ] Tested on mobile device
- [ ] All permission scenarios verified
- [ ] Performance acceptable
- [ ] Security measures in place

## Deployment Steps

1. [ ] Pull latest code changes to production
2. [ ] Execute SQL migration scripts in Supabase
3. [ ] Verify database schema updated
4. [ ] Deploy application code
5. [ ] Test immediately in production
6. [ ] Monitor for errors in first hour
7. [ ] Notify admins of new property permissions feature

## Post-Deployment Verification

- [ ] Admin can see property permission toggles
- [ ] Agents with permissions can publish properties
- [ ] Agents without permissions see access error
- [ ] Properties appear as pending for admin approval
- [ ] Admin can approve properties
- [ ] Agents see approved badge after admin approval

## Rollback Plan (if needed)

If critical issues found:
1. [ ] Revert code changes (git rollback)
2. [ ] Database schema changes are backward compatible (can keep)
3. [ ] No data loss on rollback
4. [ ] Notify users of temporary feature unavailability

---

**Status**: Ready for deployment once all checkboxes completed

**Last Updated**: [Current Date]

**Deployed**: [Deployment Date]
