# 02 — Architecture & Design: BillBook

## 1. System overview

```
 ┌────────────────────────── Client (React PWA) ──────────────────────────┐
 │ Vite + React 18 + TypeScript · React Router · TanStack Query · Zustand │
 │ Tailwind + shadcn/ui · react-hook-form + zod · i18next · Workbox (PWA) │
 │ IndexedDB (Dexie) for offline queue + product cache                    │
 └───────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS · JSON · /api/v1
 ┌───────────────────────────────▼────────────────────────────────────────┐
 │ API (Node 20 + Express + TypeScript)                                   │
 │ middleware: helmet · cors · rate-limit · requestId · auth · tenant ·   │
 │             rbac · validate(zod) · idempotency · errorHandler          │
 │ layers: routes → controllers → services → repositories → models        │
 │ shared pure libs: money, gst, numbering (unit tested, no I/O)          │
 └──────────────┬───────────────────────────────┬─────────────────────────┘
                │                               │
        ┌───────▼────────┐            ┌─────────▼─────────┐
        │ MongoDB ATLAS   │            │ Object storage     │
        │ (replica set,   │            │ (logos, PDFs) S3/R2│
        │  txns supported)│            │                    │
        └────────────────┘            └───────────────────┘
        Optional later: Redis (rate limit, cache, queues/BullMQ)
```

**Style:** modular monolith. One deployable API, feature modules with clear boundaries. Do not use microservices.

## 2. Monorepo structure

```
billbook/
├─ apps/
│  ├─ web/                      # React PWA
│  │  ├─ src/
│  │  │  ├─ app/                # router, providers, layout
│  │  │  ├─ features/
│  │  │  │  ├─ auth/ business/ products/ parties/
│  │  │  │  ├─ sales/ purchases/ payments/ reports/ settings/
│  │  │  │  │   ├─ api.ts       # TanStack Query hooks
│  │  │  │  │   ├─ components/  pages/  schemas.ts  types.ts
│  │  │  ├─ components/ui/      # shadcn primitives
│  │  │  ├─ lib/                # http client, money fmt, i18n, db (dexie)
│  │  │  ├─ offline/            # queue, sync engine
│  │  │  └─ sw.ts               # service worker
│  └─ api/
│     ├─ src/
│     │  ├─ config/ (env.ts with zod)
│     │  ├─ middleware/
│     │  ├─ modules/
│     │  │  ├─ auth/ business/ users/ products/ parties/
│     │  │  ├─ stock/ sales/ purchases/ payments/ expenses/
│     │  │  ├─ reports/ audit/ settings/
│     │  │  │   ├─ *.routes.ts *.controller.ts *.service.ts
│     │  │  │   ├─ *.repo.ts *.model.ts *.schema.ts (zod) *.test.ts
│     │  ├─ lib/ (logger, errors, db, tx helper, pdf)
│     │  └─ server.ts / app.ts
├─ packages/
│  ├─ shared/                   # zod schemas, types, money, gst, constants
│  └─ config/                   # eslint, tsconfig, prettier
├─ docs/ (PRD, ARCHITECTURE, MEMORY, RULES, ADRs)
├─ .github/workflows/ci.yml
├─ docker-compose.yml           # mongo replica set, api, web
└─ package.json (pnpm workspaces)
```

## 3. Multi-tenancy
- Single database, shared collections. **Every document has `businessId`.**
- `tenant` middleware sets `req.ctx = { userId, businessId, role }` from the JWT.
- Repositories accept ctx and **always** add `{ businessId }` to filters. A base repo class enforces this; direct model access from controllers/services is forbidden.
- Compound indexes always start with `businessId`.

## 4. Data model (Mongoose / MongoDB)

All money is stored as **integer paise** (`amountPaise`). Quantities are decimals stored as integers in milli-units (`qtyMilli`) or Decimal128; pick milli-units (qty × 1000) for consistency.

### 4.1 Core collections

**users**
`_id, name, mobile, email, passwordHash, isActive, createdAt`

**businesses**
`_id, name, ownerId, gstin?, stateCode (e.g. "27"), address{line1,city,pincode}, phone, logoUrl, invoiceSettings{prefix, template:'a4'|'thermal80'|'thermal58', terms, footer, upiId, bankDetails}, financialYearStartMonth (default 4), allowNegativeStock(bool), plan, createdAt`

**memberships**
`_id, businessId, userId, role: 'owner'|'manager'|'cashier'|'accountant', status`
Index: `{businessId, userId} unique`

**products**
`_id, businessId, name, sku, barcode?, hsn, unit, categoryId?, purchasePricePaise, sellingPricePaise, mrpPaise?, gstRate (0|5|12|18|28), taxInclusive(bool), reorderLevelMilli, isActive, deletedAt?, searchText`
Indexes: `{businessId, barcode} unique sparse`, `{businessId, sku} unique`, text/regex index on name.
Note: **no `currentStock` source of truth here** — see `stock_balances`.

