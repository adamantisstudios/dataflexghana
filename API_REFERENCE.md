# API Reference - Product Submission v2.1.0

## Endpoint: POST /api/agent/wholesale/submit-product

Submit new wholesale products with optional variants.

---

## Request Format

### URL
```
POST /api/agent/wholesale/submit-product
Content-Type: application/json
```

### Required Fields
```typescript
{
  "name": string,           // Product name (required)
  "category": string,       // Category from WHOLESALE_CATEGORIES (required)
  "price": number,          // Price > 0 (required)
  "quantity": number,       // Quantity > 0 (required)
  "agent_id": string,       // Agent UUID (required)
  "image_urls": string[]    // At least 1 image URL (required)
}
```

### Optional Fields
```typescript
{
  "description": string,        // Product description
  "commission_value": number,   // Commission amount
  "delivery_time": string,      // Delivery timeframe (defaults to "3-5 business days")
  "variants": ProductVariant[], // Product variants
  "variant_metadata": object    // Additional metadata
}
```

### ProductVariant Structure
```typescript
interface ProductVariant {
  type: string,      // e.g., "Color", "Size", "Material"
  values: string[]   // e.g., ["Red", "Blue", "Green"]
}
```

---

## Request Examples

### Basic Product (No Variants)
```json
{
  "name": "Premium Wireless Headphones",
  "description": "High-quality sound with noise cancellation",
  "category": "Electronics",
  "price": 299.99,
  "commission_value": 50,
  "quantity": 100,
  "delivery_time": "2-3 business days",
  "image_urls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "agent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Product with Single Variant
```json
{
  "name": "T-Shirt",
  "description": "Comfortable cotton t-shirt",
  "category": "Fashion & Clothing",
  "price": 49.99,
  "quantity": 200,
  "image_urls": ["https://example.com/tshirt.jpg"],
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "variants": [
    {
      "type": "Size",
      "values": ["XS", "S", "M", "L", "XL", "XXL"]
    }
  ]
}
```

### Product with Multiple Variants
```json
{
  "name": "Cotton T-Shirt Collection",
  "description": "Premium quality cotton t-shirts in multiple colors and sizes",
  "category": "Fashion & Clothing",
  "price": 59.99,
  "commission_value": 10,
  "quantity": 500,
  "delivery_time": "1-2 business days",
  "image_urls": [
    "https://example.com/tshirt-red.jpg",
    "https://example.com/tshirt-blue.jpg",
    "https://example.com/tshirt-green.jpg"
  ],
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "variants": [
    {
      "type": "Color",
      "values": ["Red", "Blue", "Green", "Black", "White"]
    },
    {
      "type": "Size",
      "values": ["XS", "S", "M", "L", "XL", "XXL"]
    },
    {
      "type": "Material",
      "values": ["100% Cotton", "Cotton Blend"]
    }
  ]
}
```

---

## Response Formats

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Product submitted successfully with 2 variant type(s)",
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "description": "Product description",
    "category": "Electronics",
    "price": 299.99,
    "commission_value": 50,
    "quantity": 100,
    "delivery_time": "2-3 business days",
    "image_urls": ["url1", "url2"],
    "variants": [
      {
        "type": "Color",
        "values": ["Red", "Blue"]
      }
    ],
    "is_active": false,
    "created_by": "agent-uuid",
    "created_at": "2026-02-15T10:30:00Z"
  }
}
```

### Validation Error (400 Bad Request)
```json
{
  "error": "Missing required fields: name, category, price, quantity, agent_id"
}
```

Examples:
```json
{ "error": "Price must be a positive number" }
{ "error": "Quantity must be a positive integer" }
{ "error": "At least one product image is required" }
```

### Agent Not Found (404 Not Found)
```json
{
  "error": "Agent not found. Invalid agent ID."
}
```

### Agent Not Active (403 Forbidden)
```json
{
  "error": "Your agent account is not active. Please contact support to activate your account."
}
```

### Duplicate Product Name (409 Conflict)
```json
{
  "error": "A product with this name already exists. Please use a different product name."
}
```

### Server Error (500 Internal Server Error)
```json
{
  "error": "Failed to submit product",
  "details": "Database connection error or other server issue"
}
```

---

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 201 | Created | Product successfully submitted |
| 400 | Bad Request | Missing/invalid fields (name, price, quantity, etc.) |
| 403 | Forbidden | Agent account is not active |
| 404 | Not Found | Agent doesn't exist |
| 409 | Conflict | Product name already exists |
| 500 | Server Error | Database or unexpected server error |

---

## Validation Rules

### Required Field Validation
- `name`: Cannot be empty
- `category`: Must be one of WHOLESALE_CATEGORIES
- `price`: Must be a number > 0
- `quantity`: Must be an integer > 0
- `agent_id`: Must be a valid UUID
- `image_urls`: Must be a non-empty array of strings

