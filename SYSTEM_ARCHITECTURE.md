# System Architecture & Data Flow

## Overall System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT PUBLISHING SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

                           THREE MAIN COMPONENTS
                                   
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ 1. AGENT FACING  │    │ 2. ADMIN FACING  │    │ 3. DATABASE      │
│ Publishing Page  │    │ Permission Ctrl  │    │ Storage          │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ /agent/publish   │    │ /admin/agents    │    │ Supabase         │
│ -products        │    │ /admin/wholesale │    │                  │
│                  │    │                  │    │ agents table     │
│ - Form           │    │ - Toggle switch  │    │ - can_publish... │
│ - Image upload   │    │ - Agent list     │    │ - isapproved     │
│ - Validation     │    │ - Details dialog │    │                  │
│ - Submit         │    │ - Real-time      │    │ wholesale_       │
│                  │    │   updates        │    │ products table   │
│                  │    │                  │    │ - is_active      │
│                  │    │                  │    │ - created_by     │
│                  │    │                  │    │ - all fields      │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Permission Check Flow

```
AGENT TRIES TO ACCESS: /agent/publish-products
        │
        ▼
    ┌─────────────────────┐
    │ Layer 1: Auth Check │
    │ Is logged in?       │
    └─────────────────────┘
            │
       ┌────┴────┐
      NO        YES
       │         │
       ▼         ▼
    Redirect   ┌──────────────────────┐
    to login   │ Layer 2: Approval    │
              │ Is isapproved=true?  │
              └──────────────────────┘
                      │
                 ┌────┴────────┐
                NO             YES
                 │              │
                 ▼              ▼
              Access        ┌──────────────────────┐
              Denied        │ Layer 3: Permission  │
              Message       │ is_publish_prods=T? │
                            └──────────────────────┘
                                    │
                               ┌────┴────┐
                              NO        YES
                               │         │
                               ▼         ▼
                            Access   GRANT
                            Denied   ACCESS
                            Message
```

---

## Product Submission Flow

```
AGENT FILLS FORM
        │
        ▼
    VALIDATES
    ├─ Name? ✓
    ├─ Category? ✓
    ├─ Price? ✓
    ├─ Quantity? ✓
    └─ Image? ✓
        │
        ▼
    CREATES PRODUCT
    ├─ name: [form input]
    ├─ description: [form input]
    ├─ category: [form input]
    ├─ price: [form input]
    ├─ quantity: [form input]
    ├─ image_urls: [uploaded/pasted]
    ├─ is_active: FALSE ← KEY!
    ├─ created_by: [agent_id]
    └─ commission_value: [optional]
        │
        ▼
    INSERTED TO DATABASE
    ├─ Table: wholesale_products
    └─ Status: Pending
        │
        ▼
    TOAST MESSAGE
    └─ "Product submitted successfully!"
        │
        ▼
    FORM RESETS
    ├─ Fields cleared
    └─ Ready for next product
```

---

## Admin Permission Control Flow

```
ADMIN VIEWS AGENT DETAILS
    │
    ▼
┌─────────────────────────┐
│ Details Dialog Opens    │
├─────────────────────────┤
│ Basic Information       │
│ ├─ ID                   │
│ ├─ Name                 │
│ ├─ Phone                │
│ ├─ Status               │
│ └─ [TOGGLE SWITCH] ◄─── Current value shown
│     Can Publish Products│
└─────────────────────────┘
    │
    ▼ [Admin clicks toggle]
    │
    ┌─────────────┐
    │ TOGGLE ON   │ or │ TOGGLE OFF
    │             │    │
    │ Updates DB: │    │ Updates DB:
    │ can_publish │    │ can_publish
    │ _products   │    │ _products
    │ = TRUE      │    │ = FALSE
    └─────────────┘    └────────────┘
        │                   │
        ▼                   ▼
    Updates UI         Updates UI
    ├─ selectedAgent   ├─ selectedAgent
    ├─ agents list     ├─ agents list
    └─ switch state    └─ switch state
        │                   │
        ▼                   ▼
    Toast:              Toast:
    "Enabled            "Disabled
     publishing..."      publishing..."
        │                   │
        └───────┬───────────┘
                ▼
        Agent Status Changes
        IMMEDIATELY!
```

