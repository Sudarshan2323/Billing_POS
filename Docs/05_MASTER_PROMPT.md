# 05 — MASTER PROMPT (paste into Claude Code / Cursor / Copilot agent)

## How to use
1. Create the repo; put the 5 docs in `docs/`; copy `03_PROJECT_MEMORY.md` to the root as `CLAUDE.md`.
2. Paste **THE MASTER PROMPT** below once to start.
3. Then feed **one phase prompt at a time** (Section B). Review, run tests, commit, move on.
4. After each phase, tell the AI: "Update CLAUDE.md current state."

---

## A. THE MASTER PROMPT

```
ROLE
You are a senior full-stack engineer and technical lead building "BillBook",
a GST-ready billing and inventory SaaS for small Indian businesses, using
TypeScript MERN (React + Vite, Express, MongoDB Atlas via Mongoose), delivered
as a PWA. The database is always MongoDB Atlas (managed replica set).

CONTEXT FILES (read first, in order)
1. CLAUDE.md                      – project memory, invariants, current state
2. docs/01_ANALYSIS_AND_PRD.md    – scope, modules, acceptance criteria
3. docs/02_ARCHITECTURE.md        – structure, schema, flows, API, security
4. docs/04_RULES.md               – coding, security, testing, process rules
If these conflict with anything I say later, tell me and ask which wins.

OPERATING PROCEDURE (every session)
1. Read the files above. Summarize the current state and the task in ≤ 10 lines.
2. Propose a short plan (files to create/change, tests to write). Wait for my
   "go" ONLY if the plan changes architecture or scope; otherwise proceed.
3. Implement in small steps. Write tests with the code (not after).
4. Run lint, typecheck, and tests. Show real output. Fix failures; never
   disable or skip tests to get green.
5. Commit with Conventional Commit messages after each coherent step.
6. At the end: update CLAUDE.md (§5 Current state, §6 checklist, §7 decisions),
   then give me: what changed, how to run/verify it, risks, and next step.

HARD INVARIANTS (never violate; see CLAUDE.md §3)
- Money is integer paise. Quantities are integer milli-units. No floats.
- All GST math only in packages/shared/gst, used by both client and server.
- Every query scoped by businessId through the base repository.
- Issued invoices are immutable; corrections via cancel/credit note.
- Invoice number allocation + invoice + stock + ledger + payments + audit
  happen in ONE Mongo transaction, with idempotency key support.
- Server recomputes totals and never trusts client-supplied totals,
  businessId, role, or prices.

QUALITY BAR
- TypeScript strict, zod validation at every boundary, typed errors.
- Tests: unit (gst, money, numbering, allocation), integration (transactions,
  tenant isolation, RBAC), and e2e for the main flow.
- Mobile-first UI with loading/empty/error states; keyboard-friendly POS.
- No unrequested features. No placeholder/fake data in production paths.
- If unsure about GST rules or legal behavior, say so and ask me to verify
  against official sources instead of guessing.

COMMUNICATION STYLE
Be concise and practical. Show file paths. No long theory. When you finish a
phase, stop and wait for my next instruction.

FIRST TASK
Confirm you have read all four files, list any contradictions or missing
decisions you found (max 10 bullets), then wait for me to give you Phase 1.
```

---

## B. PHASE PROMPTS (use one at a time)

### Phase 1 — Scaffolding
```
PHASE 1: Scaffold the monorepo per docs/02_ARCHITECTURE.md §2.
- pnpm workspaces: apps/api, apps/web, packages/shared, packages/config.
- TypeScript strict configs, ESLint (incl. rule banning direct Mongoose model
  use outside repositories and banning `any`), Prettier, Vitest, husky +
  lint-staged, commitlint.
- apps/api: Express app factory, env validation (zod), pino logger with
  request IDs, helmet, cors allowlist, rate limit, error handler, /health and
  /ready, Mongo connection helper, transaction helper (withTxn).
- apps/web: Vite + React + TS, Tailwind, shadcn/ui init, React Router,
  TanStack Query provider, i18next setup, basic layout shell.
- Database is MongoDB ATLAS: read MONGODB_URI (mongodb+srv, retryWrites,
  w=majority) from env, validate with zod, single shared connection with
  sensible pool/timeouts, transaction helper using snapshot/majority concerns.
  Provide a short docs/ATLAS_SETUP.md (create cluster, DB user, IP allowlist,
  get URI). docker-compose.yml with a single-node replica set (rs0) is an
  OPTIONAL offline fallback only.
- GitHub Actions CI: install, lint, typecheck, test, build.
- .env.example for api and web. README with run instructions.
Deliver: working `pnpm dev`, `pnpm test`, `pnpm lint`. Add a trivial test per app.
```

