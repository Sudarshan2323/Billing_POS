# 03 — PROJECT MEMORY (MEMORY.md / CLAUDE.md for the repo)

> Put this file at the repo root as `CLAUDE.md` (Claude Code) or `AGENTS.md` / `.cursorrules` (other tools).
> The AI must read this at the start of every session and **update the "Current state" and "Decision log" sections at the end of every work session.**

---

## 1. Project identity
- **Name:** BillBook (rename as needed)
- **What:** GST-ready billing + inventory SaaS for small Indian businesses (kirana first).
- **Stack:** MERN in TypeScript. Vite + React 18, Express 4/5, **MongoDB Atlas** (managed replica set; transactions supported), Mongoose, Zod, TanStack Query, Zustand, Tailwind + shadcn/ui, Vitest, Playwright, pnpm workspaces.
- **Delivery:** Web PWA first. Android later via Capacitor.
- **Owner context:** MCA student building a portfolio-grade, real-world SaaS. Prefers practical, deliverable-focused output, not long theory.

## 2. Source-of-truth docs
| Doc | Path | Purpose |
|---|---|---|
| PRD | `docs/01_ANALYSIS_AND_PRD.md` | What to build, scope, acceptance |
| Architecture | `docs/02_ARCHITECTURE.md` | How it is built, schema, flows |
| Rules | `docs/04_RULES.md` | Coding/security/process rules |
| Master prompt | `docs/05_MASTER_PROMPT.md` | Phase-by-phase build instructions |
| Design prompt | `docs/06_DESIGN_PROMPT.md` | UI direction, banned AI-look patterns, shadcn MCP + Vercel skills workflow (use for ALL frontend work) |

If code and docs disagree, **stop and ask**, or propose a doc update. Never silently diverge.

## 3. Non-negotiable invariants (never break)
1. Money = integer paise everywhere. No floats for currency. Ever.
2. Quantity = integer milli-units.
3. Every DB query is scoped by `businessId` (via base repository).
4. Issued invoices are immutable. Corrections = cancel or credit note.
5. Invoice numbers are sequential per business per FY, never reused, allocated inside the same transaction as the invoice insert.
6. Stock changes only through `stock_movements` (+ balance update in the same transaction).
7. Invoice issue = one Mongo transaction (invoice + movements + balances + payments + ledger + audit).
8. GST math lives only in `packages/shared/gst`; client and server import the same code.
9. Server recomputes totals; never trust client totals.
10. No secrets in code or logs.

## 4. Glossary
- **Paise:** 1/100 rupee. ₹150.50 = 15050.
- **HSN/SAC:** goods/services tax classification code.
- **CGST/SGST/IGST:** intra-state split (central + state) vs inter-state (integrated).
- **Place of supply:** state that decides intra vs inter-state tax.
- **Udhaar/Khata:** credit sale / customer running ledger.
- **ITC:** input tax credit on purchases.
- **Credit note:** document reducing a previously issued invoice (returns).
- **FY:** Indian financial year, April–March, formatted `2026-27`.

## 5. Current state (UPDATE EVERY SESSION)
```
Last updated: <date>
Phase: 0 — Not started
Completed: (none)
In progress: (none)
Next up: Phase 1 — repo scaffolding
Blockers / open questions: see PRD §B6
Known issues: (none)
```

## 6. Phase checklist
- [ ] P1 Scaffolding: monorepo, tooling, CI, docker-compose, env validation
- [ ] P2 Shared package: money, gst engine + golden tests, zod schemas
- [ ] P3 Auth + business + membership + RBAC + tenant middleware
- [ ] P4 Products + stock movements/balances + adjustments + CSV import
- [ ] P5 Parties + party ledger
- [ ] P6 Sales invoices (transaction, numbering, idempotency, cancel, credit notes)
- [ ] P7 Payments + allocation + expenses
- [ ] P8 Purchases
- [ ] P9 Reports + dashboard + exports
- [ ] P10 Frontend foundation (layout, auth, API client, design system)
- [ ] P11 Frontend features (products, parties, POS, invoices, reports)
- [ ] P12 Print/PDF templates + WhatsApp share
- [ ] P13 PWA offline + sync
- [ ] P14 Hardening: security review, performance, e2e, docs
- [ ] P15 Deploy + monitoring + backup

## 7. Decision log (append only)
| Date | Decision | Why |
|---|---|---|
| — | Modular monolith | Simplicity for solo dev |
| — | Paise integers | Avoid float errors |
| — | Movements ledger for stock | Auditability, correctness |
| — | Web PWA first | One codebase, fastest to market |
| — | MongoDB Atlas as the database (per-env clusters/DBs) | Managed replica set gives transactions, backups, monitoring |

## 8. Conventions snapshot
- Branches: `feat/<module>-<short>`, `fix/…`, `chore/…`
- Commits: Conventional Commits (`feat(sales): issue invoice transaction`)
- File names: `kebab-case.ts`; React components `PascalCase.tsx`
- API: `/api/v1`, plural nouns, envelope `{data, meta}` / `{error}`
- Tests live next to code: `*.test.ts`

## 9. Commands (fill in as scaffolded)
```
pnpm install
pnpm dev            # api + web
pnpm test           # unit + integration
pnpm lint && pnpm typecheck
pnpm e2e
docker compose up -d mongo   # optional offline fallback only; default DB is Atlas
```
**Env:** `MONGODB_URI=mongodb+srv://...` (Atlas, per environment). Never commit it; use `.env` locally and host secrets in deploy.

## 10. Session protocol for the AI
**Start:** read this file → read relevant PRD/architecture sections → state the plan in ≤ 10 lines.
**During:** small commits, tests with code, no scope creep.
**End:** update §5 Current state, tick §6, append §7 decisions, list follow-ups.
