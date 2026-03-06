# Agent Product Publishing System - Implementation Guide

## Overview
This document explains the complete Agent Product Publishing System that allows approved agents to submit wholesale products to the admin platform for review and approval.

---

## ✅ What Has Been Implemented

### 1. **Agent Publishing Page** (`/agent/publish-products`)
- **Location**: `/vercel/share/v0-project/app/agent/publish-products/page.tsx`
- **Features**:
  - Permission check: Only agents with `can_publish_products = true` can access
  - Product submission form with all necessary fields
  - Image upload (direct file upload or URL)
  - Product details: name, description, category, price, commission, quantity, delivery time
  - Products are created with `is_active: false` (unpublished)
  - Products are tracked with `created_by: agent_id` field

### 2. **Agent Menu Integration**
- **Location**: `/vercel/share/v0-project/components/agent/AgentMenuCards.tsx`
- **Update**: Added "Publish Products" card to agent dashboard menu
- Links directly to `/agent/publish-products` page

### 3. **Dashboard Tab**
- **Location**: `/vercel/share/v0-project/app/agent/dashboard/page.tsx`
- **Update**: Added "publish-products" tab with quick information and link to publishing page

### 4. **Admin Permission Control**
- **Location**: `/vercel/share/v0-project/components/admin/tabs/AgentManagementTab.tsx`
- **Features**:
  - Toggle switch in agent details dialog
  - Label: "Can Publish Products"
  - Allows admins to grant/revoke publishing privileges per agent
  - Real-time permission updates

### 5. **Agent Type Updates**
- **Location**: `/vercel/share/v0-project/lib/agent-auth.ts`
- **Update**: Added `can_publish_products?: boolean` field to Agent interface

---

## 🔐 Access Control & Authorization

### **Three-Layer Permission System**

#### Layer 1: Agent Authentication
```typescript
// Agent must be logged in
const agent = getStoredAgent()
if (!agent) router.push("/agent/login")
```

#### Layer 2: Platform Approval
```typescript
// Agent must be approved to use the platform
if (!agent.isapproved) throw new Error("Not approved")
```

#### Layer 3: Publishing Permission
```typescript
// Agent must have explicit permission to publish products
const { data } = await supabase
  .from("agents")
  .select("can_publish_products")
  .eq("id", agent.id)
  .single()

if (data?.can_publish_products !== true) {
  // Show access restricted view
}
```

---

## 📊 Product Publishing Workflow

### **Agent Side**

1. **Navigate to Publishing**
   - Click "Publish Products" card on dashboard
   - Or visit `/agent/publish-products`

2. **Permission Check**
   - System verifies `can_publish_products = true`
   - If denied, shows "Access Restricted" message

3. **Submit Product**
   - Fill in product details (name, category, price, etc.)
   - Upload images (file upload or URL)
   - Click "Submit Product"
   - Product is created with `is_active: false`

4. **Confirmation**
   - Toast notification: "Product submitted successfully! Admin will review and publish it."
   - Form resets for next product

### **Admin Side**

1. **Product Management Dashboard**
   - Location: `/admin/wholesale` → "Product Management" tab
   - Shows all products including pending ones

2. **Identify Agent-Submitted Products**
   - Products with `created_by` field set to agent ID
   - `is_active: false` (unpublished status)

3. **Review & Approval**
   - Admin can view agent-submitted products
   - Edit details if needed
   - Set `is_active: true` to publish

4. **Product Visibility**
   - Once `is_active: true`, products appear to other agents
   - Agents can see and purchase published products

---

## 🎛️ Admin Controls

### **Grant Publishing Permission**

1. Go to `/admin` → "Agents Management" tab
2. Search for agent by name or phone
3. Click "View Details" on agent card
4. In details dialog, toggle "Can Publish Products"
5. Toggle automatically updates agent record in database

### **Revoke Publishing Permission**

- Same process as granting
- Toggle switch off to disable publishing access
- Agent will see "Access Restricted" when trying to access `/agent/publish-products`

---

## 💾 Database Integration

### **No Migrations Needed**
The system uses existing database fields:
- `can_publish_products` (boolean on agents table)
- `is_active` (existing on wholesale_products table)
- `created_by` (existing on wholesale_products table)

