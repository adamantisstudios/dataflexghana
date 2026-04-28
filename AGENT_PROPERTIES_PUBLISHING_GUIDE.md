# Agent Property Publishing System - Complete Implementation Guide

## 🎯 Overview

This document explains the complete Agent Property Publishing System that allows approved agents with proper permissions to submit and edit properties. The system follows the same pattern as the wholesale product publishing system.

---

## ✅ What Has Been Implemented

### 1. **Agent Property Publishing Page** (`/agent/publish-properties`)
- **Location**: `/app/agent/publish-properties/page.tsx`
- **Features**:
  - Permission check: Only agents with `can_publish_properties = true` can access
  - Automatic user authentication and approval verification
  - Agent profile information loading
  - Permission status display with visual indicators
  - Access restricted message for unauthorized agents
  - Responsive design with proper error handling

### 2. **Agent Edit Properties Component**
- **Location**: `/components/agent/AgentEditProperties.tsx`
- **Features**:
  - Publish new properties form
  - Edit existing properties
  - Delete properties (if unpublished)
  - Filter properties by:
    - Search (title, location, description)
    - Category
    - Status (Pending Approval, Approved)
  - Property fields:
    - Title (required)
    - Description
    - Category (11 types)
    - Price (required)
    - Currency (GHS, USD, EUR)
    - Location (required)
    - Bedrooms
    - Bathrooms
    - Square Feet
    - Image URLs
  - Status badges (Pending/Approved)
  - Approval status tracking

### 3. **Agent Menu Integration**
- **Location**: `/components/agent/AgentMenuCards.tsx`
- **Update**: Added "Publish Properties" menu card
  - ID: `publish-properties`
  - Title: "Publish Properties"
  - Description: "List properties for sale or rent"
  - Icon: Building2
  - Gradient: Orange/Amber color
  - Direct link to `/agent/publish-properties`

### 4. **Admin Permission Control**
- **Location**: `/components/admin/tabs/AgentManagementTab.tsx`
- **Features**:
  - 4 permission toggles in agent details dialog:
    - Wholesale Products → Publish
    - Wholesale Products → Edit
    - Properties → Publish
    - Properties → Edit
  - Visual organization with section headers
  - Real-time permission updates via API calls
  - Toast notifications for user feedback

### 5. **API Routes for Permission Management**
- **Publish Properties Permission**: `/app/api/admin/agents/[id]/publish-property-permission/route.ts`
  - Updates `can_publish_properties` field
  - Server-side validation
  - Admin client for security
  
- **Edit Properties Permission**: `/app/api/admin/agents/[id]/update-property-permission/route.ts`
  - Updates `can_update_properties` field
  - Server-side validation
  - Admin client for security

### 6. **Database Schema Updates**
- **New Agent Columns**:
  - `can_publish_properties: boolean` (default: false)
  - `can_update_properties: boolean` (default: false)

- **Updated Properties Table**:
  - `is_approved: boolean` (default: false for agent submissions)
  - `published_by_agent_id: UUID` (tracks which agent submitted)
  - `status: text` ('Pending' when agent publishes, 'Published' after approval)

---

## 🔐 Access Control & Authorization

### **Three-Layer Permission System**

#### Layer 1: User Authentication
```typescript
// User must be authenticated
const { data: { user } } = await supabase.auth.getUser()
if (!user) router.push("/agent/login")
```

#### Layer 2: Agent Approval
```typescript
// Agent must be approved by admin to use platform
if (!agentData.isapproved) {
  setError("Your account has not been approved yet")
}
```

#### Layer 3: Property Permission
```typescript
// Agent must have explicit permission to publish properties
const canPublish = agentData.can_publish_properties || false
const canUpdate = agentData.can_update_properties || false

if (!canPublish && !canUpdate) {
  return <AccessRestrictedView />
}
```

---

## 📊 Property Publishing Workflow

### **Agent Side**

1. **Navigate to Property Publishing**
   - Click "Publish Properties" card on agent dashboard menu
   - Or visit `/agent/publish-properties` directly

2. **Permission & Status Checks**
   - System verifies agent is logged in
   - System verifies agent is approved
   - System checks `can_publish_properties` and `can_update_properties` permissions
   - Displays appropriate access message or form

3. **Publish New Property**
   - Click "Publish New Property" button (if `can_publish_properties = true`)
   - Fill in all property details:
     - Title, location, category, price, currency
     - Bedrooms, bathrooms, square feet
     - Full description with details
   - Submit form
   - Property is created with:
     - `is_approved: false` (starts unapproved)
     - `published_by_agent_id: <agent_id>` (tracks submitter)
     - `status: 'Pending'` (awaiting approval)

4. **Confirmation & Notification**
   - Toast message: "Property submitted successfully. Awaiting admin approval."
   - Property appears in agent's list with "Pending Approval" badge
   - Agent can edit until property is approved by admin

5. **Edit Existing Property**
   - Find property in agent's list
   - Click "Edit" button (if `can_update_properties = true`)
   - Modify details as needed
   - Submit changes
   - Property status remains pending until admin approves

### **Admin Side**

1. **View Pending Properties**
   - Admin checks "Properties" tab in admin panel
   - Filter by "Pending Approval" status
   - See agent name and submission details

2. **Review Property**
   - Open property details
   - Review all information
   - Check property images
   - Verify compliance with platform rules

