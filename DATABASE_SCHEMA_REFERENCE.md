# Database Schema Reference - Registration & Properties

## Agents Table

### Columns Used in Implementation

| Column | Type | Default | Used By | Purpose |
|--------|------|---------|---------|---------|
| `id` | UUID | gen_random_uuid() | All modules | Agent identifier |
| `full_name` | VARCHAR | NULL | Registration, WhatsApp | Agent's full name |
| `agent_name` | VARCHAR | NULL | Registration | Display name for agent |
| `phone_number` | VARCHAR | REQUIRED | Registration | Contact number |
| `email` | VARCHAR | NULL | Paystack | Email for payment receipts |
| `isapproved` | BOOLEAN | false | Payment Verify, Dashboard | Account approval status |
| `can_publish_properties` | BOOLEAN | false | Payment Verify, Publish | Permission to publish properties |
| `can_update_properties` | BOOLEAN | false | Payment Verify, Edit | Permission to edit properties |
| `password_hash` | TEXT | NULL | Authentication | Hashed password |
| `momo_number` | VARCHAR | NULL | Registration | Mobile money number |
| `region` | VARCHAR | NULL | Registration | Geographic region |
| `wallet_balance` | NUMERIC | 0.00 | Wallet | Account balance |
| `created_at` | TIMESTAMP | now() | Audit | Registration timestamp |
| `updated_at` | TIMESTAMP | now() | Audit | Last update timestamp |
| `status` | VARCHAR | 'active' | Status checks | Account status |

### Key Fields for This Implementation

```sql
-- What changes on payment verification:
UPDATE agents SET
  isapproved = true,                    -- Agent now approved
  can_publish_properties = true,        -- Can submit properties
  can_update_properties = true,         -- Can edit properties
  updated_at = NOW()
WHERE id = agent_id;

-- What's checked when publishing:
SELECT id, can_publish_properties, can_update_properties
FROM agents
WHERE id = agent_id AND (isapproved = true OR can_publish_properties = true);
```

---

## Properties Table

### Columns Used in Implementation

| Column | Type | Default | Used By | Purpose |
|--------|------|---------|---------|---------|
| `id` | UUID | gen_random_uuid() | All modules | Property identifier |
| `title` | VARCHAR | REQUIRED | Display, Search | Property name |
| `description` | TEXT | NULL | Display | Property details |
| `category` | VARCHAR | NULL | Organization | Property category |
| `price` | NUMERIC | NULL | Display | Property price |
| `currency` | VARCHAR | NULL | Display | Currency code |
| `location` | VARCHAR | NULL | Display | Property location |
| `is_approved` | BOOLEAN | false | Visibility | Publication status ⭐ KEY |
| `published_by_agent_id` | UUID | NULL | Audit | Agent who submitted |
| `image_urls` | TEXT[] | NULL | Display | Property images |
| `details` | JSONB | NULL | Storage | Additional details |
| `commission` | NUMERIC | 0 | Commission | Agent commission |
| `created_at` | TIMESTAMP | now() | Audit | Submission timestamp |
| `updated_at` | TIMESTAMP | now() | Audit | Last update timestamp |

### Key Fields for This Implementation

```sql
-- What gets set when property submitted by agent:
INSERT INTO properties (
  title, description, category, price, currency, location,
  is_approved,                           -- Always FALSE initially
  published_by_agent_id,                 -- Agent's ID
  image_urls, details, commission
) VALUES (...);

-- What visibility query looks like:
SELECT * FROM properties
WHERE is_approved = true                 -- Only show approved properties
AND published_by_agent_id IS NOT NULL;

-- What admin sees (pending review):
SELECT * FROM properties
WHERE is_approved = false                -- Show all pending
ORDER BY created_at DESC;
```

---

## Payment/Paystack Integration

### Not a Database Table - API Integration

**Data Flow**:
1. **Initialize Payment** → `/api/paystack/register/initialize`
   - Input: `agent_id`, `agent_name`, `email`, `amount`
   - Output: `authorization_url`, `access_code`, `reference`

2. **Paystack Gateway** → External (not in database yet)
   - Agent makes payment
   - Paystack processes transaction

3. **Verify Payment** → `/api/paystack/register/verify`
   - Input: `reference` (from Paystack), `agent_id`
   - Process: 
     - Verify with Paystack API
     - Update agents table if successful
   - Output: Success/failure response

### Email Captured During Payment

```typescript
// In registration-payment page:
const [email, setEmail] = useState("");

// Sent to Paystack:
{
  email: email,                   // ← Captured from agent
  amount: 4700,                   // ₵47 in pesewas
  metadata: {
    agent_id: agent_id,
    agent_name: agent_name,
    registration_type: "agent_registration"
  }
}

// Paystack Result
{
  reference: "unique_reference_id",
  status: "success",
  amount: 4700,
  customer: { email: agent_email }  // Matches input
}
```

---

## WhatsApp Integration

### Not a Database Table - Utility Function

**Location**: `utils/whatsapp.ts`

```typescript
// Function: generateWhatsAppLink(message)
// Input: String message
// Output: WhatsApp web URL with pre-filled message

// Example:
const message = "Hello, I completed payment...";
const url = generateWhatsAppLink(message);
// Result: https://wa.me/233242799990?text=<encoded_message>

// When clicked:
// 1. Opens WhatsApp web (or app)
// 2. Pre-fills message to +233242799990
// 3. Agent sends confirmation
// 4. Admin receives agent name, ID, amount, timestamp
```