**stock_movements** (append-only ledger)
`_id, businessId, productId, type: 'opening'|'sale'|'purchase'|'sale_return'|'purchase_return'|'adjustment', qtyMilli (signed: + in, − out), refType, refId, unitCostPaise, reason?, createdBy, createdAt`
Index: `{businessId, productId, createdAt}`

**stock_balances** (denormalized, updated in same transaction)
`_id, businessId, productId, qtyMilli, updatedAt` — unique `{businessId, productId}`
Invariant: `balance == sum(movements)`. A nightly job verifies this.

**parties**
`_id, businessId, type: 'customer'|'supplier'|'both', name, mobile, gstin?, stateCode, address, creditLimitPaise?, openingBalancePaise (+ receivable / − payable), isWalkIn(bool), deletedAt?`

**invoices** (sales)
```
_id, businessId, number ("INV/2026-27/000123"), seq, fy ("2026-27"),
status: 'draft'|'issued'|'cancelled',
partyId, partySnapshot{name,gstin,stateCode,address},   // snapshot freezes legal data
placeOfSupplyState, isInterState(bool),
items[{ productId, nameSnapshot, hsn, unit, qtyMilli, ratePaise, discountPaise,
        taxableValuePaise, gstRate, cgstPaise, sgstPaise, igstPaise, totalPaise }],
discountPaise, otherChargesPaise,
totals{ taxableValuePaise, cgstPaise, sgstPaise, igstPaise, roundOffPaise, grandTotalPaise },
payments[{ mode, amountPaise, ref? }],  paidPaise, duePaise,
notes, idempotencyKey, issuedAt, cancelledAt?, cancelReason?, createdBy, createdAt
```
Indexes: `{businessId, fy, seq} unique`, `{businessId, partyId, issuedAt}`, `{businessId, idempotencyKey} unique sparse`.

**credit_notes** — same shape as invoices plus `originalInvoiceId`, `reason`.

**purchases** — like invoices with `supplierInvoiceNo`, `supplierInvoiceDate`, input-tax fields (`itcEligible`).

**payments**
`_id, businessId, partyId, direction:'in'|'out', mode, amountPaise, date, allocations[{docType, docId, amountPaise}], note, createdBy`

**ledger_entries** (party ledger, append-only)
`_id, businessId, partyId, date, docType, docId, debitPaise, creditPaise, balanceAfterPaise?`
Party balance = opening + sum(debit − credit).

**expenses** `_id, businessId, category, amountPaise, date, mode, note`

**counters**
`_id: "{businessId}:{docType}:{fy}", seq` — atomic `$inc` inside the transaction.

**audit_logs**
`_id, businessId, userId, action, entity, entityId, before?, after?, ip, at`

### 4.2 Relationships (summary)
```
business 1─* membership *─1 user
business 1─* product ─* stock_movements ─1 stock_balance
business 1─* party ─* invoices ─* payments(allocations)
invoice 1─* credit_notes
party 1─* ledger_entries
```

## 5. Critical flows

### 5.1 Issue invoice (single Mongo transaction)
```
POST /api/v1/invoices  (Idempotency-Key header required)
1. validate body (zod) → authorize (cashier+)
2. if key already used → return the stored invoice (idempotent)
3. START TXN
   a. load products (businessId-scoped), party
   b. compute totals with shared gst engine (server is source of truth;
      client totals are advisory and compared)
   c. check stock; if insufficient and !allowNegativeStock → 409
   d. counters.findOneAndUpdate($inc) → seq; build number
   e. insert invoice (status 'issued')
   f. insert stock_movements (negative) + update stock_balances ($inc)
   g. insert payments + ledger_entries (debit for dueAmount)
   h. insert audit log
   COMMIT
4. return invoice (201)
```
Any failure → full rollback. Retried requests with the same key are safe.

### 5.2 Cancel invoice
Status `issued → cancelled`. Creates reversing stock movements (+) and a reversing ledger entry. Number is **never reused**. Only owner/manager. Reason mandatory.

### 5.3 Sales return
Create credit note referencing the invoice; restock via `sale_return` movements; reduce receivable or refund.

### 5.4 Payment allocation
Payment received → allocate to oldest `issued` invoices with `dueAmount > 0` (FIFO) unless manual allocation supplied. Update `paidPaise/duePaise` on those invoices in the same transaction.

## 6. GST engine (packages/shared/gst)

Pure functions, zero I/O, 100% unit-tested.