### Phase 2 — Shared package (money, GST, schemas)
```
PHASE 2: Build packages/shared.
- money.ts: toPaise(rupeesString), formatINR(paise), add/sub helpers, safe
  integer assertions, amountInWordsIndian(paise).
- gst/: calcLine, calcInvoice (apportion invoice discount via largest-remainder),
  tax-inclusive and exclusive modes, CGST/SGST split without paise drift,
  IGST for inter-state, round-off to nearest rupee as a separate field.
- fy.ts: getFinancialYear(date) => "2026-27", buildInvoiceNumber(prefix, fy, seq).
- stateCodes.ts: Indian state codes list; GSTIN regex validator + checksum.
- zod schemas + types for: product, party, invoice input, payment, business.
- Tests: ≥ 30 golden GST cases (document each by hand in comments), fast-check
  property tests (sum of parts equals total; never negative; deterministic).
Coverage for this package must be 100% lines/branches.
```

### Phase 3 — Auth, business, RBAC, tenancy
```
PHASE 3: Implement modules auth, users, business, memberships.
- Register creates user + business + owner membership atomically.
- Login, refresh (rotating, hashed, revocable refresh tokens in httpOnly cookie),
  logout, /auth/me.
- Middleware chain: auth → tenant (req.ctx) → rbac(permission) → validate.
- Base repository enforcing businessId on all operations.
- RBAC permission map per docs/02 §7; invite/manage staff endpoints.
- Tests: tenant isolation (A cannot touch B), RBAC per route, token rotation
  and reuse detection, rate-limited login.
Also build the web login/register screens with form validation and an
in-memory access-token auth provider with silent refresh.
```

### Phase 4 — Products and inventory
```
PHASE 4: Products + stock.
- Product CRUD (soft delete), barcode/SKU uniqueness per business, HSN, GST
  rate, tax-inclusive flag, reorder level.
- stock_movements (append-only) + stock_balances (updated in same txn).
- Adjustment endpoint requiring reason; opening stock on product create.
- Low-stock endpoint; product search (name/sku/barcode) < 200 ms using indexes.
- CSV import with dry-run preview and row-level error report.
- Invariant job/test: balance == sum(movements).
Web: product list (search, filter, pagination), add/edit form, stock adjust
dialog, CSV import wizard, low-stock badge.
```

### Phase 5 — Parties and ledger
```
PHASE 5: Customers/suppliers.
- Party CRUD with GSTIN validation, state code, opening balance, walk-in default.
- ledger_entries append-only; balance endpoint; GET /parties/:id/ledger with
  running balance and date filters.
- Credit limit warning flag (non-blocking, configurable).
Web: parties list/detail with ledger tab, quick-add inside POS.
```

### Phase 6 — Sales invoices (the core)
```
PHASE 6: Sales.
- Implement POST /invoices exactly per docs/02 §5.1: idempotency, one
  transaction, counters.$inc numbering per FY, stock check with
  allowNegativeStock, stock movements, payments, ledger, audit log.
- Cancel (owner/manager, reason required, reversing entries, number kept).
- Credit notes with restock and ledger reversal.
- Server recompute; reject mismatch > 1 paisa with TOTAL_MISMATCH.
- Drafts (save/resume), quotations convert to invoice (P1).
- Tests: concurrency (parallel issues never duplicate/skip numbers), rollback
  on failure, idempotent retry, insufficient stock, inter vs intra-state.
Web: POS screen per docs/02 §9 with keyboard shortcuts, live totals using the
shared GST engine, split payments, hold/resume, invoice list and detail.
```

