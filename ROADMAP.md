# TLR Shop → Tailor ERP — Master Planning Document

> **Vision:** Evolve the current tailor shop tool into a full-scale ERP for tailor businesses —
> covering every workflow from raw fabric procurement through customer delivery and accounting,
> comparable to Zoho (Inventory · Billing · Books · CRM · Procurement · HR · Analytics).
>
> **Design Direction:** Zoho ERP visual style — dark top module strip + white sub-navigation bar,
> clean two-column login page, professional card-based layouts throughout.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Target System — Module Map](#2-target-system--module-map)
3. [Backend Restructure (Django)](#3-backend-restructure-django)
4. [Frontend Restructure (Next.js)](#4-frontend-restructure-nextjs)
5. [Database Design Principles](#5-database-design-principles)
6. [API Design Standards](#6-api-design-standards)
7. [Authentication & Roles](#7-authentication--roles)
8. [Migration Roadmap (Phases)](#8-migration-roadmap-phases)
9. [Technology Recommendations](#9-technology-recommendations)

---

## 1. Current State Audit

### What Exists Today

| Layer    | Technology          | Status        |
|----------|---------------------|---------------|
| Backend  | Django 4 + DRF      | Single app    |
| Frontend | Next.js (App Router)| Single page   |
| DB       | SQLite (dev)        | Needs upgrade |
| Auth     | JWT (SimpleJWT)     | Basic         |

### Current Models (all in one `invoices` app)

```
Tailor          — contractor master
Invoice         — old invoice (legacy)
RateSheet       — model-no → tailor rate mapping
ShopStitching   — stitching work log
JobInvoice      — shop entry (MP001…)
TailorOrder     — order work log
Payment         — tailor payment release
```

### Current Gaps

- No customer / client management
- No fabric / accessory inventory
- No purchase orders or vendor management
- No customer-facing billing or quotations
- No accounting / ledger
- No HR (attendance, salary)
- No role-based access (anyone can do anything)
- No multi-branch / multi-shop support
- No reporting or dashboards
- SQLite not production-ready

---

## 2. Target System — Module Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TAILOR ERP PLATFORM                          │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│   CRM        │  INVENTORY   │ PROCUREMENT  │    PRODUCTION          │
│  Customers   │  Fabric      │  Vendors     │    Job Invoices        │
│  Leads       │  Accessories │  Purchase    │    Tailor Orders       │
│  Pipeline    │  Stock       │  Orders      │    Shop Entries        │
│  History     │  Warehouses  │  GRN         │    Quality Check       │
├──────────────┼──────────────┼──────────────┼────────────────────────┤
│   BILLING    │   FINANCE    │     HR       │    ANALYTICS           │
│  Quotations  │  Payments    │  Tailors     │    Dashboard           │
│  Sales Orders│  Expenses    │  Attendance  │    Reports             │
│  Invoices    │  Ledger      │  Salary      │    BI Charts           │
│  Price Lists │  Accounts    │  Performance │    Export              │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
                           │
              ┌────────────┴──────────────┐
              │       CORE / MASTER       │
              │  Users · Roles · Settings │
              │  Branches · Currencies    │
              └───────────────────────────┘
```

### Module Details

#### 2.1 CRM
| Feature | Description |
|---------|-------------|
| Customer Master | Name, phone, address, tags, customer type (retail/wholesale) |
| Contact History | WhatsApp, calls, notes log |
| Lead Pipeline | New → Quoted → Confirmed → Delivered |
| Measurements | Per-customer body measurements stored for reuse |
| Loyalty / Credit | Credit limit, loyalty points |

#### 2.2 Inventory
| Feature | Description |
|---------|-------------|
| Item Master | Fabric, lining, buttons, thread — unit, HSN code |
| Stock Ledger | Every in/out movement with date and reference |
| Warehouse / Rack | Multi-location stock (branch A, branch B, storage) |
| Reorder Alerts | Low-stock notification |
| Fabric Consumption | Link fabric used per job |

#### 2.3 Procurement
| Feature | Description |
|---------|-------------|
| Vendor Master | Suppliers for fabric, accessories |
| Purchase Orders | PO with line items, expected date |
| Goods Receipt (GRN) | Receive against PO, update stock |
| Purchase Invoice | Vendor bill linked to GRN |
| Vendor Payments | Pay supplier, track outstanding |

#### 2.4 Production (current core, expanded)
| Feature | Description |
|---------|-------------|
| Job Invoice (Shop) | MP001… master job card |
| Tailor Assignment | Assign job to specific tailor |
| Tailor Order | Stitching order log with qty and amount |
| Rate Sheet | Model-no → tailor rate card |
| Quality Check | Pass/fail per job, rework log |
| Delivery Status | Pending → In-Work → QC → Delivered |

#### 2.5 Billing (Customer-facing)
| Feature | Description |
|---------|-------------|
| Quotation | Price estimate to customer |
| Sales Order | Confirmed order from customer |
| Customer Invoice | Bill raised to customer |
| Price List | Different rates for retail / wholesale |
| Advance Receipt | Customer advance payment |

#### 2.6 Finance / Books
| Feature | Description |
|---------|-------------|
| Chart of Accounts | Assets, Liabilities, Income, Expense |
| Journal Entries | Double-entry bookkeeping |
| Tailor Payments | Pay tailor (existing, expanded) |
| Customer Receipts | Receive from customer |
| Expense Tracking | Rent, utilities, petty cash |
| Bank Reconciliation | Match bank statement |
| P&L Statement | Profit & Loss by period |
| Balance Sheet | Assets vs liabilities snapshot |

#### 2.7 HR
| Feature | Description |
|---------|-------------|
| Tailor Profiles | Specialization, experience, contract type |
| Attendance | Daily attendance log |
| Leave Management | Leave requests and approval |
| Salary / Piece-rate | Monthly salary or per-piece pay calculation |
| Performance | Pieces completed, quality score |

#### 2.8 Analytics & Reports
| Feature | Description |
|---------|-------------|
| Dashboard | KPI cards — revenue, pending balance, stock alerts |
| Production Report | Pieces in/out by tailor, by model |
| Financial Report | P&L, cash flow, tailor balance aging |
| Inventory Report | Stock valuation, consumption |
| CRM Report | Customer acquisition, repeat orders |
| Custom Export | Excel / PDF / CSV |

---

## 3. Backend Restructure (Django)

### 3.1 App Structure (from 1 app → 8 focused apps)

```
backend/
├── config/                  # Django project settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
│
├── core/                    # Shared: users, roles, branches, currencies
│   ├── models.py            # User, Role, Branch, Currency, Setting
│   ├── serializers.py
│   ├── views.py
│   └── permissions.py       # Custom DRF permissions
│
├── crm/                     # Customers, leads, measurements
│   ├── models.py            # Customer, Lead, Measurement, ContactLog
│   ├── serializers.py
│   └── views.py
│
├── inventory/               # Items, stock, warehouses
│   ├── models.py            # Item, Warehouse, StockEntry, StockLedger
│   ├── serializers.py
│   └── views.py
│
├── procurement/             # Vendors, POs, GRN
│   ├── models.py            # Vendor, PurchaseOrder, POLine, GRN, GRNLine
│   ├── serializers.py
│   └── views.py
│
├── production/              # Current invoices app (renamed & expanded)
│   ├── models.py            # JobInvoice, TailorOrder, RateSheet, QualityCheck
│   ├── serializers.py
│   └── views.py
│
├── billing/                 # Customer-facing sales
│   ├── models.py            # Quotation, SalesOrder, CustomerInvoice, PriceList
│   ├── serializers.py
│   └── views.py
│
├── finance/                 # Payments, accounts, ledger
│   ├── models.py            # Account, JournalEntry, Payment, Expense
│   ├── serializers.py
│   └── views.py
│
├── hr/                      # Tailors as employees
│   ├── models.py            # Tailor, Attendance, Salary, Leave
│   ├── serializers.py
│   └── views.py
│
└── reports/                 # Aggregation endpoints (read-only)
    └── views.py
```

### 3.2 Key New Models (additions to current)

```python
# core/models.py
class Branch(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

class User(AbstractUser):
    branch = models.ForeignKey(Branch, null=True, on_delete=models.SET_NULL)
    role = models.CharField(choices=[...])  # admin, manager, cashier, viewer

# crm/models.py
class Customer(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    customer_type = models.CharField(choices=['retail','wholesale'])
    credit_limit = models.DecimalField(...)

class Measurement(models.Model):
    customer = models.ForeignKey(Customer, ...)
    label = models.CharField()        # "Kandura", "Suit"
    measurements = models.JSONField() # {"shoulder": 42, "length": 55 ...}
    recorded_at = models.DateField()

# inventory/models.py
class Item(models.Model):
    name = models.CharField()
    category = models.CharField()     # fabric, accessory, thread
    unit = models.CharField()         # meter, piece, kg
    reorder_level = models.DecimalField()

class StockEntry(models.Model):
    item = models.ForeignKey(Item, ...)
    warehouse = models.ForeignKey(Warehouse, ...)
    entry_type = models.CharField()   # in, out, adjustment
    quantity = models.DecimalField()
    reference = models.CharField()    # PO-001, JOB-MP001
    date = models.DateField()

# finance/models.py
class Account(models.Model):
    name = models.CharField()
    account_type = models.CharField() # asset, liability, income, expense
    code = models.CharField(unique=True)

class JournalEntry(models.Model):
    date = models.DateField()
    reference = models.CharField()
    narration = models.TextField()
    # Lines created as JournalLine (debit/credit)
```

### 3.3 URL Structure

```
/api/v1/
  core/        users/, roles/, branches/, settings/
  crm/         customers/, leads/, measurements/
  inventory/   items/, warehouses/, stock/
  procurement/ vendors/, purchase-orders/, grn/
  production/  job-invoices/, tailor-orders/, rate-sheets/
  billing/     quotations/, sales-orders/, customer-invoices/
  finance/     payments/, expenses/, accounts/, journal/
  hr/          tailors/, attendance/, salary/
  reports/     dashboard/, production/, financial/, inventory/
```

---

## 4. Frontend Restructure (Next.js)

### 4.1 Folder Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   │
│   ├── (dashboard)/          # All protected pages
│   │   ├── layout.tsx        # Sidebar + topbar shell
│   │   │
│   │   ├── dashboard/page.tsx
│   │   │
│   │   ├── crm/
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   └── [id]/page.tsx     # Detail / edit
│   │   │   ├── leads/page.tsx
│   │   │   └── measurements/page.tsx
│   │   │
│   │   ├── inventory/
│   │   │   ├── items/page.tsx
│   │   │   ├── stock/page.tsx
│   │   │   └── warehouses/page.tsx
│   │   │
│   │   ├── procurement/
│   │   │   ├── vendors/page.tsx
│   │   │   ├── purchase-orders/page.tsx
│   │   │   └── grn/page.tsx
│   │   │
│   │   ├── production/           # Current job-invoice (renamed)
│   │   │   ├── shop/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   └── rate-sheets/page.tsx
│   │   │
│   │   ├── billing/
│   │   │   ├── quotations/page.tsx
│   │   │   ├── sales-orders/page.tsx
│   │   │   └── invoices/page.tsx
│   │   │
│   │   ├── finance/
│   │   │   ├── payments/page.tsx     # Current payment tab (moved here)
│   │   │   ├── expenses/page.tsx
│   │   │   └── accounts/page.tsx
│   │   │
│   │   ├── hr/
│   │   │   ├── tailors/page.tsx      # Current tailors page
│   │   │   ├── attendance/page.tsx
│   │   │   └── salary/page.tsx
│   │   │
│   │   └── reports/
│   │       ├── dashboard/page.tsx
│   │       ├── production/page.tsx
│   │       └── financial/page.tsx
│   │
│   └── globals.css
│
├── components/
│   ├── ui/                   # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── DatePicker.tsx
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── forms/                # Shared form patterns
│   │   ├── FormField.tsx
│   │   └── SearchBar.tsx
│   │
│   └── charts/               # Dashboard charts
│       ├── BarChart.tsx
│       └── LineChart.tsx
│
├── lib/
│   ├── api/                  # One file per module
│   │   ├── client.ts         # Axios instance + interceptors
│   │   ├── core.ts
│   │   ├── crm.ts
│   │   ├── inventory.ts
│   │   ├── procurement.ts
│   │   ├── production.ts
│   │   ├── billing.ts
│   │   ├── finance.ts
│   │   └── hr.ts
│   │
│   ├── hooks/                # Reusable data hooks
│   │   ├── useTable.ts       # Pagination + search + sort
│   │   ├── useForm.ts
│   │   └── useAuth.ts
│   │
│   └── utils/
│       ├── format.ts         # Currency, date formatting
│       └── constants.ts
│
└── types/                    # Shared TypeScript interfaces
    ├── crm.ts
    ├── inventory.ts
    ├── production.ts
    ├── finance.ts
    └── hr.ts
```

### 4.2 Navigation Design — Zoho-Inspired Double Bar

```
BAR 1 (dark #1a1a2e, sticky top):
[■■] MEHAR PARDHA ERP   Production | Tailors | Rate Sheet | All Modules ▾   🔍 Sign out [M]

BAR 2 (white, sticky below bar 1):
[■■] Tailor ERP  |  Dashboard   Production   Tailors   Reports  (blue underline = active)
```

- Bar 1: dark navy, all module links with pipe separators, search icon, user avatar
- Bar 2: white, compact logo, page-level sub-nav with blue active underline
- Both bars sticky — mirrors Zoho's two-row navigation structure
- Mobile: hamburger collapses both into dark dropdown

### 4.3 Login Page Design — Zoho-Inspired Two-Column

```
Background: #f0f2f5 (light gray)
┌─────────────────────────────────────┐
│  [■■]           │  [SVG Illustration] │
│  Sign in        │                   │
│  to access      │  Tailor ERP       │
│  Tailor ERP     │  [feature chips]  │
│  [username]     │                   │
│  [Next]         │                   │
└─────────────────┴───────────────────┘
© 2026, Mehar Pardha — Deira, Dubai
```

- Two-step flow: username → Next → password → Sign In
- Right panel: gradient blue illustration + feature chips
- No redirect to external auth — internal JWT

### 4.4 Sidebar Navigation Design (future reference)

```
TAILOR ERP
─────────────
  Dashboard

  CRM
    Customers
    Leads
    Measurements

  Inventory
    Items
    Stock
    Warehouses

  Procurement
    Vendors
    Purchase Orders
    Goods Receipt

  Production
    Shop (Job Invoices)
    Orders
    Rate Sheets

  Billing
    Quotations
    Sales Orders
    Invoices

  Finance
    Payments
    Expenses
    Accounts

  HR
    Tailors
    Attendance
    Salary

  Reports
    Dashboard
    Financial
    Production
─────────────
  Settings
  Users & Roles
```

### 4.3 Shared `useTable` Hook Pattern

All list pages use one consistent hook:
```typescript
// lib/hooks/useTable.ts
function useTable<T>(fetchFn, options) {
  // page, pageSize, search, dateRange, sort
  // returns: { data, total, loading, setPage, setSearch, ... }
}

// Usage in any page:
const { data, total, loading, setSearch, setPage } = useTable(getCustomers)
```

---

## 5. Database Design Principles

### 5.1 Switch from SQLite → PostgreSQL (production)
- Full-text search
- JSON fields with indexing
- Better decimal precision
- Concurrent writes

### 5.2 Consistent Column Conventions

| Pattern | Convention |
|---------|------------|
| Primary key | `id` (auto, bigint) |
| Foreign keys | `{model}_id` |
| Timestamps | `created_at`, `updated_at` (auto) |
| Soft delete | `deleted_at` (nullable) — never hard-delete |
| Status fields | `status` with defined choices, not booleans |
| Amounts | `DecimalField(max_digits=14, decimal_places=2)` |
| Dates | `DateField` for business dates, `DateTimeField` for audit |
| User tracking | `created_by`, `updated_by` FK to User |
| Branch scoping | Every transactional table has `branch_id FK` |

### 5.3 Soft Delete Pattern
```python
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, ...)
    deleted_at = models.DateTimeField(null=True, blank=True)
    objects = SoftDeleteManager()
    all_objects = models.Manager()
    class Meta:
        abstract = True
```

---

## 6. API Design Standards

### 6.1 Versioned URLs
```
/api/v1/production/job-invoices/
/api/v2/production/job-invoices/   ← non-breaking additions
```

### 6.2 Consistent Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 250, "page_size": 20 },
  "errors": null
}
```

### 6.3 Standard Query Params
```
GET /api/v1/production/job-invoices/
  ?search=MP001          full-text search
  ?date_from=2026-01-01  date range
  ?date_to=2026-06-30
  ?tailor=TLR01          filter by code
  ?page=2
  ?page_size=20
  ?sort=-date            prefix - for descending
```

### 6.4 Action Endpoints (custom)
```
POST   /api/v1/finance/payments/{id}/approve/
POST   /api/v1/billing/quotations/{id}/convert-to-order/
GET    /api/v1/reports/dashboard/
GET    /api/v1/production/job-invoices/tailor-summary/?date=2026-06-25
```

---

## 7. Authentication & Roles

### 7.1 Roles

| Role | Access |
|------|--------|
| Super Admin | Everything + settings, users |
| Manager | All modules, cannot manage users |
| Cashier | Finance (payments), billing only |
| Production Staff | Production module only |
| Viewer | Read-only on all modules |

### 7.2 Permission Strategy
```python
# core/permissions.py
class HasModulePermission(BasePermission):
    def has_permission(self, request, view):
        module = getattr(view, 'module', None)
        return request.user.role.has_access(module, request.method)
```

### 7.3 Branch Scoping
All API responses auto-filtered by `request.user.branch`:
```python
class BranchScopedViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return super().get_queryset().filter(branch=self.request.user.branch)
```

---

## 8. Migration Roadmap (Phases)

### Phase 1 — Foundation (Current → Stable) ✓ DONE
- [x] Job Invoices (Shop)
- [x] Tailor Orders
- [x] Payments with balance summary
- [x] Opening / Closing balance by date
- [x] Tailor CRUD with pagination
- [ ] Switch SQLite → PostgreSQL
- [ ] Add `updated_at` to all models
- [ ] Add `branch` model (single branch for now)

### Phase 2 — HR & Production Upgrade
- [ ] Tailor profiles (specialization, join date, contract type)
- [ ] Attendance module
- [ ] Salary / piece-rate calculation
- [ ] Job delivery status (Pending → In-Work → Done)
- [ ] Quality check per job

### Phase 3 — CRM
- [ ] Customer master
- [ ] Customer measurements store
- [ ] Order-to-customer linking
- [ ] WhatsApp message history log
- [ ] Lead pipeline

### Phase 4 — Inventory
- [ ] Item / fabric master
- [ ] Stock in/out log
- [ ] Link fabric consumption to job invoices
- [ ] Low stock alerts

### Phase 5 — Procurement
- [ ] Vendor master
- [ ] Purchase orders
- [ ] Goods receipt → auto-update stock
- [ ] Vendor payment tracking

### Phase 6 — Billing (Customer-facing)
- [ ] Quotations
- [ ] Customer invoices (with line items)
- [ ] Advance receipt
- [ ] Price lists

### Phase 7 — Accounting / Books
- [ ] Chart of accounts
- [ ] Double-entry journal (auto-post on every transaction)
- [ ] P&L, Balance Sheet
- [ ] Bank reconciliation

### Phase 8 — Analytics & Reports
- [ ] KPI dashboard (charts)
- [ ] Production analytics (by tailor, by model, by period)
- [ ] Financial aging report (tailor outstanding)
- [ ] Custom date-range exports (Excel / PDF)

### Phase 9 — Multi-branch & SaaS
- [ ] Branch management
- [ ] Per-branch data isolation
- [ ] Tenant management (if SaaS)
- [ ] Subscription billing

---

## 9. Technology Recommendations

### Backend

| Concern | Current | Recommended |
|---------|---------|-------------|
| Framework | Django 4 + DRF | Keep — mature, batteries-included |
| Database | SQLite | **PostgreSQL** (switch in Phase 1) |
| Cache | None | Redis (for session, rate-limits, report cache) |
| Task Queue | None | Celery + Redis (for reports, email, WhatsApp) |
| File Storage | Local | AWS S3 / Cloudflare R2 (receipts, attachments) |
| Search | Basic filter | PostgreSQL full-text or Meilisearch |
| PDF Generation | None | WeasyPrint or ReportLab |

### Frontend

| Concern | Current | Recommended |
|---------|---------|-------------|
| Framework | Next.js App Router | Keep |
| Styling | Tailwind CSS v4 | Keep |
| State | useState/useCallback | React Query (server state) + Zustand (UI state) |
| Tables | Custom HTML | TanStack Table (sorting, pagination, grouping) |
| Charts | None | Recharts or Chart.js |
| Forms | Manual | React Hook Form + Zod validation |
| PDF/Print | None | react-pdf or browser print CSS |
| Date | Manual | date-fns |

### Infrastructure (when scaling)

| Concern | Recommendation |
|---------|---------------|
| Deploy Backend | Docker + Gunicorn + Nginx |
| Deploy Frontend | Vercel or Docker |
| CI/CD | GitHub Actions |
| Monitoring | Sentry (errors) + Grafana (metrics) |
| Backup | Automated daily PostgreSQL dumps |

---

## Summary

The current app is **Phase 1 complete** — a solid, working foundation for the Production module. The path forward is additive: each phase builds on top of existing data without breaking what's already working. The key structural decisions to make **now** (before Phase 2) are:

1. **Switch to PostgreSQL** — do this before data grows large
2. **Add `branch` and `User` role models** — all future tables will reference these
3. **Split `invoices` app into `production` + `hr`** — before adding more models
4. **Create the shared `BaseModel`** — so all new tables get `created_by`, `updated_at`, `deleted_at` for free

Everything else can be added module by module without restructuring what exists.