### **Product Fields Used**
```typescript
{
  name: string
  description: string
  category: string
  price: number
  commission_value: number
  quantity: number
  delivery_time: string
  image_urls: string[]
  is_active: false // Always starts as false
  created_by: agent_id // Tracks which agent submitted
}
```

---

## 🛠️ Technical Implementation Details

### **Agent Publishing Page Flow**

```
User Access
    ↓
Check if logged in
    ↓
Fetch agent data from Supabase
    ↓
Check can_publish_products field
    ↓
If true → Show form
If false → Show "Access Restricted" message
    ↓
On submit → Create product with is_active: false
```

### **Admin Permission Toggle**

```
Admin views agent details
    ↓
Switch toggle on/off
    ↓
updateSaga: Update agent.can_publish_products
    ↓
Update local state (selectedAgent, agents list)
    ↓
Toast notification
```

---

## 🚀 Usage Examples

### **For Agents**

```typescript
// Check if can publish
const agent = getStoredAgent()
const { data } = await supabase
  .from("agents")
  .select("can_publish_products")
  .eq("id", agent.id)
  .single()

if (data?.can_publish_products) {
  // Navigate to publish page
  router.push("/agent/publish-products")
}
```

### **For Admins**

```typescript
// Grant publishing permission
await supabase
  .from("agents")
  .update({ can_publish_products: true })
  .eq("id", agentId)

// Revoke publishing permission
await supabase
  .from("agents")
  .update({ can_publish_products: false })
  .eq("id", agentId)
```

### **For Product Management**

```typescript
// Find pending agent submissions
const { data: pendingProducts } = await supabase
  .from("wholesale_products")
  .select("*")
  .eq("is_active", false)
  .neq("created_by", null)

// Approve a product
await supabase
  .from("wholesale_products")
  .update({ is_active: true })
  .eq("id", productId)
```

---

## 📍 Key Locations

| File | Purpose |
|------|---------|
| `/app/agent/publish-products/page.tsx` | Agent publishing interface |
| `/components/agent/AgentMenuCards.tsx` | Dashboard menu card |
| `/app/agent/dashboard/page.tsx` | Dashboard tab content |
| `/components/admin/tabs/AgentManagementTab.tsx` | Admin permission toggle |
| `/lib/agent-auth.ts` | Agent type definitions |
| `/lib/wholesale.ts` | Product management functions |

---

## 🔗 Navigation Paths

### **For Agents**
- Dashboard → Click "Publish Products" card → `/agent/publish-products`
- OR Direct: `/agent/publish-products`

### **For Admins**
- `/admin` → "Agents Management" → Search agent → View Details → Toggle permission
- `/admin/wholesale` → "Product Management" → Review pending products

---

## ⚙️ Configuration Notes

### **No Environment Variables Needed**
- Uses existing Supabase integration
- No new API keys required
- Works with current database schema

### **Existing Database Fields Used**
- `agents.can_publish_products` (boolean, nullable)
- `wholesale_products.is_active` (boolean)
- `wholesale_products.created_by` (string, UUID)

---

## ✨ Features Summary

✅ Permission-based access control  
✅ Agent product submission form  
✅ Image upload support (file & URL)  
✅ Admin permission management  
✅ Pending product tracking  
✅ No database migrations needed  
✅ Real-time permission updates  
✅ Toast notifications for user feedback  
✅ Responsive design  
✅ Security checks at multiple levels  

---

## 📝 Notes

- Products submitted by agents start with `is_active: false` (unpublished)
- Only agents with `can_publish_products = true` can access publishing page
- Admin controls all permissions through agent details dialog
- Products are identified by `created_by` field to distinguish agent vs admin submissions
- All data is stored in existing Supabase tables with no schema changes

---

## 🆘 Troubleshooting

### **Agent can't see "Publish Products" option**
- Check if agent is logged in
- Check if agent is approved (isapproved field)
- Check if agent has `can_publish_products = true` in database

### **Admin can't toggle permission**
- Verify admin is logged in and authenticated
- Check Supabase connection
- Review browser console for errors

### **Products not appearing in admin section**
- Filter by `is_active = false` to see pending products
- Check `created_by` field to identify agent submissions
- Verify product was created successfully

---

**System Created**: February 2026  
**Last Updated**: February 9, 2026