### Optional Field Validation
- `description`: No validation (trimmed on server)
- `commission_value`: Must be ≥ 0 if provided
- `delivery_time`: No validation (defaults to "3-5 business days")
- `variants`: Each variant must have type and values

### Variant Validation
- `type`: Cannot be empty
- `values`: Must be non-empty array
- Multiple variant types allowed per product
- Multiple values allowed per type

### Agent Validation
- Agent must exist in database (404 if not)
- Agent status must be "active" (403 if not)

---

## Available Categories

```javascript
[
  "Electronics",
  "Fashion & Clothing",
  "Home & Garden",
  "Health & Beauty",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Food & Beverages",
  "Automotive",
  "Office Supplies",
  "Pet Supplies",
  "Baby & Kids",
  "Jewelry & Accessories",
  "Industrial & Tools",
  "Travel & Luggage",
  "Gifts & Crafts",
  "Art & Stationery",
  "Medical & Pharmacy",
  "Building & Construction",
  "Garden & Outdoor",
  "Musical Instruments",
  "Other"
]
```

---

## Common Variant Types

Recommended variant types (not required to use):
- **Color**: Red, Blue, Green, Black, White, Yellow, Orange, Purple, Pink, Silver, Gold, Brown, Gray, etc.
- **Size**: XS, S, M, L, XL, XXL, XXXL, or numeric sizes
- **Material**: Cotton, Polyester, Silk, Wool, Leather, Plastic, Metal, etc.
- **Weight**: In grams or kilograms
- **Capacity**: Volume sizes (500ml, 1L, 5L, etc.)
- **Style**: Casual, Formal, Sport, etc.
- **Brand**: Manufacturer brands
- **Model**: Product model numbers
- **Length/Width/Height**: Dimensions
- **Finish**: Matte, Glossy, Metallic, etc.

---

## Database Storage

### Primary Storage (JSON)
- Field: `wholesale_products.variants`
- Format: JSON array of ProductVariant objects
- Purpose: Quick single-record access
- Query: Direct JSON field query

### Relational Storage
- Table: `product_variants`
- Columns: product_id, variant_type, variant_values
- Purpose: Detailed queries and reporting
- Query: JOIN operations possible

---

## Error Handling Best Practices

### Check Status Code First
```javascript
const response = await fetch('/api/agent/wholesale/submit-product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

if (!response.ok) {
  const error = await response.json();
  // Handle error based on status code
  switch (response.status) {
    case 400: // Validation error
      console.error('Invalid input:', error.error);
      break;
    case 403: // Forbidden (inactive agent)
      console.error('Agent not active:', error.error);
      break;
    case 404: // Not found (invalid agent)
      console.error('Agent not found:', error.error);
      break;
    case 409: // Conflict (duplicate name)
      console.error('Duplicate product:', error.error);
      break;
    case 500: // Server error
      console.error('Server error:', error.error);
      break;
  }
  return;
}

const result = await response.json();
console.log('Success:', result.message);
console.log('Product ID:', result.data.id);
```

### Parse and Display Error Messages
```javascript
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('/api/agent/wholesale/submit-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (!response.ok) {
      // Display error message to user
      toast.error(result.error || 'Failed to submit product');
      return;
    }

    // Show success
    toast.success(result.message);
    console.log('Product created:', result.data);
  } catch (error) {
    toast.error('Network error: ' + error.message);
  }
};
```

---

## Backwards Compatibility

✅ **Variants are fully optional**
- Existing code without variants continues to work
- Variants field is nullable
- No breaking changes to API contract
- Old requests work exactly as before

```javascript
// Old request (still works)
{
  "name": "Product",
  "category": "Electronics",
  "price": 99.99,
  "quantity": 50,
  "agent_id": "uuid",
  "image_urls": ["url"]
}
// No variants field needed ✓

// New request with variants
{
  "name": "Product",
  "category": "Electronics",
  "price": 99.99,
  "quantity": 50,
  "agent_id": "uuid",
  "image_urls": ["url"],
  "variants": [
    { "type": "Color", "values": ["Red", "Blue"] }
  ]
}
// With variants ✓
```

---

## Version History

### v2.1.0 (Current)
- ✅ Added comprehensive agent validation
- ✅ Enhanced input validation with specific error messages
- ✅ Added product variants support
- ✅ Improved type safety with TypeScript interfaces

### v2.0.0
- Initial product submission API

---

## Support & Questions

For questions about the API:
1. Check CHANGELOG.md for detailed changes
2. Review examples in this file
3. Check implementation_summary.md for architecture
4. See app/api/agent/wholesale/submit-product/route.ts for source code

---

**Last Updated**: February 15, 2026  
**API Version**: 2.1.0  
**Status**: Production Ready
