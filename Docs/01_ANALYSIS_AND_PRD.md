# 01 — Analysis & PRD: BillBook (working name — rename freely)

GST-ready Billing + Inventory SaaS for small Indian businesses. MERN stack, web-first PWA.

---

## PART A — ANALYSIS

### A1. Problem
Small Indian retailers and wholesalers still bill on paper or in Excel. They struggle with:
- GST-correct invoices (CGST/SGST/IGST split, HSN codes, rounding)
- Knowing live stock and low-stock items
- Tracking customer credit (udhaar/khata) and supplier dues
- Getting reports ready for the accountant (sales, purchase, GSTR-1/3B summaries)

### A2. Competitive landscape
Vyapar, Zoho Invoice/Books, Marg, Busy, Tally, myBillBook. All are feature-rich but generic or heavy.
**Opportunity:** do fewer things better, for ONE niche, with a fast, simple UI and WhatsApp-first sharing.

### A3. Target Niche: Hardware, Electrical, Plumbing & Building Materials
- **Categories:** Plumbing, Electrical, Paint, Tools, Fasteners (nuts/bolts/screws), Pipes & Fittings, Cement & Building Material, Sanitaryware, Adhesives, Safety Gear, Locks & Hinges.
- **Customers:** Building contractors, plumbers, electricians, builders, and walk-in retail.
- **Key Needs:** Visible item descriptions with technical specs, dual price tiers (Retail vs Contractor/Wholesale), Khata credit ledger with aging & FIFO settlement, Estimate/Quotation conversion, and Admin Report Builder.

### A4. Users & personas
1. **Owner (Ramesh, 45):** low tech comfort, wants daily sales, profit, dues. Uses phone + shop PC.
2. **Cashier (Sunita, 24):** needs speed. Billing in under 20 seconds, keyboard-first.
3. **Accountant (CA, part-time):** needs exports, GST summary, ledgers.

### A5. Differentiators (shortlist)
1. Billing screen optimized for speed (keyboard shortcuts, barcode, recent items)
2. One-tap WhatsApp invoice share (PDF link)
3. Offline-first PWA for billing (sync later)
4. Udhaar/khata ledger with payment reminders
5. Simple, local-language-ready UI (English + Hindi/Marathi i18n)
6. v2: sales forecasting, low-stock reorder suggestions

### A6. Key risks
| Risk | Mitigation |
|---|---|
| Wrong GST math | Pure, unit-tested tax functions; integer paise; test vectors |
| Stock going out of sync | Stock movements ledger + transactional writes |
| Invoice tampering/legal issues | Issued invoices immutable; credit notes only |
| Offline conflicts | Offline limited to creating bills; server assigns final invoice number on sync (or reserved number ranges per device) |
| Scope creep | Strict MVP boundary below |

---

## PART B — PRD

### B1. Goals & non-goals
**Goals (MVP):** a shop can sign up, add items, create GST invoices, track stock and customer dues, and view basic reports, all in one day of setup.
**Non-goals (MVP):** e-invoicing/IRN, e-way bill, GST portal filing, payroll, accounting double-entry, multi-warehouse, native mobile app, payment gateway settlement.

### B2. Success metrics
- Time to first invoice after signup: < 10 min
- Bill creation time (cashier, 5 items): < 30 s
- Invoice math accuracy: 100% on test vectors
- Page load (LCP) on 4G mid-range phone: < 3 s
- Zero stock-negative incidents unless the shop enables "allow negative stock"

### B3. Modules & functional requirements
Priority: **P0** = MVP must, **P1** = MVP should, **P2** = v2.

#### M1. Auth & Business Setup
- P0: Register with name, mobile/email, password; login; refresh tokens; logout
- P0: Business profile: name, address, state, GSTIN (optional; validated by regex), logo, invoice prefix, financial year start
- P0: Roles: `owner`, `manager`, `cashier` with permissions matrix
- P1: Invite staff by mobile/email
- P2: OTP login

**Acceptance:** A cashier cannot see profit reports or delete products.

#### M2. Products & Inventory
- P0: CRUD products: name, SKU, barcode, HSN/SAC, unit (pcs/kg/ltr/box), category, purchase price, selling price (MRP optional), GST rate (0/5/12/18/28), tax-inclusive flag, opening stock, reorder level
- P0: Stock adjusts only through **stock movements** (sale, purchase, return, adjustment, opening)
- P0: Low-stock list and alerts
- P1: Bulk import/export via CSV
- P1: Categories, brands
- P2: Variants, batch/expiry, multiple units with conversion