---

## Product Approval Flow

```
AGENT SUBMITS PRODUCT (is_active: false)
        │
        ▼
    APPEARS IN /admin/wholesale
        │
        ▼
    PRODUCT MANAGEMENT TAB
    ├─ Status: Inactive
    ├─ Created by: [Agent Name]
    └─ Ready for review
        │
        ▼
    ADMIN VIEWS PRODUCT
        │
        ├─────────────────────┐
        │                     │
        ▼                     ▼
    EDIT DETAILS?         APPROVE AS-IS?
        │                     │
        ▼                     ▼
    ┌─────────────┐    ┌──────────────┐
    │ Modify:     │    │ Toggle Active│
    │ ├─ Price    │    │ is_active=   │
    │ ├─ Desc     │    │ TRUE         │
    │ ├─ Category │    └──────────────┘
    │ └─ Save     │           │
    └─────────────┘           │
        │                     │
        ▼                     ▼
        └──────┬──────────────┘
               │
               ▼
        PRODUCT ACTIVATED
        (is_active: TRUE)
               │
               ▼
        VISIBLE IN /agent/wholesale
               │
               ▼
        OTHER AGENTS CAN PURCHASE
```

---

## Database Schema (Relevant Fields)

```
TABLE: agents
├─ id (UUID primary key)
├─ full_name (text)
├─ phone_number (text)
├─ isapproved (boolean) ← Layer 2 permission
├─ can_publish_products (boolean) ← Layer 3 permission [NEW]
├─ wallet_balance (numeric)
├─ created_at (timestamp)
└─ ... other fields

TABLE: wholesale_products
├─ id (UUID primary key)
├─ name (text)
├─ description (text)
├─ category (text)
├─ price (numeric)
├─ commission_value (numeric)
├─ quantity (integer)
├─ delivery_time (text)
├─ image_urls (text[])
├─ is_active (boolean) ← Visibility control
├─ created_by (UUID) ← Agent tracking [NEW]
├─ created_at (timestamp)
└─ ... other fields
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT DASHBOARD                               │
│  (app/agent/dashboard/page.tsx)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AgentMenuCards Component                                 │  │
│  │ (components/agent/AgentMenuCards.tsx)                    │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────┐                      │  │
│  │  │ "Publish Products" Card   [NEW]│                      │  │
│  │  │                                 │                      │  │
│  │  │ [Upload Icon]                   │                      │  │
│  │  │ "Publish Products"              │                      │  │
│  │  │ "Upload products for wholesale" │                      │  │
│  │  │                                 │                      │  │
│  │  │ [PUBLISH NOW Button]  ───┐     │                      │  │
│  │  └────────────────────────┬──┘     │                      │  │
│  └──────────────────────────┼────────┼──────────────────────┘  │
│                             │        │                          │
│  Also renders:              │        │                          │
│  ┌────────────────────────┐ │        │                          │
│  │ publish-products tab   │ │        │                          │
│  │ (in dashboard tabs)    │ │        │                          │
│  │ [NEW]                  │ │        │                          │
│  └────────────────────────┘ │        │                          │
│                             │        │                          │
│                             ▼        ▼                          │
│              /agent/publish-products                             │
│              (app/agent/publish-products/page.tsx) [NEW]        │
└─────────────────────────────────────────────────────────────────┘
        │
        │ Permission Check
        │ Layer 1,2,3
        │
        ├─ Auth: ✓
        ├─ Approved: ✓
        └─ Can Publish: ?
             │
        ┌────┴─────┐
       NO          YES
        │           │
        ▼           ▼
    Access      Form
    Denied      Interface
    View        │
                ├─ Image Upload
                ├─ Category Select
                ├─ Price Input
                ├─ Validation
                └─ Submit
                    │
                    ▼
            INSERT to wholesale_products
            (is_active: false)
                    │
                    ▼
            /admin/wholesale (for review)
```