---

## Data Dependencies

### Registration Flow Dependencies

```
agents table
  ├── isapproved (starts false, updated to true on payment)
  ├── can_publish_properties (starts false, updated to true on payment)
  ├── can_update_properties (starts false, updated to true on payment)
  └── email (captured during payment, used for Paystack receipt)

Paystack API (external)
  ├── email (sent during payment init)
  ├── agent_id in metadata (sent during init)
  └── verification response (used for agent update)

WhatsApp Web (external)
  └── agent_id, payment_amount, timestamp (shown in pre-filled message)
```

### Property Publishing Dependencies

```
agents table
  ├── isapproved = true (required to publish)
  ├── can_publish_properties = true (required to publish)
  └── id (stored as published_by_agent_id)

properties table
  ├── published_by_agent_id (references agents.id)
  ├── is_approved = false (set by submit-property API)
  └── created_at (timestamp of submission)

Admin Dashboard (implicit)
  └── Queries WHERE is_approved = false
```

---

## Query Examples

### Check if Agent Can Publish

```sql
-- Used by: /agent/publish-properties page
SELECT id, can_publish_properties, isapproved
FROM agents
WHERE id = 'agent-uuid'
  AND (isapproved = true OR can_publish_properties = true);
```

### Get Pending Properties for Admin Review

```sql
-- Used by: Admin property management
SELECT p.id, p.title, p.price, p.published_by_agent_id, 
       a.full_name, p.created_at
FROM properties p
LEFT JOIN agents a ON p.published_by_agent_id = a.id
WHERE p.is_approved = false
ORDER BY p.created_at DESC;
```

### Get Published Properties for Marketplace

```sql
-- Used by: Property listing pages
SELECT p.id, p.title, p.price, p.location, p.image_urls,
       a.full_name as agent_name
FROM properties p
JOIN agents a ON p.published_by_agent_id = a.id
WHERE p.is_approved = true
ORDER BY p.created_at DESC;
```

### Get Agent Status After Payment

```sql
-- Used by: Registration complete page
SELECT isapproved, can_publish_properties, can_update_properties
FROM agents
WHERE id = 'agent-uuid';
```

### Auto-Approval Update (What Paystack Verify Does)

```sql
-- Used by: /api/paystack/register/verify route
UPDATE agents
SET 
  isapproved = true,
  can_publish_properties = true,
  can_update_properties = true,
  updated_at = NOW()
WHERE id = 'agent-uuid';
```

---

## Data Types Reference

| Type | Example | Notes |
|------|---------|-------|
| UUID | `550e8400-e29b-41d4-a716-446655440000` | Standard 36-char UUID |
| VARCHAR | `Ama Mensah`, `+233501234567` | Text with max length |
| BOOLEAN | `true`, `false` | Only true/false values |
| NUMERIC | `2500.00`, `47.00` | Decimal numbers for money |
| TIMESTAMP | `2026-02-28T10:30:45Z` | Date + time with timezone |
| TEXT[] | `[url1, url2, url3]` | Array of text values |
| JSONB | `{"size": 1000, "color": "red"}` | JSON binary format |

---

## Important Notes

### 1. Default Values
- `is_approved` starts as `false` for all new properties
- `isapproved` starts as `false` for all new agents
- Both change only through explicit API updates or admin action

### 2. No Cascading Deletes
- Properties can exist without agents (orphaned records)
- Should add constraint: `FOREIGN KEY published_by_agent_id REFERENCES agents(id)`

### 3. Indexing (Recommended)

```sql
-- Performance indexes for common queries:
CREATE INDEX idx_properties_is_approved ON properties(is_approved);
CREATE INDEX idx_properties_published_by ON properties(published_by_agent_id);
CREATE INDEX idx_agents_isapproved ON agents(isapproved);
CREATE INDEX idx_agents_can_publish ON agents(can_publish_properties);
```

### 4. Audit Trail
All tables should have `created_at` and `updated_at` for tracking changes.

---

## Environment Variables Referenced

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYSTACK_SECRET_KEY=your-paystack-secret
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Used In:
- **Supabase Connection**: All database queries
- **Paystack Verification**: Payment confirmation
- **Callback URLs**: Payment success redirect

---

## Testing Data Setup

### Create Test Agent (Before Payment)
```sql
INSERT INTO agents (full_name, agent_name, phone_number, email, isapproved, momo_number, region)
VALUES (
  'Test Agent',
  'Test Agent',
  '0501234567',
  'test@example.com',
  false,
  '0501234567',
  'Greater Accra'
);
```

### Create Test Property (Unpublished)
```sql
INSERT INTO properties (title, description, category, price, currency, location, is_approved, published_by_agent_id, image_urls)
VALUES (
  'Test Property',
  'A test property',
  'Residential',
  100000,
  'GHS',
  'Accra',
  false,
  'agent-uuid-here',
  ARRAY['https://example.com/image.jpg']
);
```

---

**Last Updated**: February 28, 2026  
**Database Version**: Aligned with v2.2.0 implementation
