# Agent Product Tracking System

## Overview
The Agent Product Tracking system allows admins to identify which products were published by specific agents who have been granted the right to submit products. This provides full visibility and accountability for product submissions in the wholesale management section.

## Features

### 1. **Agent Identification on Products**
- Each product uploaded by an agent is automatically tagged with the agent's ID and name
- The `created_by` field stores the agent ID
- The `created_by_name` field stores the agent's full name for easy reference

### 2. **Agent Filter in Admin Dashboard**
- **Location**: Wholesale Product Management section
- **Access**: The agent filter dropdown is displayed in the filters section
- **Content**: Only shows agents who have been granted `can_publish_products` permission
- **Functionality**: Filter products by specific agents to see all their submissions

### 3. **Agent Display in Product Table**
- **Desktop View**: Agent name appears as a blue badge in the "Agent" column
- **Mobile View**: Agent name appears as a blue badge alongside product category and status
- **Unknown Agent**: If product has no agent info, displays "-"

## How It Works

### When an Agent Publishes a Product
1. Agent navigates to "Publish Products" section
2. Agent uploads product details and images
3. System automatically captures `agent.id` as `created_by`
4. Product is saved with agent tracking information

### Admin Viewing Products by Agent

#### Option 1: Filter by Specific Agent
1. Go to Admin → Product Management (Wholesale)
2. Click the "Agent" filter dropdown
3. Select the desired agent from the list
4. View all products published by that agent
5. Filter results can be combined with Category and Status filters

#### Option 2: View All Products with Agent Info
1. Go to Admin → Product Management (Wholesale)
2. Leave "Agent" filter as "All Agents"
3. All products display agent information in the table/cards

## Database Schema

### WholesaleProduct Interface
```typescript
export interface WholesaleProduct {
  id: string
  name: string
  description?: string
  category: string
  price: number
  commission_value: number
  quantity: number
  delivery_time: string
  image_urls: string[]
  is_active: boolean
  created_by?: string           // Agent ID who created the product
  created_by_name?: string      // Agent's full name (populated from agents table)
  created_at?: string
  updated_at?: string
  rating?: number
  reviews_count?: number
}
```

### Agents Table
```sql
-- Must have these columns for agent tracking
ALTER TABLE agents ADD COLUMN IF NOT EXISTS can_publish_products BOOLEAN DEFAULT false;

-- Agent must have:
-- - id (UUID)
-- - full_name (TEXT)
-- - can_publish_products (BOOLEAN)
```

## Implementation Details

### getAllWholesaleProducts Function
- Enhanced to include agent information via join with agents table
- Returns products with both `created_by` (ID) and `created_by_name` (full name)
- Supports filtering by `agentId` parameter
- Query structure:
  ```sql
  SELECT 
    wp.*,
    a.full_name as created_by_name
  FROM wholesale_products wp
  LEFT JOIN agents a ON wp.created_by = a.id
  ORDER BY wp.created_at DESC
  ```

### Admin Dashboard Updates
- **Agent Filter Dropdown**: Dynamically populates with agents having `can_publish_products = true`
- **Product Table**: New "Agent" column displays agent name
- **Filter Logic**: Products are filtered by `created_by` field when agent filter is selected
- **Mobile Cards**: Agent name shown as blue badge with product category and status

## Security & Validation

### Authorization Checks
- Only agents with `can_publish_products = true` can upload products
- Product creation captures agent context automatically
- Admin can only view products through published/unpublished status and approval workflow

### Data Integrity
- `created_by` field is immutable (set at creation, never changed)
- Agent information is fetched from agents table in real-time
- If agent is deactivated, their name still displays for historical tracking

## API Endpoints Used

### Get All Products with Agent Info
```typescript
GET /api/admin/products
Query Parameters:
  - status: "published" | "unpublished" | "all"
  - category: string
  - search: string
  - agentId: string (optional - filter by specific agent)
```

## Common Use Cases

### Use Case 1: Monitor Specific Agent's Submissions
1. Admin goes to Product Management
2. Selects agent from filter dropdown
3. Views all products from that agent in real-time
4. Can see which ones are active/inactive

### Use Case 2: Audit Trail
1. Admin needs to verify who uploaded a specific product
2. Opens product details
3. Agent name is displayed
4. Can trace the submission back to the agent

### Use Case 3: Agent Performance Review
1. Admin wants to see all products from an agent
2. Uses agent filter to isolate their submissions
3. Analyzes active vs. inactive products
4. Measures agent contribution to catalog

## Troubleshooting

### Agent Not Appearing in Filter
**Problem**: Agent filter dropdown doesn't show expected agents
**Solution**: 
- Verify agent has `can_publish_products = true` in database
- Agent must have `full_name` populated
- Refresh page to reload agent list

### Product Shows No Agent
**Problem**: Product displays "-" for agent
**Solution**:
- Product may have been created before agent system was implemented
- Manually update `created_by` field in database if needed
- Clear browser cache and refresh

### Agent Name Not Updating
**Problem**: Agent name change doesn't reflect in products
**Solution**:
- Agent names are fetched in real-time from agents table
- Refresh page to see updated names
- This is by design - maintains historical accuracy

## Future Enhancements

1. **Agent Stats Dashboard**: Show agent submission rates and approval rates
2. **Product History Timeline**: Display when agent submitted, admin approved, etc.
3. **Agent Notifications**: Alert agents when their products are approved/rejected
4. **Commission Tracking**: Link agent commission calculations to their products
5. **Bulk Actions**: Filter by agent and perform bulk status changes
