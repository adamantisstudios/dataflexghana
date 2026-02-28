# Wholesale Management - Admin Quick Reference Guide

## Product Variants Feature

### Quick Navigation
- **Admin Panel URL:** `/admin/wholesale`
- **Product Management:** Main section
- **Order Management:** View order details with variants
- **Agent Filter:** Filter by agent for targeted operations

---

## Creating a Product with Variants

### Step 1: Open Product Management
1. Go to Admin Dashboard
2. Click "Wholesale" in navigation
3. You'll see the Product Management section

### Step 2: Click "Add New Product"
- Located in top right of products section
- Opens product creation dialog

### Step 3: Fill Basic Information
| Field | Example | Required |
|-------|---------|----------|
| Product Name | Electronics Kit | ✅ Yes |
| Description | Premium electronics set... | ❌ No |
| Category | Electronics | ✅ Yes |
| Price (GH₵) | 150.00 | ✅ Yes |
| Commission (GH₵) | 25.00 | ✅ Yes |
| Quantity | 50 | ❌ No |
| Delivery Time | 2-3 business days | ❌ No |

### Step 4: Add Product Images (Optional)
1. Enter image URL in "Add Image" field
2. Click button to add URL
3. Or use file upload for direct uploads
4. Can add multiple images

### Step 5: Add Product Variants (Optional)
1. **Click "Add Product Variants"** button
2. A new section expands below images
3. **Enter Variant Type:** (e.g., "Color")
4. **Enter Variant Values:** (comma-separated, e.g., "Red, Blue, Green")
5. **Click "Add Variant"** button
6. Variant appears in list below

**Repeat for each variant type:**
- Add another variant type (e.g., "Size")
- Enter its values
- Click "Add Variant"

**Remove Variants:**
- Click "Remove" next to any variant to delete it
- Changes only take effect when you save

### Step 6: Set Product Status
- Toggle "Active" switch to activate product
- Only active products appear to agents

### Step 7: Save Product
- Click "Save Product" button
- Product created with all variants

---

## Example: Create Electronics Kit with Color and Size

```
Product Name: Electronics Starter Kit
Description: Complete starter electronics kit
Price: 150.00 GH₵
Commission: 25.00 GH₵
Quantity: 100

Variant 1:
  Type: Color
  Values: Black, White, Silver

Variant 2:
  Type: Size
  Values: Standard, Compact
```

**Result:** Agents see both Color and Size options available for this product

---

## Editing Existing Products

### To Edit a Product
1. Find product in table
2. Click **Edit** button (pencil icon)
3. Make changes to any field
4. Can add/remove variants
5. Click **Save Product**

### To Remove Variants from Product
1. Click Edit on product
2. Click "Add Product Variants" to expand section
3. Click "Remove" next to variants to delete
4. Save product

---

## Exporting Product Catalog to CSV

### Without Filters (All Products)
1. Product table shows all products
2. Look for **Export CSV** button
3. Click it
4. File downloads as: `wholesale_products_all_2026-02-15.csv`

### With Filters
1. **Filter by Category:** Select category from dropdown
2. **Filter by Agent:** Select agent name from dropdown
3. **Filter by Status:** Select Active/Inactive
4. **Search:** Type in search box to find products
5. Click **Export CSV** button
6. File downloads with applied filters

### CSV File Contents
**Columns in the exported file:**
- Product Name
- Short Description (first 100 characters)
- Price (GH₵)
- Commission (GH₵)
- Category
- Quantity
- Agent (who created the product)

### Using the CSV File
**In Excel:**
1. Open downloaded CSV file
2. All data properly formatted
3. Can create reports
4. Can sort and filter

**In Google Sheets:**
1. Click File > Import
2. Upload the CSV file
3. Use for team sharing
4. Create charts and analysis

**For Record Keeping:**
- Archive CSV files by date
- Track product changes over time
- Maintain offline backup
- Share with other team members

---

## Viewing Product Variants

### In Product Table
- New **Variants** column shows variant types
- Displays as green badges
- Shows all variant types for quick reference
- Click product row to see full details

### In Product Details (Dialog)
1. Click Edit on product
2. Scroll to "Added Variants" section
3. See all variants with their values
4. Shows each variant type with comma-separated values

### In Order Details
1. Go to Order Management section
2. Click View Details on an order
3. Scroll to "Product Options" section
4. See what variants were available when order was placed
5. Helps track product configuration at order time

---

## Best Practices

### Variant Naming
| Good | Avoid |
|------|-------|
| Color | COL, C, color_option |
| Size | SZ, S, dimensions |
| Material | MAT, M, what_its_made_of |
| Storage | GB, storage_capacity |
| Weight | WT, how_heavy |

### Variant Values
| Good | Avoid |
|------|-------|
| Red, Blue, Green | red,blue,green |
| Small, Medium, Large | S,M,L |
| 32GB, 64GB, 128GB | 32,64,128 |
| Cotton, Polyester | 100% cotton |

