# 03 — PROJECT MEMORY (CLAUDE.md / AGENTS.md for the repo)

> The AI must read this at the start of every session and **update the "Current state" and "Decision log" sections at the end of every work session.**

---

## 1. Project identity
- **Name:** BillBook (Bharat Hardware & Electricals POS)
- **Target Business:** Hardware, Electrical, Plumbing, Sanitaryware & Building Material Shop (Contractor & Retail).
- **Stack:** MERN with JSX. Vite + React 18, Express, **Local-First Browser LocalStorage Data Engine** + optional **MongoDB Atlas**, Zod, TanStack Query, Tailwind CSS + shadcn/ui, Vitest.
- **Delivery:** Web PWA first, fully responsive from 320px mobile to 4K desktop.

## 2. Source-of-truth docs
| Doc | Path | Purpose |
|---|---|---|
| PRD | `Docs/01_ANALYSIS_AND_PRD.md` | Hardware shop scope, specifications, dual tiers |
| Architecture | `Docs/02_ARCHITECTURE.md` | System design, schema, storage engine |
| Rules | `Docs/04_RULES.md` | Non-negotiable coding and transaction invariants |
| Master prompt | `Docs/05_MASTER_PROMPT.md` | Hardware modules and implementation roadmap |
| Design prompt | `Docs/06_DESIGN_PROMPT.md` | Standard neutral Tailwind/shadcn aesthetic (custom token layer removed) |

*Where addendum prompt conflicts with earlier docs, the addendum prompt wins.*

## 3. Non-negotiable invariants (never break)
1. **Money = integer paise everywhere.** No floats for currency calculations.
2. **Quantity = integer milli-units (`qtyMilli`)** or explicit units (`pcs`, `kg`, `meter`, `roll`, `bag`, `set`, `ltr`, `box`).
3. **Empty cart invariant:** Every new bill must start completely empty (`items: []`). Never restore previous cart items silently.
4. **Description visible everywhere:** Item name in bold with full description and size/spec on a second wrapped line across search results, cart rows, invoice detail, and print slips (80mm, 58mm, A4).
5. **Issued invoices are immutable snapshots.** Product edits do not retroactively alter issued bills.
6. **Stock changes only through stock movements.** Automatic deductions upon billing with audit reason tracking.
7. **Khata integrity:** Voiding or deleting ledger entries creates reversing ledger entries with audit logs; customer running balances are never left out of sync.
8. **Dual pricing tiers:** Retail and Wholesale/Contractor tiers with live cashier line override.
9. **Admin report security:** Financial reporting and margin analysis restricted to Owner/Admin roles.

## 4. Current state (UPDATE EVERY SESSION)
```
Last updated: 2026-10-10
Business: Bharat Hardware & Electricals (Plumbing, Electrical, Paint, Tools, Fasteners, Pipes, Cement)
Data Layer: Browser LocalStorage (Zero config offline) + Optional Atlas Sync
Status: Production-grade client build and test suite passing (43 tests total: 29 server + 14 client)
Active Features:
  - POS Quick Billing with empty cart reset, 2-line wrapped descriptions, dual rate tiers, held bills
  - Khata Credit Ledger with aging (0-30, 31-60, 61+), FIFO invoice settle, manual adjustment, void audit
  - Admin Report Builder with quick presets (Today, FY, etc.), custom range, table/chart toggle, CSV export
  - Responsive Mobile Hamburger Sheet drawer (320px to desktop) with collapsible sidebar
  - Ledger Book Modern theme (warm paper #FAF6EE, deep teal #0F4C5C, amber accent #E09F3E, IBM Plex typography)
```

## 5. Decision log (append only)
| Date | Decision | Why |
|---|---|---|
| 2026-10-10 | Hardware Shop pivot | Real-world contractor/plumbing/electrical business needs credit khata & dual price tiers |
| 2026-10-10 | Remove custom token palette | Standard Tailwind slate/zinc/neutral palette provides superior contrast, cleaner maintenance, and eliminates custom CSS bloat |
| 2026-10-10 | 2-Line Item Layout | Hardware items have long technical specifications that must never truncate on mobile or desktop |
| 2026-10-10 | Empty cart invariant | Cashiers must never see previous customer's items when starting a new invoice |
| 2026-10-10 | FIFO Khata settlement | When contractors pay partial dues, oldest pending invoices are satisfied first for tax compliance |
| 2026-10-10 | Reversing entry voiding | Khata transactions cannot be hard-deleted; reversing entries preserve audit history for tax and store owners |
| 2026-10-10 | Admin Report Builder | Owners require date presets, GST breakdown, stock valuation, and CSV export |
| 2026-10-10 | Mobile Hamburger Drawer | Ensures 320px touch-friendly experience with 44px tap targets and focus trap |

## 6. Commands
```bash
npm run dev         # start server and client concurrently
npm run build       # build client and server
npm test            # run backend and frontend tests (43 passing)
```