3. **Approve or Reject**
   - Approve: Sets `is_approved: true`, updates status to "Published"
   - Reject: Can delete or mark as rejected

4. **Agent Notification**
   - Agent receives notification when property is approved
   - Approved properties appear with "Approved" badge

---

## 🎨 User Interface

### **Agent Publishing Page** (`/agent/publish-properties`)
- Header with page title and description
- Permission status alerts (green checkmarks if allowed)
- Access restriction alert (if no permissions)
- Embedded `AgentEditProperties` component

### **Agent Edit Properties Component**
```
┌─────────────────────────────────────────┐
│ 🏠 My Properties    [+ Publish New]     │
├─────────────────────────────────────────┤
│ Filters:                                 │
│ [Search...] [Category ▼] [Status ▼]    │
├─────────────────────────────────────────┤
│ Property List:                           │
│ ┌──────────────────────────────────────┐│
│ │ Modern 3-Bedroom House               ││
│ │ Accra, Ghana  ✓ Approved            ││
│ │ Description...                       ││
│ │ GHS 500,000  |  3 Beds  | 2 Baths  ││
│ │              [Edit]  [Delete]       ││
│ └──────────────────────────────────────┘│
│ ┌──────────────────────────────────────┐│
│ │ Commercial Space in Tema             ││
│ │ Tema, Ghana  ⏱ Pending Approval      ││
│ │ Description...                       ││
│ │ GHS 250,000  |  0 Beds  | 1 Bath   ││
│ │              [Edit]  [Delete]       ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### **New/Edit Property Dialog**
```
┌──────────────────────────────────────┐
│ Publish New Property                  │
├──────────────────────────────────────┤
│ Property Title *        [_________]  │
│ Category *              [Select  ▼]  │
│ Location *              [_________]  │
│ Price *                 [_________]  │
│ Currency                [GHS      ▼] │
│ Bedrooms                [0        ]  │
│ Bathrooms               [0        ]  │
│ Square Feet             [0        ]  │
│ Description             [________]  │
│                         [_______]   │
│                         [_______]   │
│ ℹ️ All properties require admin      │
│    approval before publishing         │
├──────────────────────────────────────┤
│ [Cancel]  [Submit for Approval]      │
└──────────────────────────────────────┘
```

### **Agent Management Admin Tab** (Updated)
```
Agent Details Dialog:

📋 Wholesale Products
  ☑️ Publish: [━━━━━━]
  ☑️ Edit:    [━━━━━━]

🏠 Properties
  ☐ Publish: [━━━━━━]
  ☐ Edit:    [━━━━━━]
```

---

## 🔄 Data Flow

### **Creating a Property**
```
Agent fills form → Submit → Create in DB (is_approved: false) 
→ Toast success → List updated with "Pending" badge 
→ Admin sees in Properties tab → Admin approves → Property published
```

### **Editing a Property**
```
Agent clicks Edit → Form filled with current data → Update in DB 
→ Status reset to Pending (if was Approved) → Toast success 
→ Admin must re-approve
```

### **Deleting a Property**
```
Agent clicks Delete → Confirmation dialog → Delete from DB 
→ Toast success → List refreshed
```

---

## 🛡️ Security Measures

1. **Authentication Required**
   - All endpoints require valid Supabase user session
   - Login page redirects unauthenticated users

2. **Agent Approval Required**
   - Only approved agents can access publishing page
   - Prevents pending/rejected agents from publishing

3. **Permission-Based Access**
   - `can_publish_properties` controls publishing capability
   - `can_update_properties` controls editing capability
   - Admin controls these via toggle switches

4. **Server-Side Validation**
   - API routes validate all inputs
   - Admin client prevents cross-agent access
   - Timestamp validation for properties

5. **Row-Level Security (RLS)**
   - Agents can only see their own properties
   - Admins have full visibility
   - Published properties visible to public

---

## 📝 Testing Checklist

- [ ] Agent can navigate to `/agent/publish-properties`
- [ ] Agent sees "Access Restricted" if no permissions
- [ ] Agent sees permission status alerts
- [ ] Agent can publish new property (if `can_publish_properties = true`)
- [ ] New property shows "Pending Approval" badge
- [ ] Agent can edit own property (if `can_update_properties = true`)
- [ ] Agent can delete own property
- [ ] Admin can toggle `can_publish_properties` permission
- [ ] Admin can toggle `can_update_properties` permission
- [ ] Toast notifications appear on success/error
- [ ] Filters work (search, category, status)
- [ ] Properties table updates correctly

---

## 🚀 Next Steps (If Needed)

1. **PropertiesTab Integration**: Update admin Properties tab to show submitted properties with approval workflow
2. **Notifications**: Add notification system for property approval/rejection
3. **Email Alerts**: Send emails when properties are approved/rejected
4. **Analytics**: Track property submissions by agent
5. **Bulk Operations**: Allow agents to manage multiple properties

---

## 📚 Related Files

- `/components/agent/AgentEditProperties.tsx` - Main component
- `/app/agent/publish-properties/page.tsx` - Page wrapper
- `/components/agent/AgentMenuCards.tsx` - Menu integration
- `/components/admin/tabs/AgentManagementTab.tsx` - Permission controls
- `/scripts/add-property-permissions-to-agents.sql` - Database migration
- `/scripts/add-property-approval-column.sql` - Properties table update
