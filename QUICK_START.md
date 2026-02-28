# Quick Start Guide - v2.1.0

## 🎯 Overview

This guide covers:
- ✅ How agents submit products (with optional variants)
- ✅ How admins approve products
- ✅ Agent validation and error handling
- ✅ Product variants feature

---

## For Agents: How to Submit Products

### Step 1: Navigate to Product Submission
1. Login to agent account
2. Go to dashboard
3. Click **"Publish Products"** card
4. Or navigate directly to: `/agent/publish-products`

### Step 2: Fill Required Information
All fields marked with * are required:

```
*Product Name           → e.g., "Wireless Headphones"
 Description           → e.g., "High quality sound with noise cancellation"
*Category              → Select from dropdown (22 categories available)
*Price (GH₵)           → e.g., 299.99 (must be > 0)
 Commission Value      → e.g., 50.00 (optional)
*Quantity              → e.g., 100 (must be > 0)
 Delivery Time         → e.g., "2-3 business days" (optional)
*Images                → At least 1 image required
```

### Step 3: Add Images (Required - Minimum 1)

**Option A: Upload Files**
1. Click "Click to upload images" area
2. Select PNG or JPG files (up to 5MB each)
3. Wait for upload to complete
4. Image preview appears below form

**Option B: Paste Image URL**
1. Enter full image URL in "Image URL" field
2. Click "Add URL" button
3. URL appears in image list

**Tip**: You can use both methods! Upload some files AND add URLs.

### Step 4: (Optional) Add Product Variants

**What are Variants?**
Variants let customers choose options like color, size, material, etc.
Example: T-shirt with colors (Red, Blue) and sizes (S, M, L, XL)

**How to Add Variants:**
1. Click "Add Product Variants" to expand the section
2. Enter Variant Type: `Color` (or Size, Material, etc.)
3. Enter Variant Values: `Red, Blue, Green, Black, White`
4. Click "Add Variant"
5. Repeat for more variant types

**Examples:**

📍 Example 1: Clothing with Colors and Sizes
```
Variant Type: Color
Values: Red, Blue, Black, White, Green
[Add Variant]

Variant Type: Size
Values: XS, S, M, L, XL, XXL
[Add Variant]
```

📍 Example 2: Headphones with Colors and Materials
```
Variant Type: Color
Values: Black, Silver, Gold, Blue
[Add Variant]

Variant Type: Material
Values: Plastic, Metal, Hybrid
[Add Variant]
```

📍 Example 3: No Variants (Optional)
- Simply skip the variants section
- Products work fine without variants

### Step 5: Submit Your Product
1. Review all information
2. Click **"Submit Product"** button
3. Wait for success message: "Product submitted successfully!"
4. Form automatically resets
5. You can submit another product

### What Happens Next?
- ✅ Product saved to database with `is_active: false` (unpublished)
- ⏳ Admin reviews your product in Product Management section
- 📢 Once approved and `is_active: true`, product appears in Wholesale section
- 🛒 Other agents can see and purchase your product

---

## Troubleshooting: Agent Issues

### Error: "Missing required fields"
**Problem**: You didn't fill in all required fields  
**Solution**: Check and fill:
- ✅ Product Name
- ✅ Category selected
- ✅ Price entered (and > 0)
- ✅ Quantity entered (and > 0)
- ✅ At least 1 image added

### Error: "Price must be a positive number"
**Problem**: Price is 0 or negative  
**Solution**: Enter price > 0  
Example: `299.99` ✅ | `0` ❌ | `-50` ❌

### Error: "Quantity must be a positive integer"
**Problem**: Quantity is 0 or negative  
**Solution**: Enter quantity ≥ 1  
Example: `100` ✅ | `0` ❌ | `-10` ❌

### Error: "At least one product image is required"
**Problem**: No images added  
**Solution**: Upload or paste at least 1 image URL

### Error: "Agent not found. Invalid agent ID"
**Problem**: Your agent ID is missing or invalid  
**Solution**: Check your account is properly created in system

### Error: "Your agent account is not active"
**Problem**: Your account status is not "active"  
**Solution**: Contact admin to activate your account

### Message: "You don't have permission to publish products"
**Problem**: Admin hasn't granted you publishing permission  
**Solution**: Contact admin to request access

---

## For Admins: Product Management & Approvals

### How Agent Validation Works

**Three-Layer Security** 🔐
1. **Authentication**: Agent must be logged in
2. **Platform Approval**: Agent account must be approved (`isapproved: true`)
3. **Publishing Permission**: Admin must grant publishing permission (`can_publish_products: true`)

If any layer fails:
- No permission → Error message shown
- Product cannot be submitted
- Data integrity maintained

### Step 1: Grant Agent Publishing Permission

