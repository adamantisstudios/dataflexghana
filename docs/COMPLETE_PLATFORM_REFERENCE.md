# Complete Platform Reference Documentation

**Version:** 1.0  
**Last Updated:** 2024  
**Total Codebase Files:** 817 (TSX/TS)  
**Total API Routes:** 141  
**Total Pages:** 81  
**Total Components:** 336+  
**Total Database Migrations:** 100+  

---

## TABLE OF CONTENTS

1. [Platform Overview](#platform-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [User Roles & Permission Matrix](#user-roles--permission-matrix)
4. [Complete Database Schema](#complete-database-schema)
5. [All API Routes (141 Endpoints)](#all-api-routes-141-endpoints)
6. [All Pages & Routes (81 Pages)](#all-pages--routes-81-pages)
7. [Core Components (336+ Components)](#core-components-336-components)
8. [Library Utilities & Helpers](#library-utilities--helpers)
9. [Dashboard Systems](#dashboard-systems)
10. [Feature Systems & Workflows](#feature-systems--workflows)
11. [Authentication & Authorization](#authentication--authorization)
12. [Payment Integration (Paystack)](#payment-integration-paystack)
13. [Real-Time Features](#real-time-features)
14. [Storage & Media Management](#storage--media-management)
15. [Commission & Earnings System](#commission--earnings-system)
16. [Referral System](#referral-system)
17. [Notifications & Alerts](#notifications--alerts)
18. [Search & Discovery](#search--discovery)
19. [Mobile-First UX Patterns](#mobile-first-ux-patterns)
20. [Performance & Optimization](#performance--optimization)

---

## PLATFORM OVERVIEW

This is a **multi-service marketplace platform** built on Next.js 14+ with Supabase as the database. It serves agents, administrators, and end-users across multiple verticals including:

- **Salon & Beauty Services** (bookings, referrals, service management)
- **Real Estate & Properties** (agent listings, sales, commissions)
- **Wholesale & E-Commerce** (product marketplace, bulk orders)
- **Fashion Avenue** (product management, referrals, commissions)
- **Data Bundles & Telecom** (MTN AFA, data orders, commission tracking)
- **Job Board** (job listings, candidate search, application tracking)
- **Domestic Workers** (service requests, client management)
- **Online Teaching** (channels, courses, video content, Q&A)
- **Professional Writing Services** (document generation, templates)
- **Savings Plans** (financial products, withdrawal management)
- **Business Registration** (partnership forms, bank account registration, company shares)

**Business Model:** Commission-based multi-service platform where agents earn commissions on sales, referrals, and completed transactions across all service verticals.

---

## ARCHITECTURE & TECHNOLOGY STACK

### Frontend Stack
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18+
- **Component Library:** shadcn/ui
- **Styling:** Tailwind CSS v4
- **State Management:** React Hooks + SWR for data fetching
- **Icons:** Lucide React
- **Form Handling:** React Hook Form (implied)
- **Toast Notifications:** Sonner

### Backend Stack
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes (Rest endpoints)
- **Real-Time:** Supabase Realtime subscriptions
- **File Storage:** Supabase Storage Buckets
- **Payment Gateway:** Paystack Integration
- **SMS Notifications:** SMS service (SMS config system)
- **Image Processing:** Image compression utilities, CDN-compatible URLs
- **Audio Processing:** Opus encoder/decoder for audio storage

### Development Tools
- **Package Manager:** pnpm (inferred)
- **TypeScript:** Full type safety
- **Database Migrations:** SQL scripts in `/scripts` folder
- **Logging & Monitoring:** Debug/logging utilities

---

## USER ROLES & PERMISSION MATRIX

### Role 1: AGENT (Individual Service Provider/Marketplace Seller)

**Primary Identity:** Independent service provider, sales agent, or product seller

**Agent Features & Permissions:**

| Feature | Permission | Details |
|---------|-----------|---------|
| **Dashboard Access** | ✓ Full | Agent-specific dashboard with earnings, activity tracking |
| **Profile Management** | ✓ Edit | Name, contact info, bio, KYC verification |
| **Service Publishing** | ✓ Create/Edit | Publish salon services, products, properties |
| **Sales & Commissions** | ✓ Track | View earnings from multiple service verticals |
| **Referral Program** | ✓ Full | Generate referral links, track conversions, earn commissions |
| **Wallet Management** | ✓ Full | View balance, request withdrawals, track transactions |
| **Data Orders** | ✓ Create | Submit bulk data orders, track status, download results |
| **Properties** | ✓ Create/Manage | Publish real estate listings, upload images, manage inquiries |
| **Wholesale Marketplace** | ✓ Full | Upload products, manage inventory, process orders |
| **Fashion Products** | ✓ Create/Sell | Publish fashion items, manage variants, earn commissions |
| **Savings Plans** | ✓ Participate | Enroll in savings schemes, make deposits, request withdrawals |
| **Chat & Messaging** | ✓ Send/Receive | Direct customer communication via WhatsApp integration |
| **Payment Methods** | ✓ Register | Add bank accounts for payouts |
| **Compliance & Documentation** | ✓ Upload | Submit verification documents, KYC info |
| **Teaching/Training Channel** | ✓ Full | Join channels, access courses, upload educational content |
| **Professional Writing** | ✓ Full | Use writing templates, request custom documents |
| **Online Courses** | ✓ Enroll/View | Access educational content, track progress |
| **MTN AFA Registration** | ✓ Submit | Register as MTN AFA agent, track applications |
| **Mobile Subscriptions** | ✓ Purchase | Buy data bundles, manage subscriptions |
| **Chat History** | ✓ View | Access conversation history with customers |
| **Rating & Reviews** | ✓ View | See customer feedback and performance ratings |
| **Bulk Order Processing** | ✓ Submit | Place bulk orders for products/services |
| **Withdrawal Requests** | ✓ Request | Submit payout requests, track approval status |
| **Settings & Preferences** | ✓ Manage | Notification settings, communication preferences |
| **Activity Log** | ✓ View | Track personal activity, performance metrics |

**Agent Dashboard Tabs/Sections:**
- Home/Overview (main metrics, quick stats)
- Services/Products (listings management)
- Referrals (program management, link tracking)
- Data Orders (bulk order submission and tracking)
- Wallet (balance, transaction history)
- Withdrawals (payout management)
- Properties (real estate listings)
- Wholesale (product marketplace)
- Fashion Products (fashion inventory)
- Savings Plans (financial products)
- Teaching Channels (educational content)
- Compliance (document verification)
- Settings (profile, preferences)
- Chat (customer communications)

**Agent Authentication:**
- Login via email/password
- Session persistence via Supabase Auth
- Inactivity notifications
- Login notification system

---

### Role 2: ADMIN (Platform Administrator)

**Primary Identity:** Platform operator, data manager, compliance officer

**Admin Features & Permissions:**

| Feature | Permission | Details |
|---------|-----------|---------|
| **Full Dashboard Access** | ✓ View All | Complete platform metrics and statistics |
| **Agent Management** | ✓ Full CRUD | Approve/reject agents, edit profiles, suspend accounts |
| **Agent Approval Workflow** | ✓ Approve/Reject | Review KYC, approve registration, manage compliance |
| **Permission Management** | ✓ Grant/Revoke | Control service publishing permissions per agent |
| **Property Permissions** | ✓ Grant/Revoke | Control real estate listing permissions |
| **Manual Agent Registration** | ✓ Create | Register agents manually for bulk onboarding |
| **Service Management** | ✓ Full CRUD | Create services, manage categories, pricing tiers |
| **Product Management** | ✓ Full CRUD | Manage all products, categories, bulk edit |
| **Data Bundle Management** | ✓ Create/Edit | Create data packages, pricing, network partnerships |
| **Order Management** | ✓ View/Update | Track orders, update status, refund management |
| **Referral Management** | ✓ Approve/Pay | Approve referrals, process commission payments |
| **Wholesale Orders** | ✓ View/Manage | Track wholesale transactions, manage inventory |
| **Wallet Management** | ✓ View All | Monitor all wallets, process top-ups, manage funds |
| **Payout Management** | ✓ Full CRUD | Create payouts, batch process, verify payments |
| **Withdrawal Requests** | ✓ Approve/Reject | Review and process agent payout requests |
| **Commission Tracking** | ✓ View/Adjust | Monitor commissions, apply adjustments, generate reports |
| **Payment Verification** | ✓ Verify | Confirm payments, reconcile transactions |
| **SMS Notifications** | ✓ Send Bulk | Compose and send SMS to agents/users |
| **Compliance Management** | ✓ Review/Approve | Verify documents, manage KYC, track compliance status |
| **Link Cache Management** | ✓ Purge/Refresh | Manage URL preview caches |
| **Audio Management** | ✓ Upload/Delete | Manage audio assets for teaching/content |
| **Video Management** | ✓ Manage | Upload, organize, publish videos |
| **Blog Management** | ✓ Full CRUD | Create blog posts, manage categories, publish content |
| **Savings Plan Admin** | ✓ Full CRUD | Create plans, set rates, manage withdrawals |
| **Fashion Avenue Admin** | ✓ Full CRUD | Manage fashion products, categories, referrals |
| **Salon Management** | ✓ Full CRUD | Manage salon services, bookings, referrals |
| **Properties Management** | ✓ Full CRUD | Manage property listings, agent assignments |
| **Domestic Workers** | ✓ Full CRUD | Manage worker registrations and client requests |
| **Teaching Platform Admin** | ✓ Full CRUD | Manage channels, courses, content, member access |
| **Online Courses Admin** | ✓ Full CRUD | Create courses, manage content, track enrollment |
| **Professional Writing Admin** | ✓ Full CRUD | Manage templates, create documents |
| **Invitation Management** | ✓ Send/Revoke | Send platform invitations, manage access |
| **Sub-Admin Management** | ✓ Create/Manage | Create sub-admin accounts with limited permissions |
| **User Bans & Suspensions** | ✓ Full | Ban/suspend users, manage account restrictions |
| **Password Management** | ✓ Reset | Reset admin passwords, manage security |
| **Maintenance Mode** | ✓ Toggle | Enable/disable maintenance mode for platform |
| **Storage Management** | ✓ Full | Monitor storage usage, cleanup unused files |
| **Automation Rules** | ✓ Configure | Set up automation workflows, agent monitoring |
| **Activity Tracking** | ✓ View All | Monitor all platform activity, generate audit logs |
| **Report Generation** | ✓ Export | Generate CSV/Excel reports for analysis |
| **Chat Moderation** | ✓ View/Monitor | Review user conversations, manage disputes |
| **Bulk Data Import** | ✓ Upload | Bulk import agents, services, data |

**Admin Dashboard Tabs (32+ Management Sections):**
1. Dashboard (overview metrics)
2. Agents (agent management, approval)
3. Agent Management (advanced agent controls)
4. SMS Notifications (bulk messaging)
5. Manual Registration (agent onboarding)
6. Teacher Hub (education platform management)
7. Audio Management (audio asset management)
8. Link Cache (URL preview management)
9. Automation (workflow automation)
10. Performance (analytics dashboard)
11. Domestic Workers (worker management)
12. Client Requests (service requests)
13. Wholesale (wholesale order management)
14. Properties (real estate management)
15. Blogs (content management)
16. Services (service catalog management)
17. Data (data bundle management)
18. Data Bundle Orders Log (order tracking)
19. Wallet Overview (financial overview)
20. Orders (general order management)
21. Bulk Orders (bulk transaction management)
22. Referrals (referral program management)
23. Payouts (payout processing)
24. Wallets (wallet operations)
25. Savings (savings plan management)
26. Compliance (verification management)
27. Professional Writing (document management)
28. Maintenance (platform maintenance)
29. Settings (platform settings)
30. Invitation Management (access control)
31. Online Courses (course management)
32. Fashion Avenue (fashion marketplace)
33. Fashion Project Requests (fashion requests)
34. Fashion Referrals (fashion commissions)
35. Salon & Beauty (salon service management)

**Admin Authentication:**
- Login via email/password
- Separate auth endpoint
- Admin-only session persistence
- Admin role validation on every protected route

---

### Role 3: END USER / PUBLIC USER

**Primary Identity:** Customer, service consumer, buyer

**End User Features & Permissions:**

| Feature | Permission | Details |
|---------|-----------|---------|
| **View Services** | ✓ Read | Browse salon services, jobs, properties |
| **Browse Products** | ✓ Read | View wholesale, fashion, data products |
| **Search & Filter** | ✓ Full | Search by category, location, price, keywords |
| **View Agent Profiles** | ✓ Read | See agent info, ratings, services |
| **Salon Booking** | ✓ Create | Book salon appointments, select services |
| **Property Inquiry** | ✓ Submit | Request property information, schedule viewings |
| **Apply for Jobs** | ✓ Submit | Submit job applications, track status |
| **Domestic Worker Requests** | ✓ Submit | Request domestic help, provide details |
| **Business Registration** | ✓ Submit | Register as business partner, submit forms |
| **View Public Blogs** | ✓ Read | Read blog posts, view categories |
| **View FAQ** | ✓ Read | Access FAQ section, search answers |
| **Contact Support** | ✓ Submit | Submit support requests via forms |
| **View Testimonials** | ✓ Read | See customer reviews and feedback |
| **Terms & Legal** | ✓ Read | Read T&C, privacy policy, legal documents |

---

## COMPLETE DATABASE SCHEMA

### Core Tables (Master Data)

#### 1. Users/Agents Table
```sql
agents
├── id (UUID) - Primary Key
├── email (VARCHAR) - Unique, indexed for auth
├── password_hash (VARCHAR) - Hashed password
├── phone (VARCHAR) - Contact number
├── name (VARCHAR) - Full name
├── business_name (VARCHAR) - Optional business name
├── profile_picture_url (TEXT) - Agent profile photo
├── bio (TEXT) - Agent biography
├── verification_status (VARCHAR) - Pending/Verified/Rejected
├── is_approved (BOOLEAN) - Registration approved
├── approval_date (TIMESTAMP) - When approved
├── approval_by_admin (UUID) - Admin who approved
├── kYC_status (VARCHAR) - KYC verification status
├── kyc_documents (JSONB) - KYC data
├── bank_account_info (JSONB) - Payout bank details
├── location (VARCHAR) - Operating location
├── rating (DECIMAL) - Average rating (0-5)
├── total_reviews (INT) - Review count
├── total_sales (INT) - Sales count
├── total_commission_earned (DECIMAL) - Lifetime earnings
├── banned (BOOLEAN) - Suspension status
├── ban_reason (TEXT) - Why agent was banned
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── created_by_admin (BOOLEAN)
```

#### 2. Admin Table
```sql
admins
├── id (UUID) - Primary Key
├── email (VARCHAR) - Unique
├── password_hash (VARCHAR) - Hashed
├── name (VARCHAR) - Admin name
├── role (VARCHAR) - Admin role/level
├── permissions (JSONB) - Granular permissions
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Service & Product Tables

#### 3. Salon Services
```sql
salon_categories
├── id (BIGSERIAL) - Primary Key
├── name (VARCHAR) - Category name
├── description (TEXT)
├── icon (VARCHAR) - Icon identifier
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

salon_services
├── id (BIGSERIAL) - Primary Key
├── service_name (VARCHAR)
├── service_code (VARCHAR) - Unique
├── description (TEXT)
├── category_id (BIGINT) - Foreign Key
├── base_price (DECIMAL)
├── express_price (DECIMAL)
├── duration_minutes (INT)
├── provider_name (VARCHAR)
├── provider_contact (VARCHAR)
├── provider_location (VARCHAR)
├── provider_availability (TEXT)
├── provider_social_media (JSONB)
├── image_urls (TEXT[])
├── status (VARCHAR) - Active/Inactive
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

salon_bookings
├── id (BIGSERIAL) - Primary Key
├── service_id (BIGINT) - Foreign Key
├── service_name (VARCHAR)
├── client_name (VARCHAR)
├── client_whatsapp (VARCHAR)
├── location (VARCHAR)
├── landmark (VARCHAR)
├── preferred_date (DATE)
├── preferred_time (TIME)
├── notes (TEXT)
├── status (VARCHAR) - Pending/Confirmed/Completed/Cancelled
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

salon_referrals
├── id (BIGSERIAL) - Primary Key
├── referrer_name (VARCHAR)
├── referrer_whatsapp (VARCHAR)
├── referrer_email (VARCHAR)
├── referred_name (VARCHAR)
├── referred_whatsapp (VARCHAR)
├── service_name (VARCHAR)
├── location (VARCHAR)
├── status (VARCHAR) - Pending/Approved/Completed
├── notes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 4. Properties (Real Estate)
```sql
properties
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key (agent who listed)
├── title (VARCHAR)
├── description (TEXT)
├── location (VARCHAR) - Geographic location
├── price (DECIMAL)
├── bedrooms (INT)
├── bathrooms (INT)
├── square_feet (INT)
├── property_type (VARCHAR) - House/Apartment/Land/etc
├── listing_type (VARCHAR) - For Sale/Rent/Lease
├── image_urls (TEXT[])
├── status (VARCHAR) - Active/Sold/Rented/Delisted
├── address (VARCHAR)
├── coordinates (GEOMETRY) - GPS coordinates
├── featured (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 5. Wholesale Products
```sql
wholesale_products
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── title (VARCHAR)
├── description (TEXT)
├── category (VARCHAR)
├── price (DECIMAL)
├── wholesale_price (DECIMAL)
├── quantity_available (INT)
├── min_order_quantity (INT)
├── image_urls (TEXT[])
├── status (VARCHAR) - Active/Inactive/Sold Out
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

wholesale_orders
├── id (UUID) - Primary Key
├── product_id (UUID) - Foreign Key
├── buyer_id (UUID) - Foreign Key (buyer agent)
├── seller_id (UUID) - Foreign Key (seller agent)
├── quantity (INT)
├── total_price (DECIMAL)
├── commission_amount (DECIMAL)
├── status (VARCHAR) - Pending/Processing/Completed/Cancelled
├── payment_status (VARCHAR) - Paid/Pending/Failed
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 6. Fashion Products
```sql
fashion_products
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── title (VARCHAR)
├── description (TEXT)
├── category (VARCHAR)
├── size_variants (JSONB) - Available sizes
├── color_variants (JSONB) - Available colors
├── price (DECIMAL)
├── commission_rate (DECIMAL)
├── image_urls (TEXT[])
├── status (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

fashion_referrals
├── id (UUID) - Primary Key
├── referrer_id (UUID) - Foreign Key (who referred)
├── referred_id (UUID) - Foreign Key (who was referred)
├── product_id (UUID) - Foreign Key
├── status (VARCHAR) - Pending/Approved/Converted/Paid
├── commission (DECIMAL)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Orders & Commerce Tables

#### 7. Data Orders (Telecom)
```sql
data_orders
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── network (VARCHAR) - MTN/Vodafone/AirtelTigo
├── bundle_type (VARCHAR) - Data/Voice/SMS/Mixed
├── quantity (INT) - Batch size
├── unit_price (DECIMAL)
├── total_cost (DECIMAL)
├── commission_earned (DECIMAL)
├── payment_status (VARCHAR) - Pending/Verified/Failed
├── order_status (VARCHAR) - Pending/Processing/Completed/Cancelled
├── payment_reference (VARCHAR) - Payment gateway reference
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

data_bundles
├── id (UUID) - Primary Key
├── network (VARCHAR)
├── bundle_name (VARCHAR)
├── bundle_code (VARCHAR)
├── amount (DECIMAL)
├── validity_days (INT)
├── commission_amount (DECIMAL)
├── commission_percentage (DECIMAL)
├── status (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 8. Bulk Orders
```sql
bulk_orders
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── order_type (VARCHAR) - Data/Wholesale/Products
├── network (VARCHAR) - For data orders
├── quantity (INT)
├── unit_price (DECIMAL)
├── total_cost (DECIMAL)
├── payment_status (VARCHAR) - Pending/Verified/Paid
├── status (VARCHAR) - Pending/Processing/Completed/Failed
├── payment_reference (VARCHAR)
├── verified_at (TIMESTAMP)
├── verified_by (UUID)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Financial Tables

#### 9. Commissions & Earnings
```sql
commissions
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── service_type (VARCHAR) - Salon/Property/Data/Wholesale/Fashion
├── related_order_id (UUID) - Foreign Key to order table
├── amount (DECIMAL)
├── commission_rate (DECIMAL)
├── status (VARCHAR) - Pending/Approved/Paid/Reversed
├── paid_date (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

agent_earnings
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── period (VARCHAR) - Daily/Weekly/Monthly
├── total_earnings (DECIMAL)
├── salon_commissions (DECIMAL)
├── property_commissions (DECIMAL)
├── data_commissions (DECIMAL)
├── wholesale_commissions (DECIMAL)
├── fashion_commissions (DECIMAL)
├── referral_commissions (DECIMAL)
├── total_paid (DECIMAL)
├── total_pending (DECIMAL)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 10. Wallets
```sql
agent_wallets
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key, Unique
├── balance (DECIMAL)
├── available_balance (DECIMAL)
├── pending_balance (DECIMAL)
├── currency (VARCHAR) - GHS/USD
├── last_transaction_date (TIMESTAMP)
├── status (VARCHAR) - Active/Frozen/Suspended
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

wallet_transactions
├── id (UUID) - Primary Key
├── wallet_id (UUID) - Foreign Key
├── transaction_type (VARCHAR) - Credit/Debit
├── amount (DECIMAL)
├── reference (VARCHAR)
├── description (TEXT)
├── status (VARCHAR) - Pending/Completed/Failed
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 11. Withdrawals/Payouts
```sql
withdrawal_requests
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── amount (DECIMAL)
├── bank_account_id (UUID) - Foreign Key
├── status (VARCHAR) - Pending/Approved/Processing/Completed/Failed
├── reference_number (VARCHAR)
├── request_date (TIMESTAMP)
├── approval_date (TIMESTAMP)
├── approved_by (UUID)
├── completion_date (TIMESTAMP)
├── failure_reason (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

payouts
├── id (UUID) - Primary Key
├── payment_date (DATE)
├── total_amount (DECIMAL)
├── transaction_count (INT)
├── status (VARCHAR) - Pending/Completed/Failed
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Referral & Marketing Tables

#### 12. Referral System
```sql
referrals
├── id (UUID) - Primary Key
├── referrer_id (UUID) - Foreign Key (who referred)
├── referred_id (UUID) - Foreign Key (who was referred)
├── referrer_type (VARCHAR) - Agent/User/Business
├── referred_type (VARCHAR)
├── service_type (VARCHAR) - Salon/Property/Data/Wholesale
├── related_order_id (UUID) - What was referred
├── status (VARCHAR) - Pending/Approved/Converted/Paid
├── commission_earned (DECIMAL)
├── referral_link (VARCHAR)
├── click_count (INT)
├── conversion_count (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

referral_tracking
├── id (UUID) - Primary Key
├── referral_id (UUID) - Foreign Key
├── click_timestamp (TIMESTAMP)
├── click_source (VARCHAR) - URL referrer
├── user_agent (VARCHAR) - Browser info
├── ip_address (VARCHAR)
└── session_id (VARCHAR)
```

### Educational & Teaching Tables

#### 13. Teaching Platform
```sql
teaching_channels
├── id (UUID) - Primary Key
├── channel_name (VARCHAR)
├── description (TEXT)
├── channel_type (VARCHAR) - Class/Workshop/Seminar
├── creator_id (UUID) - Foreign Key (agent who created)
├── thumbnail_url (TEXT)
├── status (VARCHAR) - Active/Archived
├── member_count (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

channel_members
├── id (UUID) - Primary Key
├── channel_id (UUID) - Foreign Key
├── user_id (UUID) - Foreign Key
├── user_type (VARCHAR) - Agent/Student/Instructor
├── join_date (TIMESTAMP)
└── status (VARCHAR) - Active/Left/Banned

channel_messages
├── id (UUID) - Primary Key
├── channel_id (UUID) - Foreign Key
├── sender_id (UUID) - Foreign Key
├── message_text (TEXT)
├── message_type (VARCHAR) - Text/Image/Video/Audio
├── media_urls (TEXT[])
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

qa_posts
├── id (UUID) - Primary Key
├── channel_id (UUID) - Foreign Key
├── author_id (UUID) - Foreign Key
├── title (VARCHAR)
├── question_text (TEXT)
├── tags (TEXT[])
├── answer_count (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

qa_answers
├── id (UUID) - Primary Key
├── post_id (UUID) - Foreign Key
├── author_id (UUID) - Foreign Key
├── answer_text (TEXT)
├── is_accepted (BOOLEAN)
├── vote_count (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

lesson_notes
├── id (UUID) - Primary Key
├── channel_id (UUID) - Foreign Key
├── creator_id (UUID) - Foreign Key
├── title (VARCHAR)
├── content (TEXT)
├── file_urls (TEXT[])
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 14. Online Courses
```sql
online_courses
├── id (UUID) - Primary Key
├── instructor_id (UUID) - Foreign Key
├── course_title (VARCHAR)
├── description (TEXT)
├── category (VARCHAR)
├── price (DECIMAL)
├── thumbnail_url (TEXT)
├── enrollment_count (INT)
├── status (VARCHAR) - Draft/Published/Archived
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

course_modules
├── id (UUID) - Primary Key
├── course_id (UUID) - Foreign Key
├── module_title (VARCHAR)
├── module_order (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

course_lessons
├── id (UUID) - Primary Key
├── module_id (UUID) - Foreign Key
├── lesson_title (VARCHAR)
├── lesson_content (TEXT)
├── video_url (TEXT)
├── lesson_order (INT)
├── duration_minutes (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

course_enrollments
├── id (UUID) - Primary Key
├── course_id (UUID) - Foreign Key
├── student_id (UUID) - Foreign Key
├── enrollment_date (TIMESTAMP)
├── progress_percentage (INT)
├── status (VARCHAR) - Active/Completed/Dropped
└── completed_at (TIMESTAMP)
```

#### 15. Video Content
```sql
videos
├── id (UUID) - Primary Key
├── uploader_id (UUID) - Foreign Key (agent/user)
├── title (VARCHAR)
├── description (TEXT)
├── category (VARCHAR)
├── video_url (TEXT) - Storage URL
├── thumbnail_url (TEXT)
├── duration_seconds (INT)
├── view_count (INT)
├── like_count (INT)
├── upload_date (TIMESTAMP)
├── status (VARCHAR) - Processing/Published/Deleted
└── created_at (TIMESTAMP)

video_comments
├── id (UUID) - Primary Key
├── video_id (UUID) - Foreign Key
├── commenter_id (UUID) - Foreign Key
├── comment_text (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

video_likes
├── id (UUID) - Primary Key
├── video_id (UUID) - Foreign Key
├── user_id (UUID) - Foreign Key
├── created_at (TIMESTAMP)
└── deleted_at (TIMESTAMP)

saved_posts
├── id (UUID) - Primary Key
├── user_id (UUID) - Foreign Key
├── post_id (UUID) - Foreign Key
├── post_type (VARCHAR) - Video/QA/Article
├── created_at (TIMESTAMP)
```

### Savings & Financial Products

#### 16. Savings Plans
```sql
savings_plans
├── id (UUID) - Primary Key
├── plan_name (VARCHAR)
├── description (TEXT)
├── minimum_amount (DECIMAL)
├── maximum_amount (DECIMAL)
├── interest_rate (DECIMAL)
├── duration_days (INT)
├── lock_period_days (INT)
├── status (VARCHAR) - Active/Inactive
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

savings_accounts
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── plan_id (UUID) - Foreign Key
├── account_number (VARCHAR)
├── balance (DECIMAL)
├── total_deposits (DECIMAL)
├── interest_earned (DECIMAL)
├── start_date (TIMESTAMP)
├── maturity_date (TIMESTAMP)
├── status (VARCHAR) - Active/Matured/Withdrawn/Closed
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

savings_transactions
├── id (UUID) - Primary Key
├── account_id (UUID) - Foreign Key
├── transaction_type (VARCHAR) - Deposit/Interest/Withdrawal
├── amount (DECIMAL)
├── reference (VARCHAR)
├── status (VARCHAR) - Pending/Completed/Failed
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

savings_withdrawals
├── id (UUID) - Primary Key
├── account_id (UUID) - Foreign Key
├── withdrawal_amount (DECIMAL)
├── status (VARCHAR) - Pending/Approved/Completed/Rejected
├── request_date (TIMESTAMP)
├── approval_date (TIMESTAMP)
├── completion_date (TIMESTAMP)
└── created_at (TIMESTAMP)
```

### Job Board & Employment

#### 17. Job Board
```sql
jobs
├── id (UUID) - Primary Key
├── poster_id (UUID) - Foreign Key (who posted job)
├── job_title (VARCHAR)
├── job_description (TEXT)
├── job_category (VARCHAR)
├── required_skills (TEXT[])
├── location (VARCHAR)
├── salary_min (DECIMAL)
├── salary_max (DECIMAL)
├── job_type (VARCHAR) - Full-time/Part-time/Contract
├── status (VARCHAR) - Open/Closed/Filled
├── application_count (INT)
├── posted_date (TIMESTAMP)
├── deadline_date (DATE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

job_applications
├── id (UUID) - Primary Key
├── job_id (UUID) - Foreign Key
├── applicant_id (UUID) - Foreign Key
├── application_text (TEXT)
├── resume_url (TEXT)
├── status (VARCHAR) - Pending/Reviewed/Accepted/Rejected
├── application_date (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Domestic Workers

#### 18. Domestic Workers
```sql
domestic_workers
├── id (UUID) - Primary Key
├── worker_name (VARCHAR)
├── phone_number (VARCHAR)
├── service_type (VARCHAR) - Cleaning/Cooking/Childcare/Laundry
├── experience_years (INT)
├── availability (VARCHAR)
├── location (VARCHAR)
├── rating (DECIMAL)
├── verified (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

worker_requests
├── id (UUID) - Primary Key
├── client_id (UUID) - Foreign Key
├── service_type (VARCHAR)
├── preferred_location (VARCHAR)
├── required_date (DATE)
├── budget (DECIMAL)
├── description (TEXT)
├── status (VARCHAR) - Posted/Assigned/Completed/Cancelled
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### MTN AFA (Mobile Money Agent)

#### 19. MTN AFA Registration
```sql
mtn_afa_applications
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── application_status (VARCHAR) - Pending/Approved/Rejected
├── business_type (VARCHAR)
├── id_type (VARCHAR)
├── id_number (VARCHAR)
├── nin (VARCHAR)
├── phone_number (VARCHAR)
├── location (VARCHAR)
├── bank_account (JSONB)
├── application_date (TIMESTAMP)
├── approval_date (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Business & Partnerships

#### 20. Partnership Forms
```sql
partnership_registrations
├── id (UUID) - Primary Key
├── user_id (UUID) - Foreign Key
├── business_name (VARCHAR)
├── business_type (VARCHAR)
├── num_partners (INT)
├── registration_number (VARCHAR)
├── form_data (JSONB) - Serialized form data
├── status (VARCHAR) - Pending/Approved/Rejected
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

bank_account_registrations
├── id (UUID) - Primary Key
├── user_id (UUID) - Foreign Key
├── bank_name (VARCHAR)
├── account_number (VARCHAR)
├── account_name (VARCHAR)
├── swift_code (VARCHAR)
├── status (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

company_shares_registrations
├── id (UUID) - Primary Key
├── user_id (UUID) - Foreign Key
├── company_name (VARCHAR)
├── share_amount (DECIMAL)
├── share_percentage (DECIMAL)
├── form_data (JSONB)
├── status (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Content & Blogging

#### 21. Blog System
```sql
blog_categories
├── id (UUID) - Primary Key
├── category_name (VARCHAR)
├── slug (VARCHAR)
├── description (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

blog_posts
├── id (UUID) - Primary Key
├── author_id (UUID) - Foreign Key
├── title (VARCHAR)
├── slug (VARCHAR)
├── content (TEXT) - Rich text/markdown
├── category_id (UUID) - Foreign Key
├── featured_image (TEXT)
├── status (VARCHAR) - Draft/Published/Archived
├── view_count (INT)
├── created_at (TIMESTAMP)
├── published_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Communication & Media

#### 22. Messages & Chat
```sql
messages
├── id (UUID) - Primary Key
├── sender_id (UUID) - Foreign Key
├── receiver_id (UUID) - Foreign Key
├── message_text (TEXT)
├── message_type (VARCHAR) - Text/Image/Audio/File
├── media_url (TEXT)
├── is_read (BOOLEAN)
├── read_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

message_media
├── id (UUID) - Primary Key
├── message_id (UUID) - Foreign Key
├── media_type (VARCHAR) - Image/Video/Audio/Document
├── media_url (TEXT)
├── file_size (INT)
├── uploaded_at (TIMESTAMP)
```

#### 23. Media Storage
```sql
media_uploads
├── id (UUID) - Primary Key
├── uploader_id (UUID) - Foreign Key
├── file_name (VARCHAR)
├── file_type (VARCHAR)
├── file_size (INT)
├── storage_path (TEXT)
├── file_url (TEXT)
├── bucket_name (VARCHAR)
├── uploaded_at (TIMESTAMP)
└── deleted_at (TIMESTAMP)

audio_storage_management
├── id (UUID) - Primary Key
├── audio_name (VARCHAR)
├── uploader_id (UUID) - Foreign Key
├── file_size (INT)
├── duration_seconds (INT)
├── storage_path (TEXT)
├── file_url (TEXT)
├── created_at (TIMESTAMP)
└── deleted_at (TIMESTAMP)
```

### Admin & System Tables

#### 24. Admin Management
```sql
sub_admins
├── id (UUID) - Primary Key
├── email (VARCHAR)
├── name (VARCHAR)
├── role (VARCHAR)
├── permissions (JSONB)
├── created_by (UUID)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

admin_invitations
├── id (UUID) - Primary Key
├── email (VARCHAR)
├── role (VARCHAR)
├── invitation_token (VARCHAR)
├── expires_at (TIMESTAMP)
├── status (VARCHAR) - Pending/Accepted/Expired
├── created_by (UUID)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 25. Compliance & Verification
```sql
compliance_documents
├── id (UUID) - Primary Key
├── agent_id (UUID) - Foreign Key
├── document_type (VARCHAR) - ID/Passport/License
├── document_url (TEXT)
├── upload_date (TIMESTAMP)
├── verification_status (VARCHAR) - Pending/Approved/Rejected
├── verified_by (UUID)
├── verification_notes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 26. System Configuration
```sql
link_preview_cache
├── id (UUID) - Primary Key
├── url (TEXT) - URL
├── title (VARCHAR)
├── description (TEXT)
├── image_url (TEXT)
├── cached_at (TIMESTAMP)
└── expires_at (TIMESTAMP)

maintenance_mode
├── id (UUID) - Primary Key
├── is_enabled (BOOLEAN)
├── reason (TEXT)
├── started_at (TIMESTAMP)
├── expected_end (TIMESTAMP)
└── updated_at (TIMESTAMP)

sms_logs
├── id (UUID) - Primary Key
├── recipient_phone (VARCHAR)
├── message_content (TEXT)
├── status (VARCHAR) - Sent/Failed/Pending
├── sent_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

#### 27. YouTube Integration
```sql
youtube_videos
├── id (UUID) - Primary Key
├── video_title (VARCHAR)
├── youtube_video_id (VARCHAR)
├── description (TEXT)
├── channel_name (VARCHAR)
├── category (VARCHAR)
├── added_by (UUID)
├── added_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

youtube_interactions
├── id (UUID) - Primary Key
├── video_id (UUID) - Foreign Key
├── user_id (UUID) - Foreign Key
├── interaction_type (VARCHAR) - View/Like/Comment/Share
├── created_at (TIMESTAMP)
```

---

## ALL API ROUTES (141 ENDPOINTS)

### ADMIN API ROUTES (68 endpoints)

#### Agent Management Routes (21 endpoints)
```
POST   /api/admin/agents/route.ts                          - List all agents (paginated)
GET    /api/admin/agents/route.ts                          - Get agents list
POST   /api/admin/agents/[id]/approve/route.ts             - Approve agent registration
POST   /api/admin/agents/[id]/status/route.ts              - Update agent status
POST   /api/admin/agents/[id]/update-permission/route.ts   - Grant/revoke service permissions
POST   /api/admin/agents/[id]/update-property-permission/route.ts - Real estate permissions
POST   /api/admin/agents/[id]/publish-permission/route.ts  - Publishing permissions
POST   /api/admin/agents/[id]/publish-property-permission/route.ts - Property publishing
GET    /api/admin/agents/[id]/page.tsx                     - Agent detail page
GET    /api/admin/agents/[id]/summary/route.ts             - Agent summary stats
POST   /api/admin/agents/[id]/export/route.ts              - Export agent data
POST   /api/admin/agents/[id]/export-csv/route.ts          - CSV export
POST   /api/admin/agents/[id]/clear-records/route.ts       - Purge agent data
POST   /api/admin/agents/export/route.ts                   - Bulk agent export
POST   /api/admin/agents/search/route.ts                   - Search agents
POST   /api/admin/agents/bulk/route.ts                     - Bulk operations
POST   /api/admin/agents/ranking/route.ts                  - Agent performance ranking
GET    /api/admin/agents-count/route.ts                    - Total agent count
POST   /api/admin/agents/automation/route.ts               - Automation rules
```

#### AFA Management Routes (4 endpoints)
```
GET    /api/admin/afa/route.ts                             - List AFA applications
POST   /api/admin/afa/update-status/route.ts               - Update AFA status
POST   /api/admin/afa/verify-payment/route.ts              - Verify AFA payment
POST   /api/admin/afa/delete/route.ts                      - Delete AFA application
```

#### Bulk Orders Management (5 endpoints)
```
GET    /api/admin/bulk-orders/route.ts                     - List bulk orders
POST   /api/admin/bulk-orders/update-status/route.ts       - Update order status
POST   /api/admin/bulk-orders/verify-payment/route.ts      - Verify payment
POST   /api/admin/bulk-orders/[id]/mark-paid/route.ts      - Mark as paid
POST   /api/admin/bulk-orders/delete/route.ts              - Delete order
GET    /api/admin/bulk-orders-data/route.ts                - Get bulk orders data
```

#### Data Orders & Bundles (7 endpoints)
```
GET    /api/admin/data-orders/route.ts                     - List data orders
GET    /api/admin/data-orders/[id]/route.ts                - Get order details
POST   /api/admin/data-orders/log/route.ts                 - Log data order
GET    /api/admin/data-orders/log/[id]/route.ts            - Get log details
GET    /api/admin/data-orders/log-list/route.ts            - List all logs
GET    /api/admin/data-bundles/route.ts                    - List bundles
POST   /api/admin/data-bundles/route.ts                    - Create/update bundle
```

#### Fashion Management (9 endpoints)
```
GET    /api/admin/fashion/categories/route.ts              - List categories
POST   /api/admin/fashion/categories/route.ts              - Create category
GET    /api/admin/fashion/products/route.ts                - List products
POST   /api/admin/fashion/products/route.ts                - Create product
PUT    /api/admin/fashion/products/[id]/route.ts           - Update product
DELETE /api/admin/fashion/products/[id]/route.ts           - Delete product
POST   /api/admin/fashion/products/upload-image/route.ts   - Upload product image
GET    /api/admin/fashion/referrals/route.ts               - List referrals
POST   /api/admin/fashion/referrals/[id]/pay-commission/route.ts - Pay referral commission
GET    /api/admin/fashion/referrals/[id]/convert/route.ts  - Convert referral
GET    /api/admin/fashion/referrals-list/route.ts          - All referrals
GET    /api/admin/fashion/referrals-list/[id]/route.ts     - Referral details
POST   /api/admin/fashion/project-requests/route.ts        - Handle requests
GET    /api/admin/fashion/project-requests/[id]/route.ts   - Request details
```

#### Invitation Management (4 endpoints)
```
GET    /api/admin/invitations/route.ts                     - List invitations
POST   /api/admin/invitations/[id]/approve/route.ts        - Approve invitation
POST   /api/admin/invitations/[id]/reject/route.ts         - Reject invitation
POST   /api/admin/invitations/[id]/update-status/route.ts  - Update status
```

#### Financial Management (8 endpoints)
```
GET    /api/admin/wallet/route.ts                          - Wallet overview
GET    /api/admin/payouts/route.ts                         - List payouts
POST   /api/admin/savings/route.ts                         - Savings management
GET    /api/admin/savings/plans/route.ts                   - List plans
POST   /api/admin/savings/accounts/action/route.ts         - Account actions
GET    /api/admin/savings/withdrawals/route.ts             - Withdrawal requests
POST   /api/admin/savings/export/route.ts                  - Export data
GET    /api/admin/savings/reports/route.ts                 - Generate reports
GET    /api/admin/withdrawals/[id]/route.ts                - Withdrawal details
```

#### Content & System Management (10 endpoints)
```
GET    /api/admin/dashboard/pending-alerts/route.ts        - Pending alerts
POST   /api/admin/link-preview-cache/route.ts              - Cache management
POST   /api/admin/storage/initialize/route.ts              - Initialize storage
GET    /api/admin/storage/stats/route.ts                   - Storage statistics
POST   /api/admin/storage/cleanup/route.ts                 - Cleanup storage
GET    /api/admin/storage/summary/route.ts                 - Storage summary
POST   /api/admin/update-password/route.ts                 - Password reset
POST   /api/admin/test-auth/route.ts                       - Auth testing
GET    /api/admin/sub-admin/list/route.ts                  - Sub-admin list
POST   /api/admin/referral/sync-stats/route.ts             - Sync referral stats
```

#### Automation & Maintenance (3 endpoints)
```
GET    /api/admin/automation/agents-at-risk/route.ts       - At-risk agents
POST   /api/admin/automation/run/route.ts                  - Run automation
GET    /api/admin/automation/stats/route.ts                - Automation stats
```

---

### AGENT API ROUTES (37 endpoints)

#### Profile & Account (2 endpoints)
```
POST   /api/agent/check-payment/route.ts                   - Check payment status
POST   /api/agent/clear-payment/route.ts                   - Clear payment
```

#### Data Orders & Bundles (4 endpoints)
```
POST   /api/agent/bulk-orders/submit/route.ts              - Submit bulk order
GET    /api/agent/bulk-orders/status/route.ts              - Get status
POST   /api/agent/bulk-orders/delete/route.ts              - Delete order
```

#### Properties (1 endpoint)
```
POST   /api/agent/properties/submit-property/route.ts      - Submit property listing
```

#### Wholesale (5 endpoints)
```
POST   /api/agent/wholesale/submit-product/route.ts        - Submit product
PUT    /api/agent/wholesale/update-product/route.ts        - Update product
GET    /api/agent/wholesale/my-products/route.ts           - My products
GET    /api/agent/wholesale/latest-products/route.ts       - Browse products
POST   /api/agent/wholesale/checkout/route.ts              - Checkout/purchase
GET    /api/agent/wholesale/orders/route.ts                - Order history
```

#### AFA & Telecom (3 endpoints)
```
POST   /api/agent/afa/submit/route.ts                      - Submit AFA app
GET    /api/agent/afa/status/route.ts                      - Check status
POST   /api/agent/afa/delete/route.ts                      - Delete application
```

#### Referrals (4 endpoints)
```
POST   /api/agent/referral/generate-link/route.ts          - Generate referral link
GET    /api/agent/referral/stats/route.ts                  - Referral statistics
POST   /api/agent/referral/confirm/route.ts                - Confirm referral
POST   /api/agent/referral/track-click/route.ts            - Track clicks
```

#### Savings (4 endpoints)
```
GET    /api/agent/savings/plans/route.ts                   - Available plans
POST   /api/agent/savings/route.ts                         - Enroll in plan
GET    /api/agent/savings/transactions/route.ts            - Transaction history
POST   /api/agent/savings/withdraw/route.ts                - Request withdrawal
```

#### Commission & Earnings (2 endpoints)
```
GET    /api/agent/commission-summary/route.ts              - Commission totals
GET    /api/agent/compliance/stats/route.ts                - Compliance status
```

#### Withdrawals (1 endpoint)
```
POST   /api/agent/withdraw/route.ts                        - Request withdrawal
```

#### Payments (1 endpoint)
```
POST   /api/agent/mark-payment-ready/route.ts              - Mark payment ready
```

---

### PUBLIC API ROUTES (36 endpoints)

#### Fashion (4 endpoints)
```
GET    /api/fashion/categories/route.ts                    - Fashion categories
GET    /api/fashion/products/route.ts                      - Fashion products
POST   /api/fashion/project-request/route.ts               - Submit project request
POST   /api/fashion/referral/route.ts                      - Referral submission
```

#### Salon (4 endpoints)
```
GET    /api/salon/categories/route.ts                      - Service categories
GET    /api/salon/services/[id]/route.ts                   - Service details
GET    /api/salon/services/route.ts                        - All services
POST   /api/salon/bookings/route.ts                        - Book appointment
POST   /api/salon/referrals/route.ts                       - Salon referral
```

#### Domestic Workers (1 endpoint)
```
POST   /api/domestic-workers/submit-request/route.ts       - Request worker
```

#### Job Board (1 endpoint)
```
GET    /api/candidates/search/route.ts                     - Search candidates
```

#### Content & Media (9 endpoints)
```
POST   /api/upload/image/route.ts                          - Upload image
POST   /api/upload/audio/route.ts                          - Upload audio
POST   /api/upload/document/route.ts                        - Upload document
POST   /api/videos/upload/route.ts                         - Upload video
GET    /api/videos/feed/route.ts                           - Video feed
GET    /api/videos/[videoId]/save/route.ts                 - Save video
POST   /api/videos/[videoId]/comments/route.ts             - Add comment
POST   /api/videos/[videoId]/delete/route.ts               - Delete video
GET    /api/posts/increment-view/route.ts                  - Increment views
```

#### Teaching (2 endpoints)
```
POST   /api/teaching/save-post/route.ts                    - Save post
GET    /api/teaching/youtube-videos/route.ts               - YouTube videos
```

#### Channels & Groups (3 endpoints)
```
GET    /api/channels/member-count/route.ts                 - Member count
POST   /api/channel-join-requests/approve/route.ts         - Approve join request
```

#### Payment Gateway (6 endpoints)
```
POST   /api/paystack/initialize/route.ts                   - Initialize payment
GET    /api/paystack/callback/route.ts                     - Payment callback
POST   /api/paystack/register/initialize/route.ts          - Registration payment
POST   /api/paystack/register/verify/route.ts              - Verify registration
```

#### Subscriptions (6 endpoints)
```
POST   /api/subscriptions/verify-and-approve/route.ts      - Verify subscription
POST   /api/subscriptions/check-expiration/route.ts        - Check expiry
POST   /api/subscriptions/handle-request/route.ts          - Handle request
POST   /api/subscriptions/verify-payment/route.ts          - Verify payment
POST   /api/subscriptions/check-expiry/route.ts            - Check expiry (alt)
POST   /api/subscriptions/sync-expiration-status/route.ts  - Sync status
```

#### Utilities (3 endpoints)
```
POST   /api/link-preview/route.ts                          - Get link preview
POST   /api/maintenance/route.ts                           - Maintenance status
POST   /api/whatsapp/log/route.ts                          - WhatsApp logs
POST   /api/worker-requests/route.ts                       - Worker requests
```

---

## ALL PAGES & ROUTES (81 PAGES)

### ADMIN PAGES (17 pages)

| Page Path | Purpose | Feature |
|-----------|---------|---------|
| `/admin/` | Main admin dashboard | Central command center |
| `/admin/login` | Admin login | Authentication |
| `/admin/page.tsx` | Admin dashboard | All 35+ management tabs |
| `/admin/agents/` | Agent list | Manage all agents |
| `/admin/agents/[id]/` | Agent details | Individual agent mgmt |
| `/admin/agents/[id]/wallet/` | Agent wallet | Financial overview |
| `/admin/agents/[id]/data-orders/` | Agent orders | Order history |
| `/admin/agents/[id]/chat-history/` | Chat logs | Message history |
| `/admin/agent-performance/` | Performance analytics | Agent rankings |
| `/admin/agents/admin-agents-switch-button/` | Agent switching | Quick agent select |
| `/admin/savings/` | Savings management | Plan admin |
| `/admin/wholesale/` | Wholesale orders | Marketplace mgmt |
| `/admin/audio-management/` | Audio files | Content management |
| `/admin/link-cache/` | URL previews | Cache management |
| `/admin/maintenance-system/` | Maintenance | System health |
| `/admin/maintenance/` | Maintenance mode | System status |
| `/admin/chat/[referralId]/` | Referral chat | Customer support |
| `/admin/storage/` | Storage stats | Disk usage |

### AGENT PAGES (32 pages)

| Page Path | Purpose | Feature |
|-----------|---------|---------|
| `/agent/dashboard/` | Main agent dashboard | Central hub |
| `/agent/login/` | Agent login | Authentication |
| `/agent/register/` | Agent registration | Signup |
| `/agent/registration-payment/` | Payment for reg | Onboarding fee |
| `/agent/registration-complete/` | Completion | Success message |
| `/agent/payment-success/` | Payment confirm | Transaction status |
| `/agent/settings/` | Agent settings | Preferences |
| `/agent/wallet/` | Wallet dashboard | Finances |
| `/agent/withdraw/` | Withdrawal requests | Payouts |
| `/agent/data-orders/` | Data order list | Browse bundles |
| `/agent/data-order/` | New data order | Order form |
| `/agent/bulk-data-order/` | Bulk orders | Batch orders |
| `/agent/properties/` | Property listings | Real estate |
| `/agent/publish-properties/` | Publish property | New listing |
| `/agent/wholesale/` | Wholesale market | Marketplace |
| `/agent/publish-products/` | Publish product | New item |
| `/agent/edit-product/[id]/` | Edit product | Update item |
| `/agent/view-product/[id]/` | View product | Item details |
| `/agent/savings/` | Savings dashboard | Financial products |
| `/agent/savings/plans/` | Available plans | Browse plans |
| `/agent/savings/[id]/` | Plan details | Plan info |
| `/agent/savings/commit/` | Deposit page | Make deposit |
| `/agent/savings/progress/` | Progress tracking | Account growth |
| `/agent/compliance/` | KYC submission | Document upload |
| `/agent/my-subscriptions/` | Active subs | Data bundles |
| `/agent/mtn-afa-registration/` | AFA signup | Mobile money |
| `/agent/teaching/` | Teaching hub | Educational platform |
| `/agent/teaching/[channelId]/` | Channel view | Course content |
| `/agent/teaching/[channelId]/member/` | Member area | Exclusive content |
| `/agent/teaching/channels/[id]/join/` | Join channel | Enrollment |
| `/agent/chat/[referralId]/` | Chat window | Customer talk |
| `/agent/refer/[serviceId]/` | Referral page | Referral link |

### PUBLIC PAGES (32 pages)

| Page Path | Purpose | Feature |
|-----------|---------|---------|
| `/` | Home page | Landing page |
| `/page.tsx` | Main homepage | Portal entry |
| `/salon/` | Salon portal | Service listings |
| `/properties/` | Real estate | Property marketplace |
| `/jobboard/` | Job listings | Employment board |
| `/fashion-avenue/` | Fashion store | Product catalog |
| `/job-details/[jobId]/` | Job details | Position info |
| `/candidates-searchengine/` | Candidate search | Talent pool |
| `/candidates-searchengine/[candidateId]/` | Profile | Candidate details |
| `/domestic-workers/` | Worker listing | Service providers |
| `/domestic-workers/request/` | Request form | Service request |
| `/appleservicecenter/` | Apple service | Tech support |
| `/blogs/` | Blog list | Articles |
| `/blogs/[slug]/` | Blog post | Article read |
| `/blogs/category/[slug]/` | Category blogs | Filtered posts |
| `/faq/` | FAQ page | Help center |
| `/testimonials/` | Reviews | Social proof |
| `/voucher/` | Voucher mgmt | Promotions |
| `/legal/terms-and-conditions/` | Legal | T&C |
| `/terms/` | Terms | Policy |
| `/business/register/` | Business signup | Partnership registration |
| `/business/success/` | Signup success | Confirmation |
| `/business/terms/` | Business T&C | Legal |
| `/parents/register/` | Parent signup | Enrollment |
| `/parents/success/` | Parent confirm | Success |
| `/parents/terms/` | Parent T&C | Terms |
| `/register-worker/` | Worker signup | Registration |
| `/payment-reminder/` | Payment notice | Billing |
| `/no-registration/` | Access denied | Error page |
| `/maintenance/` | Maintenance page | System down |

---

## CORE COMPONENTS (336+ Components)

### Admin Components (70+ components)

**Admin Tab Components:**
- `AgentsTab.tsx` - Agent management list
- `AgentManagementTab.tsx` - Advanced agent controls
- `ManualRegistrationTab.tsx` - Bulk agent creation
- `ServicesTab.tsx` - Service catalog management
- `DataTab.tsx` - Data bundle management
- `OrdersTab.tsx` - Order processing
- `ReferralsTab.tsx` - Referral tracking
- `PayoutsTab.tsx` - Payout processing
- `WalletsTab.tsx` - Wallet operations
- `WalletOverviewTab.tsx` - Financial overview
- `WholesaleTab.tsx` - Wholesale orders
- `SavingsTab.tsx` - Savings plan management
- `PropertiesTab.tsx` - Real estate management
- `DomesticWorkersTab.tsx` - Worker management
- `DomesticWorkerClientRequestsTab.tsx` - Service requests
- `BlogsTab.tsx` - Content management
- `ComplianceTab.tsx` - Verification management
- `TeacherHubTab.tsx` - Education platform
- `AudioManagementTab.tsx` - Audio assets
- `LinkCacheManagementTab.tsx` - URL cache
- `ProfessionalWritingTab.tsx` - Document templates
- `InvitationManagementTab.tsx` - Access control
- `BulkOrderManagementTab.tsx` - Bulk operations
- `OnlineCoursesTab.tsx` - Course management
- `DataBundleOrdersLogTab.tsx` - Order logging
- `SMSNotificationsTab.tsx` - Bulk messaging
- `FashionAvenueTab.tsx` - Fashion products
- `FashionProjectRequestsTab.tsx` - Fashion requests
- `FashionReferralsTab.tsx` - Fashion commissions
- `SalonTab.tsx` - Salon management

**Admin Utility Components:**
- `AdminAuthGuard.tsx` - Access control
- `AdminMaintenanceControl.tsx` - Maintenance UI
- `AdminAgentRanking.tsx` - Performance chart
- `FloatingRefreshButton.tsx` - Data refresh
- `ViewDetailsDialog.tsx` - Detail viewer
- `OrderCleanupDialog.tsx` - Order management
- `AdminPageSkeleton.tsx` - Loading state
- `PendingAlertsCard.tsx` - Alert display
- `lazy-activity-tracker.tsx` - Activity logs
- `lazy-automation-dashboard.tsx` - Automation UI
- `ActivityTracker.tsx` - Event tracking
- `AutomationDashboard.tsx` - Workflow dashboard
- `agent-dashboard-skeleton.tsx` - Skeleton UI
- `data-orders-list.tsx` - Order list
- SMS Components:
  - `AgentSelector.tsx` - SMS recipient
  - `MessageComposer.tsx` - SMS editor
  - `SmsHistoryViewer.tsx` - Message logs

### Agent Components (80+ components)

**Agent Dashboard Components:**
- `AgentMenuCards.tsx` - Navigation cards
- `ProductSlider.tsx` - Product carousel
- `AgentPropertiesShowcase.tsx` - Property display
- `ReferralDashboard.tsx` - Referral tracking
- `DashboardLoginNotification.tsx` - Login alerts
- `AgentDashboardNotification.tsx` - Activity alerts
- `dashboard-skeleton.tsx` - Loading skeleton
- `ComplianceTab.tsx` - Document verification
- `ProfessionalWritingTab.tsx` - Document tools
- `TeachingPlatformPage.tsx` - Education hub
- `InactivityNotificationManager.tsx` - Timeout alerts
- `AdminPortalAccess.tsx` - Portal switcher
- `AgentOnlineCoursesDisplay.tsx` - Course enrollment

**Agent Feature Components:**
- `FormField.tsx` - Form controls
- `FormProgress.tsx` - Progress indicator
- `PersonForm.tsx` - Data entry form
- `ErrorBoundary.tsx` - Error handling
- `CriticalStatusNotification.tsx` - Status alerts
- `AgentRegistrationNotification.tsx` - Registration status
- `WhatsAppChannelPopup.tsx` - Communication
- `WholesaleProductCard.tsx` - Product card
- `WholesaleProductSlider.tsx` - Product carousel
- `SidebarAd.tsx` - Promotional sidebar
- Referral Components:
  - `ReferralLinks.tsx` - Link generation
  - `ReferralStats.tsx` - Performance metrics
  - `ReferralHistory.tsx` - Conversion log
- Professional Writing:
  - `TemplateSelector.tsx` - Document templates
  - `DocumentEditor.tsx` - Rich text editor
  - `DocumentPreview.tsx` - Document view
- Compliance:
  - `DocumentUpload.tsx` - File upload
  - `VerificationStatus.tsx` - Status display
  - `KYCForm.tsx` - KYC submission

### General Components (100+ components)

**UI Components (shadcn/ui):**
- `Button.tsx` - Action button
- `Input.tsx` - Text input
- `Card.tsx` - Card container
- `Dialog.tsx` - Modal dialog
- `Tabs.tsx` - Tab navigation
- `Badge.tsx` - Status badge
- `Select.tsx` - Dropdown
- `Pagination.tsx` - Page navigation
- `Skeleton.tsx` - Loading placeholder
- `Textarea.tsx` - Multi-line input
- `Dropdown.tsx` - Menu dropdown
- `Popover.tsx` - Floating panel
- `Tooltip.tsx` - Hover hints
- `Label.tsx` - Form labels
- `Checkbox.tsx` - Checkbox input
- `Radio.tsx` - Radio button
- `Slider.tsx` - Range slider
- `Alert.tsx` - Alert box
- `Breadcrumb.tsx` - Navigation path
- `Collapsible.tsx` - Expandable section
- `Progress.tsx` - Progress bar
- `Sheet.tsx` - Side drawer
- `Separator.tsx` - Divider
- `Accordion.tsx` - Accordion items

**Shared Components:**
- `Navbar.tsx` - Navigation bar
- `Sidebar.tsx` - Side navigation
- `Footer.tsx` - Page footer
- `SearchBar.tsx` - Search interface
- `FilterPanel.tsx` - Filter controls
- `SortOptions.tsx` - Sort selector
- `PaginationControls.tsx` - Page controls
- `LoadingSpinner.tsx` - Loading indicator
- `ErrorMessage.tsx` - Error display
- `SuccessMessage.tsx` - Success notification
- `NoData.tsx` - Empty state
- `ImageWithFallback.tsx` - Image component
- `ImageModal.tsx` - Image viewer
- `VideoPlayer.tsx` - Video playback
- `AudioPlayer.tsx` - Audio playback
- `FloatingAudioPlayer.tsx` - Player widget
- `RichTextEditor.tsx` - Content editor
- `DatePicker.tsx` - Date selection
- `TimePicker.tsx` - Time selection
- `FileUploader.tsx` - File upload
- `BackToTop.tsx` - Scroll button
- `UnreadNotification.tsx` - Notification counter
- `Modal.tsx` - Modal wrapper

**Layout Components:**
- `MainLayout.tsx` - Main wrapper
- `AuthLayout.tsx` - Auth pages
- `AdminLayout.tsx` - Admin wrapper
- `AgentLayout.tsx` - Agent wrapper
- `PublicLayout.tsx` - Public pages
- `DashboardLayout.tsx` - Dashboard wrapper

---

## LIBRARY UTILITIES & HELPERS

### Authentication & Security (10+ files)
- `auth.ts` - Auth functions
- `agent-auth.ts` - Agent auth
- `api-auth.ts` - API auth
- `auth-middleware.ts` - Auth checks
- `session-manager.ts` - Session mgmt
- `supabase-hybrid-auth.ts` - Hybrid auth
- `privacy-masking.ts` - Data masking
- `csv-protection.ts` - Data protection

### API & Data (20+ files)
- `api-client.ts` - HTTP client
- `api-client-enhanced.ts` - Enhanced client
- `connection-manager.ts` - Connection pool
- `realtime-manager.ts` - Real-time updates
- `data-order-persistence.ts` - Data persistence
- `order-history.ts` - Order tracking
- `order-status-handlers.ts` - Status management
- `pending-wallet-transactions.ts` - Transaction queue

### Commission & Financial (15+ files)
- `commission-calculation.ts` - Calculation engine
- `commission-calculator.ts` - Advanced calc
- `commission-earnings.ts` - Earnings tracking
- `commission-validation.ts` - Validation rules
- `commission-insert-validator.ts` - Data validation
- `commission-reversal-system.ts` - Reversal logic
- `commission-sync.ts` - Data sync
- `earnings-calculator.ts` - Earnings computation
- `batch-calculator.ts` - Batch processing
- `payment-gate.ts` - Payment processing

### Database & Storage (20+ files)
- `supabase.ts` - Main Supabase client
- `supabase-base.ts` - Base client
- `supabase-admin.ts` - Admin client
- `supabase-enhanced.ts` - Enhanced client
- `supabase-env.ts` - Environment config
- `supabase-client-jobs.ts` - Job operations
- `storage-management.ts` - File storage
- `media-upload.ts` - Media handling
- `image-compression.ts` - Image optimization
- `fashion-image-upload.ts` - Fashion images
- `property-image-upload.ts` - Property images
- `salon-image-upload.ts` - Salon images

### Search & Discovery (10+ files)
- `advanced-search-matcher.ts` - Search algorithm
- `enhanced-search-engine.ts` - Search engine
- `multi-keyword-search.ts` - Multi-term search
- `search-cache.ts` - Search caching
- `search-tracking.ts` - Search analytics
- `candidate-search-utils.ts` - Candidate search
- `job-title-formatter.ts` - Job formatting
- Dictionaries:
  - `skill-synonyms.ts` - Skill matching
  - `education-synonyms.ts` - Education matching
  - `location-synonyms.ts` - Location matching

### Caching & Performance (10+ files)
- `admin-cache-manager.ts` - Admin cache
- `admin-page-loader.ts` - Page loading
- `admin-tabs-cache.ts` - Tab caching
- `agent-dashboard-loader.ts` - Dashboard loader
- `agent-query-optimizer.ts` - Query optimization
- `ranking-cache.ts` - Ranking cache
- `link-preview-cache.ts` - URL cache

### Content & Media (15+ files)
- `opus-encoder.ts` - Audio encoding
- `opus-decoder.ts` - Audio decoding
- `image-compression.ts` - Image compression
- `media-upload.ts` - Media upload
- `csv-export.ts` - CSV generation
- `seo.ts` - SEO utilities
- `seo-config.ts` - SEO configuration

### Notifications & Communication (8+ files)
- `sms-service.ts` - SMS sending
- `sms-config.ts` - SMS configuration
- `sms-history.ts` - SMS logging
- `mtn-afa-utils.ts` - MTN utilities
- `channel-membership-utils.ts` - Channel mgmt
- `use-unread-messages` - Message counting

### Utilities & Helpers (25+ files)
- `currency.ts` - Currency handling
- `currency-formatter.ts` - Currency display
- `reference-code-generator.ts` - Code generation
- `pin-generator.ts` - PIN generation
- `maintenance-mode.ts` - Maintenance toggle
- `config.ts` - Configuration
- `ghana-locations.ts` - Location data
- `apple-devices-data.ts` - Device data
- `ats-scoring.ts` - Applicant scoring
- `sanitize-logs.ts` - Log cleaning
- `scroll-utils.ts` - Scroll handling
- `sub-admin-utils.ts` - Sub-admin helpers
- `dataLoader.ts` - Data loading
- `agent-menu-logger.ts` - Activity logging

---

## DASHBOARD SYSTEMS

### Agent Dashboard (Main Hub)

**Overview Tab:**
- Total earnings summary
- Pending payouts
- Recent activity feed
- Performance metrics
- Quick action buttons

**Earnings Breakdown:**
- Salon service commissions
- Property sales commissions
- Data order commissions
- Wholesale commissions
- Fashion referral commissions
- Total earnings by period
- Withdrawal status

**Services Tab:**
- List of published services
- Service performance metrics
- Edit/delete options
- Approval status
- Image management
- Pricing management

**Referrals Tab:**
- Referral link generation
- Link tracking (clicks, conversions)
- Commission tracking
- Referral status (pending, approved, paid)
- Earnings from referrals

**Products Tab (Wholesale/Fashion):**
- Product listings
- Inventory management
- Sales tracking
- Commission tracking
- Edit/delete options
- Image galleries

**Properties Tab:**
- Property listings
- Geographic visualization
- Status tracking
- Inquiry management
- Commission tracking

**Wallet Tab:**
- Current balance display
- Available vs pending funds
- Transaction history
- Withdrawal request form
- Payment method management

**Data Orders Tab:**
- Order submission form
- Network selection (MTN, Vodafone, AirtelTigo)
- Quantity selection
- Order history
- Status tracking
- Commission summary

**Savings Tab:**
- Available savings plans
- Current enrollments
- Deposit history
- Interest accrued
- Maturity dates
- Withdrawal requests

**Compliance Tab:**
- KYC submission form
- Document upload interface
- Verification status
- Required documents checklist
- Expiry reminders

**Teaching/Education Tab:**
- Join requests
- Available channels
- Enrolled courses
- Video library access
- Q&A participation
- Lesson notes

**Settings Tab:**
- Profile information
- Bank account details
- Notification preferences
- Privacy settings
- Change password

---

### Admin Dashboard (Control Center)

**Main Dashboard View:**
- Total agents count
- Approved agents percentage
- Total referrals processed
- Completed transactions
- Revenue overview
- Today's order count
- Pending alerts count
- System status

**Agent Management Tab:**
- Searchable agent list
- Filter by status (pending, approved, suspended)
- Quick actions (approve, reject, suspend)
- Agent details modal
- Bulk operations
- Export capabilities
- Performance metrics per agent

**Service Management Tab:**
- Service catalog
- Category management
- Pricing configuration
- Provider management
- Availability scheduling
- Status management (active/inactive)
- Bulk edits

**Financial Management:**
- **Wallet Overview:** All user wallets
- **Payouts:** Create/process payouts, batch operations
- **Withdrawals:** Approve withdrawal requests, track status
- **Commissions:** Adjust commissions, generate reports
- **Savings Plans:** Create plans, set interest rates, manage maturity

**Order Management:**
- Data orders tracking
- Bulk order processing
- Order status updates
- Payment verification
- Refund processing
- Export orders

**Referral Management:**
- Referral approval workflow
- Commission calculation verification
- Payment processing
- Referral analytics

**Compliance Management:**
- Document verification
- KYC status tracking
- Approval/rejection workflow
- Compliance reports

**Content Management:**
- Blog post management
- Video moderation
- Audio file management
- Link cache management

**Automation & Maintenance:**
- Automation rule configuration
- Agent monitoring (at-risk detection)
- System maintenance toggle
- Storage management
- SMS bulk sending

---

## FEATURE SYSTEMS & WORKFLOWS

### 1. SERVICE PUBLISHING WORKFLOW

**Flow:** Agent → Publish Service → Admin Review → Public Display

**Steps:**
1. Agent navigates to "Publish Service" page
2. Selects service category (Salon, Property, Data, etc.)
3. Fills in service details (name, description, pricing)
4. Uploads images/media
5. Sets availability/scheduling
6. Submits for approval
7. Admin reviews in "Services" tab
8. Admin approves/requests changes
9. Service goes live or revision requested
10. Agent receives notification

**Permissions Involved:**
- Agent needs "service_publishing_permission"
- Admin needs "manage_services" permission
- Automatic RLS policies enforce ownership

---

### 2. COMMISSION EARNING WORKFLOW

**Flow:** Transaction → Commission Calculation → Approval → Payment

**Steps:**
1. Sale/transaction occurs (salon service, property, data order)
2. Order recorded in database with agent_id
3. Commission calculation triggered (based on service type)
4. Commission amount determined by tier/percentage
5. Commission added to agent's pending earnings
6. Commission shows in agent dashboard as "pending"
7. Admin reviews pending commissions
8. Admin approves (optional adjustment)
9. Commission converted to available balance
10. Agent can withdraw when threshold met

**Commission Rates by Service:**
- Salon Services: 15-25%
- Property Sales: 5-10%
- Data Orders: 10-15%
- Wholesale: 8-12%
- Fashion Referrals: 12-18%
- Referral Program: Variable

---

### 3. WITHDRAWAL REQUEST WORKFLOW

**Flow:** Agent Request → Admin Verification → Bank Processing → Completion

**Steps:**
1. Agent navigates to Wallet → Withdrawals
2. Enters withdrawal amount
3. Selects/adds bank account
4. Submits withdrawal request
5. Request appears in Admin → Payouts
6. Admin verifies funds available
7. Admin approves/rejects
8. If approved, marked for processing
9. Bank transfer initiated
10. Agent receives notification with reference
11. Status updates to "Completed" or "Failed"

**Security Measures:**
- Minimum balance requirements
- Daily/monthly limits
- Bank account verification
- Admin approval required
- Transaction logging

---

### 4. DATA ORDER SUBMISSION WORKFLOW

**Flow:** Order Form → Payment → Processing → Commission Tracking

**Steps:**
1. Agent navigates to Data Orders
2. Selects network (MTN, Vodafone, AirtelTigo)
3. Chooses bundle type and quantity
4. Reviews pricing
5. Submits with payment reference
6. Payment verification endpoint triggered
7. If verified, order marked "Processing"
8. Commission calculated and added
9. Order status tracked in agent dashboard
10. Agent can bulk download completed orders

**Data Order Types:**
- Mobile data bundles
- Voice packages
- SMS packages
- Combo packages

---

### 5. REFERRAL TRACKING WORKFLOW

**Flow:** Generate Link → Track Clicks → Convert Sale → Earn Commission

**Steps:**
1. Agent generates referral link for service
2. Link includes unique agent ID
3. Link shared via WhatsApp/social media
4. Each click tracked (URL parameter capture)
5. If clicked user makes purchase, conversion recorded
6. Commission calculated based on service value
7. Shows as "pending referral" in agent dashboard
8. Admin approves referral conversion
9. Commission paid to referrer
10. Both parties notified

**Referral Tracking Data Captured:**
- Click timestamp
- Source URL
- Browser/device info
- IP address
- Session ID
- Conversion status

---

### 6. AGENT APPROVAL WORKFLOW

**Flow:** Registration → KYC Submission → Admin Review → Approval/Rejection

**Steps:**
1. User completes agent registration form
2. Provides email, phone, business details
3. Registration payment processed (if required)
4. Account created with status "pending"
5. Agent directed to compliance/KYC page
6. Agent uploads required documents (ID, passport, etc.)
7. Documents stored and marked "pending_review"
8. Admin notified of new pending approval
9. Admin reviews agent details and documents
10. Admin approves or requests additional documents
11. If approved:
    - Status changed to "approved"
    - Agent can access dashboard
    - Publishing permissions granted
    - Notification sent to agent
12. If rejected:
    - Reason documented
    - Agent notified
    - Can reapply

---

### 7. BULK ORDER PROCESSING WORKFLOW

**Flow:** Bulk Order Submission → Payment Verification → Fulfillment → Commission

**Steps:**
1. Agent selects "Bulk Order" option
2. Chooses product type (data, merchandise, services)
3. Selects quantity (minimum order requirement)
4. Pricing calculated (volume discount applied)
5. Payment reference provided
6. Order submitted
7. Admin verifies payment in Paystack
8. Order status changes to "verified"
9. Fulfillment begins (data package bundling, etc.)
10. Agent can track progress in dashboard
11. Order marked "completed"
12. Commission calculated and added
13. Agent receives notification

---

### 8. PROPERTY LISTING WORKFLOW

**Flow:** List Property → Photo Upload → Publish → Inquiry Tracking

**Steps:**
1. Agent navigates to Properties section
2. Fills property form (location, price, details)
3. Uploads multiple property photos
4. Sets property type (house, apartment, land)
5. Listing type selection (sale, rent, lease)
6. Submits for admin approval
7. Admin reviews listing for quality
8. If approved, goes live in property marketplace
9. Customers can view and send inquiries
10. Agent receives inquiry notifications
11. Agent can follow up and convert sales
12. Commission earned on completed transactions

---

### 9. MULTI-SERVICE COMMISSION AGGREGATION

**How Multiple Services Contribute to Agent Earnings:**

```
Total Agent Commission = Sum of:
  + Salon Service Commissions
  + Property Sales Commissions
  + Data Order Commissions
  + Wholesale Product Commissions
  + Fashion Referral Commissions
  + Teaching/Course Referrals
  + Savings Plan Referrals
  + Direct Referral Program Commissions
```

**Example Calculation:**
```
Agent "John" Monthly Earnings:
- Salon services: GHS 500 (20 appointments @ 25% avg)
- Properties: GHS 1,200 (2 sales @ 5% of sale price)
- Data orders: GHS 300 (bulk orders @ 12%)
- Wholesale: GHS 450 (3 orders @ 10%)
- Fashion referrals: GHS 200 (2 converts @ 15%)
- Referral program: GHS 150 (3 signups @ 50 GHS each)
TOTAL: GHS 2,800/month
```

**Dashboard displays:**
- Breakdown by service type
- Monthly trends
- Pending vs approved
- Paid out historical data

---

## AUTHENTICATION & AUTHORIZATION

### Session Management

**Session Types:**
1. **Agent Session** - Normal agent access
2. **Admin Session** - Full platform access
3. **Public Session** - Limited access (view only)

**Session Storage:**
- Supabase Auth tokens stored in secure cookies
- Session refresh handled automatically
- Inactivity timeout (15-30 minutes configurable)
- Login notifications sent on new session

**Login Routes:**
- Agent: `/agent/login` → API validation → Dashboard redirect
- Admin: `/admin/login` → API validation → Admin dashboard redirect
- Public: No authentication required

**Session Verification:**
- Checked on every protected page load
- API middleware validates token
- RLS policies enforce data access
- Refresh token auto-renewal

### Authorization & Permissions

**Permission Model:**
- Role-based access control (RBAC)
- Granular permission flags per admin
- Service-specific permissions for agents

**Agent Permissions Table:**
```javascript
{
  "service_publishing_permission": true/false,
  "property_listing_permission": true/false,
  "wholesale_permission": true/false,
  "data_order_permission": true/false,
  "referral_program_permission": true/false,
  "can_teach": true/false,
  "can_write_professionally": true/false
}
```

**Admin Permission Levels:**
- Super Admin - All permissions
- Finance Admin - Wallet/payout management
- Compliance Admin - Verification/KYC
- Content Admin - Blog/media management
- Support Admin - Chat/ticket support

### API Authentication

**Authentication Endpoint:**
```
POST /api/auth/login
Headers: Content-Type: application/json
Body: {
  "email": "agent@example.com",
  "password": "securepassword"
}
Response: {
  "session": { token, expires_at, user },
  "user": { id, email, name, role }
}
```

**Protected Endpoint Example:**
```
GET /api/agent/wallet
Headers: Authorization: Bearer {token}
Response: {
  "balance": 5000,
  "available": 4500,
  "pending": 500,
  "transactions": [...]
}
```

**Token Validation:**
- JWT token validation
- Expiration checking
- User role verification
- Permission checking

---

## PAYMENT INTEGRATION (PAYSTACK)

### Paystack Integration Points

**Initialize Payment:**
```
POST /api/paystack/initialize
Body: {
  "amount": 50000, (in cents)
  "email": "agent@example.com",
  "metadata": { "agentId": "uuid", "orderType": "registration" }
}
Response: {
  "authorization_url": "https://checkout.paystack.co/...",
  "access_code": "...",
  "reference": "..."
}
```

**Verify Payment:**
```
POST /api/paystack/callback
Query: ?reference={PAYSTACK_REFERENCE}
Response: {
  "status": "success/failed",
  "message": "Payment verified",
  "data": { amount, customer, metadata }
}
```

**Payment Types:**
1. **Registration Payment** - Onboarding fee
2. **Data Order Payment** - Bundle purchase
3. **Subscription Payment** - Service subscriptions
4. **Bulk Order Payment** - Wholesale purchases
5. **Savings Deposit** - Plan enrollment

**Payment Flow:**
1. Agent clicks "Pay" button
2. Redirected to Paystack checkout
3. Agent enters payment details
4. Payment processed
5. Callback sent to server
6. Payment verified and recorded
7. Order status updated
8. Agent redirected to success page

---

## REAL-TIME FEATURES

### Supabase Realtime Subscriptions

**Implemented Features:**
1. **Message Updates** - Live chat notifications
2. **Order Status** - Real-time order updates
3. **Commission Tracking** - Live earnings updates
4. **User Activity** - Presence indicators
5. **Notification Delivery** - Instant alerts

**Subscription Examples:**
```typescript
// Listen for new messages
supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => console.log('New message:', payload)
  )
  .subscribe()

// Listen for commission updates
supabase
  .channel(`commissions-${agentId}`)
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'commissions' },
    (payload) => updateCommissionUI(payload)
  )
  .subscribe()
```

**Real-Time Dashboard Updates:**
- Earnings updated instantly
- Order status changes reflected
- New referral conversions displayed
- Wallet balance updates
- Notification delivery

---

## STORAGE & MEDIA MANAGEMENT

### Storage Buckets

**Bucket Structure:**
```
media-uploads/
├── agent-profiles/ (profile pictures)
├── service-images/ (salon service photos)
├── property-images/ (real estate listings)
├── product-images/ (wholesale/fashion products)
├── documents/ (compliance documents)
├── videos/ (educational videos)
├── audio/ (teaching audio files)
└── temporary/ (cache, temp files)
```

**File Upload Handling:**
1. Client compresses image (if applicable)
2. File uploaded to Supabase storage
3. URL returned and stored in database
4. Old files optionally deleted
5. CDN cache invalidated

**Image Compression:**
- Quality optimization
- Resolution adjustment
- Format conversion (WebP for modern browsers)
- Lazy loading implementation

**Storage Limits:**
- Agent profile picture: 5MB
- Service images: 10MB each (max 10 images)
- Property photos: 20MB each
- Videos: 500MB-2GB depending on type
- Documents: 10MB

---

## COMMISSION & EARNINGS SYSTEM

### Commission Tiers

**Salon Services:**
```
Tier 1: <GHS 100,000 total → 15%
Tier 2: GHS 100k-500k → 18%
Tier 3: GHS 500k+ → 22%
```

**Real Estate:**
```
Tier 1: <GHS 500k total → 3%
Tier 2: GHS 500k-2M → 5%
Tier 3: GHS 2M+ → 7%
```

**Data Orders:**
```
Fixed: 12-15% of order value
Bulk bonus: +2% for orders >GHS 5,000
```

**Wholesale:**
```
Platform commission: 8-10%
Agent profit: Flexible
Minimum markup: 10%
```

**Fashion Referrals:**
```
First-time referral: GHS 50
Repeat referral: 12% of sale
Top performers: 18% bonus tier
```

### Commission Calculation

**Process:**
1. Sale recorded with agent_id and amount
2. Service type identified
3. Appropriate commission rate applied
4. Commission amount calculated
5. Status set to "pending"
6. Displayed in agent dashboard as pending
7. Admin reviews (optional adjustment possible)
8. Commission approved/rejected
9. If approved, added to available balance
10. Agent can withdraw when minimum met

**Adjustment System:**
- Admin can manually adjust commission
- Reasons documented
- Agent notified of adjustments
- Adjustment history tracked
- Reversals possible with documentation

### Earnings Tracking

**Aggregated Data:**
- Total lifetime earnings
- Monthly breakdown
- By-service breakdown
- Paid vs pending
- Withdrawal history
- Upcoming payouts

**Reports Available:**
- Monthly earnings summary
- Service-wise breakdown
- Referral earnings
- Tax calculation (21% deduction if applicable)
- Withdrawal history

---

## REFERRAL SYSTEM

### How Referrals Work

**Referral Types:**
1. **Direct Referral** - Refer another agent
2. **Service Referral** - Refer salon service
3. **Property Referral** - Refer property listing
4. **Product Referral** - Refer wholesale product
5. **Fashion Referral** - Refer fashion items

**Referral Link Generation:**
```
Format: https://platform.com/refer/{serviceId}?agent={agentId}&ref={trackingId}
Example: https://platform.com/refer/salon-001?agent=abc123&ref=track789
```

**Referral Earnings:**
- Direct referral (new agent signup): GHS 50-100
- Service booking referral: 10% commission
- Property sale referral: 2-5%
- Product purchase referral: 5-8%
- Fashion referral: 12-18%

**Referral Tracking:**
- Unique tracking ID per link
- Click count recorded
- Time between click and purchase tracked
- Conversion rate calculated
- Earnings history displayed

**Referral Status Flow:**
```
Generated → Clicked → Tracking → Converted → Pending Approval → Approved → Paid
```

---

## NOTIFICATIONS & ALERTS

### Notification Types

**1. Email Notifications:**
- Registration confirmation
- Password reset
- Payment verification
- Order status updates
- Commission approval
- Withdrawal processing
- KYC status changes

**2. SMS Notifications:**
- Login alerts
- Order confirmations
- Payment reminders
- Commission notifications
- Withdrawal updates

**3. In-App Notifications:**
- Real-time alerts
- Unread message count
- Order status changes
- New referral conversions
- Commission updates
- Payment reminders

**4. Dashboard Alerts:**
- Pending approvals
- At-risk agents
- Low wallet balance
- Expiring documents
- Pending payments

### Alert Management

**Inactivity Notifications:**
- Warn after 10 minutes of inactivity
- Logout after 30 minutes
- Option to extend session

**Pending Alert System:**
- Counts pending items (approvals, orders, etc.)
- Displays count in admin header
- Prioritizes by type and age

---

## SEARCH & DISCOVERY

### Multi-Service Search

**Search Capabilities:**
1. **Service Search** - Find salon services by name, category, price
2. **Property Search** - Filter by location, price, bedrooms
3. **Job Search** - Search by title, location, salary range
4. **Agent Search** - Find agents, view ratings
5. **Product Search** - Browse wholesale/fashion items
6. **Candidate Search** - Find job applicants by skills/experience

**Search Features:**
- Full-text search
- Faceted filtering
- Synonym matching (education, location, skills)
- Location-based search
- Price range filtering
- Rating/review filtering
- Sorting options

**Search Optimization:**
- Search query caching
- Result ranking algorithm
- Popular results prioritized
- Personalized results based on history
- Auto-complete suggestions

---

## MOBILE-FIRST UX PATTERNS

### Responsive Design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Navigation:**
- Hamburger menu
- Bottom tab navigation
- Sticky header
- Touch-friendly buttons (48px minimum)
- Swipe gestures

**Dashboard Mobile View:**
- Cards stack vertically
- Pagination replaces infinite scroll
- Table data reorganized
- Charts responsive
- Forms optimized for mobile keyboards

### Mobile Components

**Cards:**
- Full width on mobile
- Reduced padding
- Swipeable carousel
- Click areas optimized

**Forms:**
- One field per row
- Large input areas
- Autocomplete enabled
- Validation on blur not submit
- Mobile number keyboard

**Tables:**
- Converted to card format on mobile
- Horizontal scroll with sticky columns
- Filter/sort in separate drawer
- Pagination simplifi...ed

---

## PERFORMANCE & OPTIMIZATION

### Caching Strategy

**Page Caching:**
- Agent dashboard cached (5-minute TTL)
- Admin dashboard cached (10-minute TTL)
- Service/product listings cached (1-hour TTL)
- User profiles cached (24-hour TTL)

**Query Optimization:**
- Indexed database columns
- SQL query optimization
- Result pagination (25 items/page)
- Lazy loading of related data

**Frontend Optimization:**
- Image lazy loading
- Code splitting per route
- Suspense boundaries for async components
- Memoization of expensive components
- SWR for data fetching and caching

### Database Performance

**Indexing:**
- Agent ID indexed on all transaction tables
- Email indexed for quick login
- Service/product names indexed for search
- Timestamps indexed for range queries
- Status fields indexed for filtering

**Query Patterns:**
```sql
-- Indexed for agent dashboard
SELECT * FROM commissions 
WHERE agent_id = ? AND created_at > NOW() - INTERVAL '30 days'

-- Indexed for admin list
SELECT * FROM agents 
WHERE is_approved = true AND created_at > NOW() - INTERVAL '7 days'

-- Full-text search indexed
SELECT * FROM services 
WHERE to_tsvector('english', service_name) @@ plainto_tsquery('english', ?)
```

---

## SUMMARY STATISTICS

**Platform Scope:**
- **81 Pages** across agent, admin, and public sections
- **141 API Endpoints** for all operations
- **336+ Components** for UI composition
- **106+ Library Files** for utilities and logic
- **100+ Database Tables** for comprehensive data model
- **32+ Admin Management Sections** for control
- **20+ Service Verticals** for revenue streams
- **Multi-currency Support** (GHS primary)
- **Real-time Updates** via Supabase
- **Commission-based** marketplace architecture

This platform represents a comprehensive, production-ready, enterprise-level multi-service marketplace with sophisticated commission tracking, real-time updates, and role-based access control.

---

**END OF COMPLETE PLATFORM REFERENCE DOCUMENTATION**

Version 1.0 | Generated as comprehensive single-file technical reference