```
calcLine({ qtyMilli, ratePaise, discountPaise, gstRate, taxInclusive, isInterState })
 → { taxableValuePaise, cgstPaise, sgstPaise, igstPaise, totalPaise }
```
Rules:
- If `taxInclusive`: `taxable = round(total * 100 / (100 + rate))`; tax = total − taxable.
- Intra-state: `cgst = floor(tax/2)`, `sgst = tax − cgst` (avoids paise drift).
- Inter-state: `igst = tax`.
- Invoice-level discount is **apportioned across lines pro-rata** before tax (largest-remainder method so the sum matches exactly).
- Round-off: `grandTotal = round to nearest 100 paise`; `roundOffPaise` stored separately.
- Place of supply: `isInterState = business.stateCode !== party.stateCode` (walk-in → same state).
- Provide a golden test file with ≥ 30 hand-verified cases.

## 7. API design (REST, /api/v1)

Conventions: JSON; plural nouns; `?page&limit&q&sort`; response envelope:
`{ data, meta?: { page, limit, total } }`, errors `{ error: { code, message, details? } }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Business | `GET/PATCH /business`, `POST /business/members`, `PATCH /business/members/:id` |
| Products | `GET/POST /products`, `GET/PATCH/DELETE /products/:id`, `GET /products/lookup?barcode=`, `POST /products/import` |
| Stock | `GET /stock/balances`, `GET /stock/movements`, `POST /stock/adjustments`, `GET /stock/low` |
| Parties | `GET/POST /parties`, `GET/PATCH/DELETE /parties/:id`, `GET /parties/:id/ledger` |
| Sales | `GET/POST /invoices`, `GET /invoices/:id`, `POST /invoices/:id/cancel`, `GET /invoices/:id/pdf`, `POST /invoices/:id/credit-notes` |
| Purchases | `GET/POST /purchases`, `GET /purchases/:id`, `POST /purchases/:id/cancel` |
| Payments | `GET/POST /payments`, `GET /payments/:id` |
| Expenses | `GET/POST /expenses`, `PATCH/DELETE /expenses/:id` |
| Reports | `GET /reports/dashboard`, `/reports/sales`, `/reports/purchases`, `/reports/stock`, `/reports/dues`, `/reports/gst-summary`, `/reports/hsn-summary`, `/reports/profit-loss`, each with `?format=csv\|xlsx` |
| Public | `GET /public/invoices/:token` (signed, expiring, read-only) |
| System | `GET /health`, `GET /ready` |

### RBAC matrix
| Action | owner | manager | cashier | accountant |
|---|:-:|:-:|:-:|:-:|
| Create invoice | ✅ | ✅ | ✅ | ❌ |
| Cancel invoice | ✅ | ✅ | ❌ | ❌ |
| Edit product price | ✅ | ✅ | ❌ | ❌ |
| Stock adjustment | ✅ | ✅ | ❌ | ❌ |
| View profit/cost | ✅ | ✅ | ❌ | ✅ |
| Reports/exports | ✅ | ✅ | ❌ | ✅ |
| Manage staff/settings | ✅ | ❌ | ❌ | ❌ |

## 8. Security design
- Passwords: argon2id (or bcrypt cost ≥ 12).
- Access JWT 15 min (memory only on client); refresh token 30 days in `httpOnly; Secure; SameSite=Lax` cookie, rotated on use, hashed in DB, revocable.
- Rate limits: login 5/min/IP+account; general 300/min/user.
- Validation with zod on every body/query/param; strip unknown keys.
- `express-mongo-sanitize`, `helmet`, strict CORS allowlist, body size limit 1 MB.
- Public invoice link: HMAC-signed token with expiry; no PII beyond invoice content.
- Secrets only via env; `.env.example` committed; never log tokens/passwords.
- Audit log for every mutating action on financial entities.

## 9. Frontend design

### Routing
`/login` · `/` dashboard · `/sales/new` (POS) · `/sales` · `/sales/:id` · `/purchases` · `/products` · `/parties` · `/parties/:id` · `/payments` · `/expenses` · `/reports/*` · `/settings/*`

### State
- Server state: TanStack Query (cache keys per feature).
- UI/local state: Zustand (POS cart, shortcuts).
- Forms: react-hook-form + zod resolver, schemas imported from `packages/shared`.

### POS screen UX
- Left: search/scan input (autofocus), product results, recent/favorites grid.
- Right: cart table with inline qty/rate/discount edit, totals panel, payment buttons.
- Shortcuts: `F2` search, `F4` customer, `F8` pay, `Ctrl+Enter` issue & print, `Esc` clear.
- Totals shown from the shared GST engine live; server re-validates.

### Design language
Pick one coherent system (suggestion: "ledger book": deep teal `#0F4C5C`, warm paper `#FAF6EE`, ink `#1B1B1B`, accent amber `#E09F3E`, Inter/IBM Plex Sans + tabular numerals for money). All amounts right-aligned, `₹` with Indian digit grouping (`1,23,456.00`) via `Intl.NumberFormat('en-IN')`.

### Offline strategy (P1)
- Workbox precache app shell; runtime-cache GET `/products` (stale-while-revalidate).
- Offline invoice = local **draft** with client UUID idempotency key, stored in Dexie `outbox`.
- On reconnect: sync engine POSTs in order; server assigns official number; UI shows "pending sync" badge until confirmed.
- Never show an official invoice number offline (show "Pending"); print a provisional receipt.

## 10. Printing & PDF
- Server PDF via Puppeteer (HTML template → PDF) or `pdfmake`; one shared HTML template per layout (A4, 80mm, 58mm).
- Browser print path uses the same React template + `@media print` CSS.
- Include: business header, GSTIN, invoice no/date, party, items table with HSN, tax breakup, amount in words (Indian), UPI QR, terms.

## 11. DevOps

### 11.1 MongoDB Atlas setup (primary database)
- **Atlas is the only database target.** Every Atlas cluster is a replica set, so multi-document transactions (required by invoice issue) work on all tiers, including the free M0.
- **One Atlas project, separate clusters/databases per environment:**
  | Env | Cluster | Database name |
  |---|---|---|
  | development | M0 free (shared by devs) or local Docker | `billbook_dev` |
  | staging | M0 / M2 | `billbook_staging` |
  | production | M10+ (dedicated, backups on) | `billbook_prod` |
- **Connection:** `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority`
  - Always use `w: "majority"` and `retryWrites=true`; run transactions with `readConcern: snapshot` / `writeConcern: majority`.
  - Create **one least-privilege DB user per environment** (readWrite on its own database only). Never use the Atlas admin user in the app.
- **Network access:** IP allowlist only the API host(s). Avoid `0.0.0.0/0` in production; on hosts with dynamic IPs use Atlas Private Endpoint/VPC peering (M10+) or a static-egress-IP add-on.
- **Connection handling:** one shared `MongoClient`/Mongoose connection per process, `maxPoolSize` ~10–20, `serverSelectionTimeoutMS` 5000; reconnect handled by the driver. Do not connect per request (important on serverless).
- **Indexes:** defined in Mongoose schemas with `autoIndex: false` in production; run a migration/`syncIndexes` script on deploy. Review **Atlas Performance Advisor** for missing indexes.
- **Backups:** M10+ continuous cloud backup with point-in-time restore; test a restore quarterly. On M0 (no backups), schedule a `mongodump` job to R2/S3.
- **Monitoring:** Atlas alerts (connections, replication lag, disk, slow queries) emailed to the owner.
- **Security:** TLS always on; enable database auditing on paid tiers; rotate DB passwords on a schedule; keep URIs only in host secret managers.
- **Free-tier limits (M0):** 512 MB storage, shared CPU, connection cap, no backups. Fine for development and demos; move production to M10+ before real customers.
- **Optional later:** Atlas Search for product name search (fuzzy, Hindi/transliteration) once regex search becomes slow.

### 11.2 Local development
- Primary: point `MONGODB_URI` at a **dev Atlas cluster** (`billbook_dev`).
- Optional offline fallback: `docker-compose.yml` with a single-node replica set `rs0` (`mongo:7 --replSet rs0`) plus init script, because transactions need a replica set even locally.
- Tests use `mongodb-memory-server` in replica-set mode; never run tests against Atlas.

### 11.3 CI/CD and hosting
- CI (GitHub Actions): install → lint → typecheck → unit tests → build.
- Deploy suggestion: API on Render/Railway/Fly; web on Vercel/Netlify/Cloudflare Pages; logo/PDF storage on Cloudflare R2.
- Environments: `development`, `staging`, `production`; migrations via `migrate-mongo`, run against the matching Atlas database as a release step.

## 12. Testing strategy
| Layer | Tool | Focus |
|---|---|---|
| Unit | Vitest | gst, money, numbering, allocation |
| Service/integration | Vitest + mongodb-memory-server (replica set) | invoice transaction, stock invariants, RBAC, tenant isolation |
| API | Supertest | contract + error cases |
| E2E | Playwright | signup → add product → bill → print → report |
| Property tests | fast-check | totals always equal sum of parts; no paise drift |

## 13. Architecture Decision Records (initial)
1. ADR-001: Modular monolith over microservices (team size, simplicity).
2. ADR-002: Money as integer paise; qty as integer milli-units.
3. ADR-003: Stock via append-only movements + denormalized balances.
4. ADR-004: Issued documents immutable; corrections via credit notes/cancellation.
5. ADR-005: Shared `packages/shared` for zod schemas + GST engine used by both client and server.
6. ADR-006: Web PWA first; Android via Capacitor later.
7. ADR-007: Single DB multi-tenant with `businessId` on every document.