**Who can publish?**
1. Go to `/admin`
2. Click **"Agents Management"** tab
3. Search for agent by **name** or **phone number**
4. Click **"View Details"** on agent card
5. Find toggle: **"Can Publish Products"**
6. Toggle **ON**
7. See confirmation: "[Agent Name] can now publish products"
8. Agent immediately gets access

**To Revoke Permission:**
- Same steps as above
- Toggle **OFF**
- Agent immediately loses access
- Cannot submit new products
- Existing products remain (can review/delete)

### Step 2: Review Submitted Products

**Where to find pending products:**
1. Go to `/admin/wholesale`
2. Click **"Product Management"** tab
3. Look for products with:
   - Status: **"Inactive"** (is_active: false)
   - `created_by`: Shows which agent submitted
4. Click product to view/edit details

**What to check:**
- ✅ Product name is appropriate
- ✅ Description is accurate
- ✅ Category is correct
- ✅ Price is reasonable
- ✅ Images are clear
- ✅ Quantity makes sense
- ✅ Variants look good (if included)

### Step 3: Approve or Reject

**To Approve (Publish) Product:**
1. In Product Management, click product
2. Review all details
3. Click edit if changes needed
4. Toggle **"Active"** to ON
5. Click Save
6. Product immediately visible to all agents

**To Reject Product:**
1. Delete the product, OR
2. Leave unpublished and contact agent with feedback
3. Agent can resubmit

---

## Product Variants: What Admins Need to Know

### Variants Explanation
Variants are optional product attributes like:
- **Color**: Red, Blue, Green, etc.
- **Size**: S, M, L, XL, etc.
- **Material**: Cotton, Polyester, Leather, etc.
- **Any custom type**: Agent can define any variant type

### How Variants Are Stored

**In JSON Format** (quick access):
```json
{
  "variants": [
    {
      "type": "Color",
      "values": ["Red", "Blue", "Green"]
    },
    {
      "type": "Size",
      "values": ["S", "M", "L", "XL"]
    }
  ]
}
```

**In Database** (detailed queries):
```
product_variants table:
- product_id (which product)
- variant_type (e.g., "Color")
- variant_values (array of values)
```

### Viewing Variants

**In Admin Dashboard:**
1. Go to `/admin/wholesale`
2. Click "Product Management"
3. Click any product with variants
4. Scroll to "Variants" section
5. See all variant types and values

**In Database:**
```sql
-- View variants as JSON
SELECT id, name, variants FROM wholesale_products;

-- View detailed variant data
SELECT * FROM product_variants WHERE product_id = 'uuid';
```

---

## Validation Rules for Admins

### Agent Validation
- ✅ Agent must exist in database
- ✅ Agent status must be "active"
- ✅ Agent must have `can_publish_products = true`
- Returns 404 if agent doesn't exist
- Returns 403 if agent not active
- Returns error if no permission

### Product Validation
- ✅ Name cannot be empty
- ✅ Name must be unique
- ✅ Price must be > 0
- ✅ Quantity must be > 0
- ✅ At least 1 image required
- ✅ Category must be valid
- ✅ All other fields validated

### Error Codes Agents See
| Code | Meaning | Action |
|------|---------|--------|
| 201 | Success | Product created |
| 400 | Invalid input | Agent fixes and retries |
| 403 | Account not active | Admin activates agent |
| 404 | Agent not found | Check agent ID |
| 409 | Name exists | Agent uses different name |
| 500 | Server error | Check logs |

---

## 🔗 Key URLs & Navigation

| Purpose | URL | User Type |
|---------|-----|-----------|
| **Submit Products** | `/agent/publish-products` | Agents |
| **Agent Dashboard** | `/agent/dashboard` | Agents |
| **View Products** | `/agent/wholesale` | Agents |
| **Admin Panel** | `/admin` | Admins |
| **Grant Permissions** | `/admin` → Agents Tab | Admins |
| **Review Products** | `/admin/wholesale` → Products Tab | Admins |

---

## 📋 API Quick Reference

### Submit Product (No Variants)
```bash
curl -X POST /api/agent/wholesale/submit-product \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Headphones",
    "category": "Electronics",
    "price": 299.99,
    "quantity": 100,
    "agent_id": "550e8400-e29b-41d4-a716-446655440000",
    "image_urls": ["https://example.com/image.jpg"]
  }'
```

### Submit Product (With Variants)
```bash
curl -X POST /api/agent/wholesale/submit-product \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-Shirt",
    "category": "Fashion & Clothing",
    "price": 49.99,
    "quantity": 200,
    "agent_id": "550e8400-e29b-41d4-a716-446655440000",
    "image_urls": ["https://example.com/tshirt.jpg"],
    "variants": [
      {
        "type": "Color",
        "values": ["Red", "Blue", "Green"]
      },
      {
        "type": "Size",
        "values": ["S", "M", "L", "XL"]
      }
    ]
  }'
```

---

## ✅ Pre-Submission Checklist