### Phase 7 — Payments and expenses
```
PHASE 7: Payments (in/out) with FIFO or manual allocation updating invoice
paid/due in the same txn; advance payments; expenses CRUD with categories.
Tests for allocation edge cases (overpay, partial, multiple invoices, reversal).
Web: record-payment dialog from party/invoice, payments list, expenses page.
```

### Phase 8 — Purchases
```
PHASE 8: Purchases + purchase returns (debit notes): increase stock, input tax
capture with ITC flag, supplier ledger, payments out, optional average-cost
update. Tests mirror the sales module. Web: purchase entry screen.
```

### Phase 9 — Reports and dashboard
```
PHASE 9: Reports API + UI.
Dashboard (today sales, mode split, receivables, payables, low stock, top
items, 7/30-day trend), sales/purchase registers, stock summary, dues aging,
GST summary (by rate, CGST/SGST/IGST, ITC), HSN summary, simple P&L.
All with date filters and CSV/XLSX export. Use aggregation pipelines with
indexes; add explain() checks in tests for the heavy ones.
Charts via Recharts, lazy-loaded.
```

### Phase 10–11 — Frontend completion
```
PHASE 10/11: Polish the frontend.
Design system "ledger book" (deep teal, warm paper, amber accent; tabular
numerals). Responsive nav (sidebar desktop, bottom tabs mobile). Empty,
loading, error states everywhere. Indian number grouping. Hindi/Marathi i18n
scaffolding with extracted strings. Accessibility pass (labels, focus,
contrast). Lighthouse mobile ≥ 90 on POS.
```

### Phase 12 — Print, PDF, sharing
```
PHASE 12: Invoice templates A4, 80mm, 58mm (shared HTML/CSS) with GSTIN, HSN
table, tax breakup, amount in words, UPI QR, terms. Server PDF endpoint.
Public signed invoice link with expiry; WhatsApp share via wa.me with the
link. Print preview and settings for template and paper size.
```

### Phase 13 — PWA offline
```
PHASE 13: Service worker (Workbox), installable manifest, product cache,
Dexie outbox for offline drafts with client UUID idempotency keys, sync
engine with retry/backoff, "pending sync" UI, provisional receipt without
an official number. Test the sync with network throttling and duplicates.
```

### Phase 14 — Hardening
```
PHASE 14: Security and quality review against docs/04_RULES.md. Dependency
audit, secret scan, CORS/helmet verification, rate-limit tuning, authZ
sweep (every route), load test the invoice endpoint (k6), fix N+1 and slow
queries, e2e suite (Playwright) for signup→product→bill→print→report.
Produce SECURITY_REVIEW.md listing findings and fixes.
```

### Phase 15 — Deploy
```
PHASE 15: Dockerfiles, production config, production Atlas M10+ cluster
(least-privilege user, IP allowlist/private endpoint, continuous backup,
alerts, Performance Advisor review, index sync step, tested restore),
R2/S3 for assets, deploy API and web, Sentry, uptime check, backup and
restore runbook, seed/demo data script, user guide and API docs.
```

---

## C. UTILITY PROMPTS

**Resume a session**
```
Read CLAUDE.md and summarize current state, last phase, and next step in 8 lines. Then continue with: <task>.
```

**Review before merge**
```
Review the diff against docs/04_RULES.md and the PR checklist. List violations by severity with file:line and proposed fixes. Do not change code yet.
```

**Debug**
```
Bug: <description>. Reproduce with a failing test first, find the root cause (explain in ≤ 5 lines), fix it, show test output.
```

**Add a feature safely**
```
Feature: <idea>. Check against the PRD scope. If outside MVP, say so and propose where it fits. If in scope, give a plan with schema/API/UI/test changes before coding.
```

**Verify GST logic**
```
Generate 15 new GST test scenarios (mixed rates, tax-inclusive, inter-state, discounts, round-off) with hand calculations, then run them against calcInvoice and report any mismatch.
```