**Pro Tip:** Use consistent capitalization and spacing

### Number of Variants
- **1 variant:** Fine for products like "Color only"
- **2 variants:** Most common (e.g., Color + Size)
- **3+ variants:** OK but avoid overcomplicating
- **Limit values:** Keep under 10 values per variant for simplicity

### Quantity Management
- **Variants don't affect quantity tracking**
- Quantity field tracks total units across all variants
- Example: "Color" variant with Red, Blue, Green still shows single quantity
- Consider summing individual variant quantities manually if needed

---

## Troubleshooting

### Problem: Can't add variant
**Solution:** Check that both "Variant Type" and "Variant Values" fields are filled

### Problem: Variant not appearing in table
**Solution:** Save the product first. Click Edit to verify variants were saved.

### Problem: CSV file looks wrong in Excel
**Solution:** This is normal. Use "Text to Columns" or open in Google Sheets for better formatting

### Problem: Agent can't see variants
**Solution:** Ensure product is marked as "Active". Agents only see active products.

### Problem: Removing variant didn't work
**Solution:** Make sure you clicked "Remove" button AND saved the product

### Problem: CSV export button is disabled
**Solution:** This happens when no products match your filters. Clear filters to see all products.

---

## Common Tasks

### Task: Create a T-Shirt with Size and Color Options
1. Click "Add New Product"
2. Name: "Classic T-Shirt"
3. Price: 45.00 GH₵
4. Commission: 8.00 GH₵
5. Click "Add Product Variants"
6. Add Variant Type: "Size" | Values: "XS, S, M, L, XL, XXL"
7. Add Variant Type: "Color" | Values: "Black, White, Navy, Red"
8. Save Product

### Task: Export Products from Specific Agent
1. Use "Agent" filter dropdown
2. Select agent name (e.g., "John Doe")
3. Click "Export CSV"
4. File name will be: `wholesale_products_John_Doe_2026-02-15.csv`

### Task: Modify Product Variants
1. Find product in table
2. Click "Edit"
3. Click "Add Product Variants" to expand
4. Click "Remove" on unwanted variants
5. Add new variants as needed
6. Save Product

### Task: Check What Options Were Available for an Order
1. Go to "Order Management" section
2. Find the order in the list
3. Click "View Details" or find order in table
4. Scroll down to "Product Information"
5. Look for "Available Variants" section
6. See all options that were offered

---

## Feature Overview

| Feature | Location | Used For |
|---------|----------|----------|
| Add Variants | Product Edit Dialog | Define product options |
| View Variants | Product Table Badges | Quick reference |
| Variant Details | Product Edit Dialog | See all variant values |
| Order Variants | Order Details Dialog | See options at order time |
| CSV Export | Filter Bar Button | Download product list |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Submit variant (when in input field) |
| Tab | Move to next field |
| Ctrl+S | Save product (some browsers) |

---

## Data Safety

### CSV Export
- ✅ Safe to download and share
- ✅ Contains product information only
- ✅ No sensitive customer data
- ✅ Can archive for records

### Variants
- ✅ Safely stored in database
- ✅ Encrypted like other product data
- ✅ Automatically backed up
- ✅ Can be edited anytime

### Product Deletion
- ⚠️ Deletes all product data including variants
- ⚠️ Cannot be undone (only if backup exists)
- ⚠️ Doesn't affect past orders
- ✅ Recommended: Archive before delete

---

## Performance Tips

### Keep Variant Lists Manageable
- Fewer values = faster loading
- Example: Use "S, M, L" instead of "S, M, ML, L, XL"

### Use CSV Export Regularly
- Keeps offline backup
- No performance impact
- Good practice for records

### Clean Up Inactive Products
- Remove products agents don't order
- Reduces table size
- Improves browsing experience

---

## Getting Help

### For Technical Issues
1. Check the CHANGELOG file
2. Review implementation details
3. Contact technical support

### For Usage Questions
1. Refer to this Quick Reference
2. Check the Feature Summary document
3. Review the examples above

### Reporting Problems
**Include these details:**
- What were you doing?
- What went wrong?
- What did you expect?
- Screenshot if possible

---

## Related Documents

- **WHOLESALE_PRODUCT_VARIANTS_CHANGELOG.md** - Technical details
- **VARIANTS_FEATURE_SUMMARY.md** - Complete feature overview
- **VARIANTS_IMPLEMENTATION_CHECKLIST.md** - Verification checklist

---

## Quick Links

| Link | Purpose |
|------|---------|
| `/admin/wholesale` | Access admin panel |
| Product Management | Create/edit products |
| Order Management | View orders with variants |
| Agent Filter | Filter by who created product |

---

**Last Updated:** February 15, 2026
**Version:** 1.0
**Status:** ✅ Production Ready

