# Quick Start Guide

## For Agents

### Access Publishing (If Permitted)
1. Login to agent account
2. Go to dashboard
3. Click **"Publish Products"** card
4. Or navigate directly to: `/agent/publish-products`

### Submit a Product
1. **Fill Product Details**:
   - Product Name (required)
   - Description
   - Category (select from dropdown)
   - Price (in GH₵)
   - Commission Value (optional)
   - Quantity
   - Delivery Time

2. **Add Images**:
   - Click file upload area to upload images
   - OR paste image URL and click "Add URL"
   - Remove images by clicking the X button

3. **Submit**:
   - Click "Submit Product"
   - You'll see: "Product submitted successfully!"
   - Wait for admin to approve

### If Access Denied
- Message: "You don't have permission to publish products"
- Contact admin to request access
- Admin must toggle "Can Publish Products" ON for your account

---

## For Admins

### Grant Agent Publishing Permission
1. Go to `/admin`
2. Click **"Agents Management"** tab
3. Search for agent by **name** or **phone number**
4. Click **"View Details"** on agent card
5. Find **"Can Publish Products"** toggle
6. Toggle **ON**
7. See confirmation: "[Agent Name] can now publish products"

### Revoke Permission
- Same steps as above
- Toggle **OFF**
- Agent loses access to publishing page

### Review Submitted Products
1. Go to `/admin/wholesale`
2. Click **"Product Management"** tab
3. Look for products with:
   - Status: **"Inactive"** (is_active: false)
   - Created by: **[Agent Name]**
4. Click to view/edit details
5. Toggle to active to publish

### Approve Product
1. In Product Management, click product
2. Review all details
3. If good, toggle **"Active"** to ON
4. Click Save
5. Product now visible to other agents in `/agent/wholesale`

---

## Key URLs

| Page | URL | Who |
|------|-----|-----|
| Publishing | `/agent/publish-products` | Agents |
| Agent Dashboard | `/agent/dashboard` | Agents |
| Wholesale Shop | `/agent/wholesale` | Agents |
| Admin Controls | `/admin` → Agents Tab | Admins |
| Product Review | `/admin/wholesale` → Products Tab | Admins |

---

## Permission Levels

### **Agent Can Publish If**:
- ✅ Logged in
- ✅ Account approved (isapproved: true)
- ✅ Has "Can Publish Products" permission (can_publish_products: true)

### **Agent Cannot Publish If**:
- ❌ Not logged in → redirected to login
- ❌ Account not approved → see approval message
- ❌ No publishing permission → see "Access Restricted"

---

## Product Submission Checklist

**Before submitting, ensure you have:**
- [ ] Product name
- [ ] Product category selected
- [ ] Product price
- [ ] Product quantity
- [ ] At least ONE product image

**Optional but recommended:**
- [ ] Product description
- [ ] Commission value
- [ ] Delivery time information

---

## Troubleshooting

### Agent Issue: "Access Restricted"
**Solution**: Admin needs to grant permission
- Admin: Go to `/admin` → Agents Management
- Search for agent name
- View Details → Toggle "Can Publish Products" ON

### Agent Issue: "Not logged in"
**Solution**: Login first
- Go to `/agent/login`
- Enter phone and password

### Admin Issue: Can't find agent
**Solution**: Try different search
- Search by full name or phone number
- Must match exactly in database

### Product doesn't appear for other agents
**Solution**: Make sure it's active
- In `/admin/wholesale`
- Check product "Active" status
- Toggle to ON if needed

---

## Product Form Fields

```
Product Name ...................... Required
Description ...................... Optional
Category .......................... Required (22 options)
Price (GH₵) ...................... Required
Commission Value (GH₵) ........... Optional
Quantity ......................... Required
Delivery Time .................... Optional (default: 3-5 days)
Images ........................... Required (≥1 image)
```

---

## Admin Toggle Location

**Path**: `/admin` → "Agents Management" tab

**In Agent Details Dialog**:
```
Basic Information
├─ ID
├─ Name
├─ Phone
├─ Region
├─ Status (Approved/Pending)
└─ [TOGGLE] Can Publish Products  ← Toggle here
```

---

## What Agents Can't Do

❌ Edit products after submitting  
❌ See their submitted products  
❌ Change category/price without re-submitting  
❌ Delete products  
❌ Access other agents' products  
❌ Approve their own products  

(Admin does these instead)

---

## What Products Start With

**When agent submits, product gets**:
- ✅ All details from form
- ✅ Status: **Inactive** (is_active: false)
- ✅ Created by: **[Agent ID]**
- ✅ Awaiting: **Admin approval**

**After admin approves**:
- ✅ Status: **Active** (is_active: true)
- ✅ Visible to: **All agents**
- ✅ Purchasable by: **Other agents**

---

## Common Scenarios

### Scenario 1: New Agent Wants to Publish
1. Agent logs in ✓
2. Agent approved? NO → Admin must approve first
3. Agent has permission? NO → Admin must toggle ON
4. Agent can now access `/agent/publish-products`

### Scenario 2: Product Quality Issues
1. Agent submits product
2. Admin reviews in Product Management
3. Admin sees problems
4. Admin edits details
5. Admin toggles Active when ready
6. Product appears to other agents

### Scenario 3: Revoking Bad Actor
1. Agent was publishing poor products
2. Admin goes to Agents Management
3. Admin finds agent, views details
4. Admin toggles "Can Publish Products" OFF
5. Agent sees "Access Restricted" immediately
6. Agent cannot submit more products

### Scenario 4: Agent Wants to Know Status
1. Agent logs in
2. Submits product via `/agent/publish-products`
3. Sees "Product submitted successfully!"
4. Currently NO way to track status
5. (Future enhancement: add tracking page)

---

## Important Notes

⚠️ **No migrations needed** - uses existing database fields  
⚠️ **Products are private until approved** - other agents don't see pending  
⚠️ **Permission is per-agent** - controlled individually by admin  
⚠️ **Real-time updates** - permissions take effect immediately  
⚠️ **Three-layer security** - logged in + approved + permitted  

---

## Contact/Support

If something isn't working:
1. Check the `IMPLEMENTATION_SUMMARY.md` for detailed explanation
2. Check the `AGENT_PUBLISHING_GUIDE.md` for technical details
3. Review troubleshooting section above
4. Check admin console for error messages

---

## Files to Know

- Agent page: `/app/agent/publish-products/page.tsx`
- Admin toggle: `/components/admin/tabs/AgentManagementTab.tsx`
- Menu integration: `/components/agent/AgentMenuCards.tsx`
- Type definitions: `/lib/agent-auth.ts`

---

**Version**: 1.0  
**Date**: February 9, 2026  
**Status**: Ready to Use