---

## Admin Control Location Map

```
/admin (Admin Dashboard)
│
└─ AGENTS MANAGEMENT TAB
   │
   ├─ Search Bar
   │  └─ Find agent by name/phone
   │
   └─ Agent Cards Grid
      │
      └─ Agent Card
         │
         ├─ Basic Info
         │  ├─ Name
         │  ├─ Phone
         │  └─ Status badge
         │
         ├─ Stats
         │  ├─ Wallet balance
         │  ├─ Commission
         │  ├─ Orders
         │  └─ Referrals
         │
         ├─ Buttons
         │  ├─ CSV Export
         │  ├─ Clear Records
         │  └─ [View Details] ──┐
         │                      │
         └─ Details Dialog      │
            [Opens when        │
             clicked]          │
            │◄─────────────────┘
            │
            ├─ Basic Information
            │  ├─ ID
            │  ├─ Name
            │  ├─ Phone
            │  ├─ Region
            │  └─ Status badge
            │
            ├─ [NEW]
            │  ├─ Upload Icon
            │  ├─ "Can Publish Products"
            │  └─ [TOGGLE SWITCH] ◄─── Toggle here
            │
            ├─ Account Summary
            │  ├─ Wallet Balance
            │  ├─ Commission
            │  ├─ Orders
            │  ├─ Referrals
            │  ├─ Joined Date
            │  └─ Last Login
            │
            └─ Transaction Summary
               (loads on demand)
```

---

## Data Flow Summary

```
AGENT                           SYSTEM                          DATABASE
│                               │                                │
├─ Login ────────────────────────► Check stored session           │
│                               │                                │
├─ Go to dashboard ─────────────► Load dashboard ────────────────► Query agents
│                               │ Check permissions               │
│                               │ (isapproved, can_publish)      │
│                               │                                │
├─ Click "Publish" ────────────► Route to /publish-products      │
│                               │ Permission check (3 layers)    │
│                               │                                │
├─ If allowed: ─────────────────► Show form                      │
│   - Fill details             │                                │
│   - Upload images            │                                │
│   - Click Submit ────────────► Validate form                   │
│                               │ Create product object          │
│                               ├─ is_active: false             │
│                               ├─ created_by: agent_id         │
│                               │                                │
│                               ├─────────────────────────────► INSERT
│                               │ (into wholesale_products)      │
│                               │                                │
│                               ◄──────────── Confirmation ──────┤
│                               │                                │
├─ See toast message ◄─────────── "Product submitted!"           │
│   Form resets                │                                │

ADMIN                           SYSTEM                          DATABASE
│                               │                                │
├─ Go to /admin ────────────────► Load admin dashboard           │
│                               │                                │
├─ Click Agents Tab ────────────► Load agents list ──────────────► Query all
│                               │                                 agents
│                               │                                │
├─ Search for agent ───────────► Filter agents list              │
│                               │ Show matching cards            │
│                               │                                │
├─ Click View Details ──────────► Open details dialog ──────────► Query agent
│                               │ Load agent data                 data
│                               │                                │
├─ Toggle permission ──────────► Capture change event            │
│                               │ Update UI                      │
│                               │ Call update API                │
│                               │                                │
│                               ├─────────────────────────────► UPDATE
│                               │ (agents.can_publish_products) │
│                               │                                │
│                               ◄─── Success confirmation ──────┤
│                               │                                │
└─ See toast ◄─────────────────── "[Agent] permission updated"   │

ADMIN                           SYSTEM                          DATABASE
│                               │                                │
├─ Go to /admin/wholesale ──────► Load wholesale dashboard       │
│                               │                                │
├─ Click Product Mgmt ──────────► Load products ──────────────────► Query where
│                               │ Filter by is_active           │ is_active=f
│                               │ Show pending products          │
│                               │                                │
├─ Find agent product ──────────► Display with:                  │
│ (is_active: false)            │ - created_by: [Agent name]    │
│                               │ - status: Inactive             │
│                               │                                │
├─ Toggle to active ───────────► Capture toggle ──────────────────► UPDATE
│                               │ Update UI                      │ is_active=true
│                               │                                │
│                               ◄─ Confirmation ─────────────────┤
│                               │                                │
└─ Product now visible ◄───────── Update /agent/wholesale        │
   to all agents                │ (shows all active products)    │
```