**Acceptance:** Current stock = sum of movements. Adjustment requires a reason.

#### M3. Parties (Customers & Suppliers)
- P0: CRUD: name, mobile, GSTIN, billing address, state, opening balance (receivable/payable)
- P0: Walk-in customer default
- P0: Party ledger: invoices, payments, returns, running balance
- P1: Credit limit warning
- P1: Send reminder via WhatsApp deep link

#### M4. Sales Billing (POS + Invoice)
- P0: Create invoice: party (or walk-in), items, qty, rate, line discount (% or ₹), invoice discount, additional charges, notes
- P0: Auto GST split: intra-state → CGST+SGST, inter-state → IGST (based on place of supply)
- P0: Totals with rounding: line tax in paise, round-off to nearest ₹1 shown as separate line
- P0: Payment modes: cash, UPI, card, credit (udhaar), split payments
- P0: Sequential invoice number per business per financial year (e.g. `INV/2026-27/000123`)
- P0: Invoice states: `draft` → `issued` → `cancelled` (cancel creates reversal; never hard delete)
- P0: Print: A4 and 80mm/58mm thermal CSS templates; PDF download
- P0: Sales returns via **credit note** linked to original invoice
- P1: Barcode scan input (keyboard-wedge scanners), keyboard shortcuts
- P1: Share via WhatsApp (wa.me link with public invoice URL)
- P1: Hold/resume bill
- P1: Quotation → convert to invoice

**Acceptance:** Issuing an invoice atomically creates stock movements, party ledger entry, payment records, and invoice number. A failure rolls back everything.

#### M5. Purchases
- P0: Purchase bill from supplier: items, rate, GST (input tax), payments; increases stock
- P1: Purchase returns (debit note)
- P1: Update purchase price/average cost

#### M6. Payments & Ledgers
- P0: Record payment received/paid against party or specific invoices (auto-allocate oldest first, or manual)
- P0: Expenses with category (rent, electricity, salary, etc.)
- P1: Cash book, bank/UPI book

#### M7. Reports & Dashboard
- P0: Dashboard: today's sales, cash/UPI split, receivables, payables, low-stock count, top 5 items, 7/30-day sales chart
- P0: Sales register, purchase register, stock summary, party dues (aging)
- P0: GST summary: outward (by rate, CGST/SGST/IGST), inward ITC, HSN summary
- P1: Profit & loss (simple: sales − COGS − expenses)
- P0: Export CSV/XLSX/PDF
- P2: GSTR-1 JSON export

#### M8. Settings & Admin
- P0: Invoice template options (logo, terms, bank/UPI QR, footer)
- P0: Tax settings, units, number series
- P1: Audit log viewer (who did what)
- P1: Data backup/export (full JSON/CSV)
- P2: Subscription/plan management (SaaS billing)

#### M9. PWA / Offline
- P1: Installable PWA, app shell cached
- P1: Offline: product lookup + create draft bills queued in IndexedDB, synced on reconnect
- P2: Conflict resolution UI

### B4. Non-functional requirements
- **Security:** bcrypt/argon2, JWT access (15 min) + refresh (httpOnly cookie, rotation), rate limiting, helmet, input validation (zod), NoSQL-injection sanitization, RBAC on every route, tenant isolation on every query
- **Performance:** paginated lists (cursor/limit), indexes on `(businessId, ...)`, product search < 200 ms for 50k items
- **Reliability:** transactions for invoice/purchase/payment writes; idempotency key on invoice create
- **Accessibility/UX:** mobile-first, min 44px tap targets, keyboard navigable, dark mode optional
- **i18n:** English first; strings extracted for Hindi/Marathi
- **Compliance:** invoice retention, immutable issued invoices, audit log; no card data stored
- **Observability:** structured logs (pino), error tracking (Sentry), health endpoint

### B5. Release plan
| Release | Scope |
|---|---|
| **v0.1 (Weeks 1–3)** | Auth, business setup, products, parties, stock movements |
| **v0.2 (Weeks 4–6)** | Sales invoice, GST engine, print/PDF, payments |
| **v0.3 (Weeks 7–8)** | Purchases, dashboard, core reports, CSV export |
| **v1.0 (Weeks 9–10)** | PWA offline, WhatsApp share, hardening, deploy, docs |
| **v1.x** | Credit notes polish, batch/expiry, forecasting, Android via Capacitor |

### B6. Open questions
1. Which niche first (kirana assumed)?
2. Single-store only, or multi-branch in v1?
3. Free-tier limits and pricing plan?
4. Is GSTIN mandatory at signup?