**Required Fields** (must fill):
- [ ] Product Name
- [ ] Category selected
- [ ] Price entered (> 0)
- [ ] Quantity entered (> 0)
- [ ] At least 1 image

**Optional But Recommended**:
- [ ] Product description
- [ ] Commission value
- [ ] Delivery time
- [ ] Variants (new feature!)

---

## 🔐 Security & Permissions

### Agent Access Layers

**Layer 1: Authentication**
- Agent must be logged in
- Session validated

**Layer 2: Platform Approval**
- Agent account must be approved
- Status must be active

**Layer 3: Publishing Permission**
- Admin must grant `can_publish_products = true`
- Controlled in Agents Management tab

**If Any Layer Fails:**
- ❌ Submission blocked
- ❌ Error message shown
- ❌ No data corruption

---

## 📊 Product Form Fields

```
*Product Name           Required    e.g., "Wireless Headphones"
 Description            Optional    "High quality sound..."
*Category              Required    22 categories available
*Price (GH₵)           Required    Must be > 0
 Commission (GH₵)      Optional    For tracking
*Quantity              Required    Must be > 0
 Delivery Time         Optional    "2-3 business days"
*Images                Required    At least 1 image
 Variants              Optional    NEW! Add colors, sizes, etc.
```

---

## 🎯 Admin Toggle Location

**Path**: `/admin` → "Agents Management" tab

**Steps**:
1. Search for agent name/phone
2. Click "View Details"
3. Find "Can Publish Products" toggle
4. Toggle ON to grant permission
5. Toggle OFF to revoke permission

**Result**:
- ✅ Permission takes effect immediately
- ✅ Agent sees changes right away
- ✅ Toast confirmation shows

---

## 📦 Product Lifecycle

```
Agent Submits
    ↓ (is_active: false)
Pending Review
    ↓ (Admin reviews)
Admin Approves
    ↓ (Toggle to Active)
Published
    ↓ (is_active: true)
Visible to All Agents
    ↓
Other Agents Can Purchase
```

---

## ⚠️ Important Notes

🔴 **Agent Validation**: Only active agents with permission can submit  
🟡 **Variants Optional**: Products work with or without variants  
🟢 **Backward Compatible**: Old products unaffected by variants feature  
🔵 **Real-time Updates**: Permission changes take effect immediately  
⚫ **Three-Layer Security**: Multiple checks prevent invalid submissions  

---

## 🆘 Troubleshooting

### Agents: "Access Restricted"
→ Admin hasn't granted permission yet  
→ Admin goes to `/admin` → Agents Management  
→ Admin finds agent, toggles "Can Publish Products" ON  

### Agents: "Agent not found"
→ Check your agent account is properly set up  
→ Contact admin to verify your agent ID  

### Agents: "Account not active"
→ Your account status must be "active"  
→ Contact admin to activate your account  

### Admins: Can't find product
→ Product may still be loading  
→ Try refreshing the page  
→ Check that product `is_active: false` (pending status)  

### Admins: Permission change not working
→ Make sure admin account has access  
→ Try refreshing the page  
→ Check browser console for errors  

---

## 📚 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| `CHANGELOG.md` | What changed | Developers |
| `API_REFERENCE.md` | API details | Developers |
| `IMPLEMENTATION_SUMMARY.md` | Technical details | Developers |
| `COMPLETION_REPORT.md` | Project overview | Managers |
| `QUICK_START.md` | This guide! | Everyone |

---

## 📱 Available Categories

```
Electronics          Fashion & Clothing   Home & Garden
Health & Beauty      Sports & Outdoors    Books & Media
Toys & Games         Food & Beverages     Automotive
Office Supplies      Pet Supplies         Baby & Kids
Jewelry & Accessories  Industrial & Tools  Travel & Luggage
Gifts & Crafts       Art & Stationery    Medical & Pharmacy
Building & Construction  Garden & Outdoor  Musical Instruments
Other
```

---

## 🚀 Getting Started

**For Agents:**
1. Go to `/agent/publish-products`
2. Fill in product details
3. Add at least 1 image
4. (Optional) Add variants
5. Click "Submit Product"
6. Wait for admin approval

**For Admins:**
1. Go to `/admin` → Agents Management
2. Search for agent
3. View Details → Toggle "Can Publish Products" ON
4. Go to `/admin/wholesale` → Product Management
5. Review pending products
6. Toggle "Active" to approve
7. Product now visible to other agents

---

## 💡 Pro Tips

✅ Use clear product names  
✅ Add descriptive images  
✅ Use variants for flexibility  
✅ Set realistic delivery times  
✅ Include commission value if applicable  
✅ Test locally before submitting  
✅ Check error messages for guidance  
✅ Contact admin if stuck  

---

**Version**: 2.1.0  
**Release Date**: February 15, 2026  
**Status**: ✅ Production Ready  
**Backward Compatible**: ✅ Yes  

---

**Ready to go!** 🚀 Start submitting products today!