---

## Security Layers Visualization

```
           ╔═══════════════════════════════════════════╗
           ║     AGENT TRIES TO ACCESS PAGE            ║
           ║   /agent/publish-products                 ║
           ╚═════════════════════════════════════════════╝
                         │
                         ▼
           ┌─────────────────────────────────┐
           │    LAYER 1: AUTHENTICATION      │
           │    Is user logged in?           │
           │                                 │
           │    Check: localStorage['agent'] │
           └─────────────────────────────────┘
                    │              │
               ┌────┴─────┐        │
              NO          YES      │
               │           │       │
               ▼           ▼       │
            404      ┌──────────────────────────┐
           Login    │  LAYER 2: PLATFORM APP.  │
           Page     │  Is account approved?    │
                    │                          │
                    │  Check: isapproved=true │
                    └──────────────────────────┘
                          │           │
                      ┌───┴─────┐     │
                     NO        YES    │
                      │         │     │
                      ▼         ▼     │
                   Alert   ┌──────────────────────┐
                    Msg    │ LAYER 3: PERMISSION  │
                           │ Can publish products?│
                           │                      │
                           │ Check:               │
                           │ can_publish_products │
                           │ = true               │
                           └──────────────────────┘
                                │         │
                            ┌───┴─────┐   │
                           NO        YES  │
                            │         │   │
                            ▼         ▼   │
                        Locked    ╔═══════════════╗
                        Page      ║ ACCESS        ║
                                  ║ GRANTED       ║
                                  ║               ║
                                  ║ Show Form:    ║
                                  ║ - Product     ║
                                  ║ - Images      ║
                                  ║ - Submit      ║
                                  ╚═══════════════╝
```

---

## File Organization

```
PROJECT ROOT
│
├─ app/
│  ├─ agent/
│  │  ├─ dashboard/
│  │  │  └─ page.tsx ................. (modified)
│  │  └─ publish-products/
│  │     └─ page.tsx ................. (NEW)
│  │
│  ├─ admin/
│  │  ├─ agents/
│  │  │  └─ page.tsx ................. (unchanged)
│  │  └─ wholesale/
│  │     └─ page.tsx ................. (unchanged)
│  │
│  └─ no-registration/
│     └─ page.tsx .................... (modified)
│
├─ components/
│  ├─ agent/
│  │  └─ AgentMenuCards.tsx .......... (modified)
│  │
│  └─ admin/
│     └─ tabs/
│        └─ AgentManagementTab.tsx ... (modified)
│
├─ lib/
│  ├─ agent-auth.ts .................. (modified)
│  └─ wholesale.ts ................... (unchanged)
│
└─ Documentation/
   ├─ AGENT_PUBLISHING_GUIDE.md ....... (NEW)
   ├─ IMPLEMENTATION_SUMMARY.md ....... (NEW)
   ├─ QUICK_START.md ................. (NEW)
   └─ SYSTEM_ARCHITECTURE.md ......... (NEW - this file)
```

---

## Deployment Checklist

- ✅ All new files created
- ✅ All existing files modified correctly
- ✅ Permission logic implemented
- ✅ Form validation in place
- ✅ Image upload functional
- ✅ Admin toggle working
- ✅ Database queries correct
- ✅ Error handling added
- ✅ Toast notifications active
- ✅ Mobile responsive

---

**System Status**: PRODUCTION READY  
**Last Updated**: February 9, 2026
