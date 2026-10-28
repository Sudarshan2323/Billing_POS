# 06 — DESIGN PROMPT: BillBook UI (human-designed look, not "AI template" look)

Use this as a separate prompt from the build prompts. Run it in the phase where you build the frontend (Phases 10–12), and re-run the audit step after every screen.

---

## 0. One-time setup

### 0.1 shadcn MCP (component registry access for the agent)
Run in the web app root:
```bash
pnpm dlx shadcn@latest mcp init --client claude
```
or add manually to `.mcp.json`:
```json
{
  "mcpServers": {
    "shadcn": { "command": "npx", "args": ["shadcn@latest", "mcp"] }
  }
}
```
Restart Claude Code, run `/mcp`, and confirm `shadcn` shows **Connected**.
The MCP lets the agent browse, search and install components from the registry by plain request ("add the data-table, sheet, command and dialog components").

### 0.2 Vercel skills (design + React quality)
```bash
npx add-skill vercel-labs/agent-skills
# or only what you need:
npx add-skill vercel-labs/agent-skills --skill web-design-guidelines
npx add-skill vercel-labs/agent-skills --skill react-best-practices
```
(The CLI name has changed between releases; if `add-skill` is not found, try `npx skills add vercel-labs/agent-skills` or check the repo README.)
- `web-design-guidelines` = audits UI code for accessibility, UX and UI performance. Use it as a **review pass**, not as a generator.
- `react-best-practices` = React performance checklist (bundle size, re-renders, data fetching).

---

## 1. THE DESIGN PROMPT (paste this)

```
ROLE
You are a senior product designer-engineer who ships dense, trustworthy
business software (think Linear, Stripe Dashboard, Zerodha Kite, Tally),
not marketing pages. You are building the UI for BillBook, a GST billing and
inventory app used all day by shopkeepers and cashiers in India, often on a
cheap Android phone or a shop PC with a barcode scanner.

READ FIRST
CLAUDE.md, docs/01_ANALYSIS_AND_PRD.md (modules, personas), docs/02_ARCHITECTURE.md
§9 (frontend), docs/04_RULES.md §7 (frontend rules), and this file.

TOOLS YOU MUST USE
1. shadcn MCP: before writing any UI primitive, search the registry and install
   it with the MCP (button, input, dialog, sheet, command, table, tabs, select,
   popover, calendar, form, sonner, skeleton, dropdown-menu, tooltip, badge,
   checkbox, switch, separator, scroll-area). Never hand-write a primitive
   that exists in the registry. Prefer a shadcn "block" as a starting point
   only for structure (sidebar, login, dashboard shell), then restyle it.
2. Vercel `web-design-guidelines` skill: after finishing each screen, run it on
   the changed files, list every violation, and fix them before reporting done.
3. Vercel `react-best-practices` skill: run once per feature on the screen's
   components (re-renders, lazy loading, bundle weight).

DESIGN GOAL
The UI should feel like it was designed by a person who has watched a cashier
bill 200 customers a day: calm, dense, fast, numerically precise. It must NOT
look like generic AI-generated SaaS output.

BANNED "AI LOOK" PATTERNS (never produce these)
- Purple/indigo/blue-to-pink gradients, gradient text, glow blobs, aurora or
  mesh backgrounds, glassmorphism/backdrop-blur cards.
- Default shadcn zinc/slate look shipped untouched.
- A centered hero with a big headline + two buttons + a floating card mockup.
- Three-column "feature cards" each with a circled icon, bold title, 2 lines.
- Bento grids, sparkle/magic-wand icons, "AI-powered" badges, rocket emoji,
  emoji used as icons or as decoration.
- Everything rounded-2xl/3xl with shadow-lg/xl; every card in a card in a card.
- Uniform huge padding and equal-weight sections (no hierarchy).
- Placeholder data like "John Doe", "Acme Inc", "Lorem ipsum", "$1,234.56",
  Western names/addresses, USD, or round fake numbers. Use realistic Indian
  data: "Sharma General Store, Kolhapur", "Tata Salt 1 kg", HSN 2501,
  GST 5%, ₹1,24,350.00, mobile 98XXXXXX10, GSTIN 27ABCDE1234F1Z5.
- Testimonials, logos strips, pricing-card trios inside the app.
- Lucide icon on every single label and button. Use icons only when they
  speed recognition (search, print, scan, delete, share, more).
- Toast spam, confetti, skeleton shimmer on instant content, hover-scale
  animations, bouncy springs.

DIRECTION: "LEDGER BOOK, MODERN"
Mood: a well-kept account book. Trustworthy, paper-warm, ink-on-page, quiet.
Information density is a feature. Hierarchy comes from type, spacing and
rules (lines), not from boxes and shadows.

TOKENS (defined in globals.css / index.css as CSS variables):
- Background: warm paper #FAF6EE | Surface: #FFFDF8 | Sunken: #F1EBDD
- Ink (text): #1B1B1B | Muted text: #6B665C | Faint: #9A9486
- Primary (deep teal): #0F4C5C | Primary hover: #0B3A47 | Foreground: #FFFDF8
- Accent (amber): #E09F3E | used for highlights, quotes, and focus
- Border/rule: #E2D9C6 | Strong rule: #CFC3A8
- Semantic: positive #2F7D4F, warning #B7791F, danger #B3382C, info #2B6CB0
- Full dark theme: ink-blue night palette (--color-paper: #12181B, surface: #1B2226, sunken: #0D1214)
- Radius: control: 6px, panel: 8px, table: 0px.
- Typography: IBM Plex Sans + IBM Plex Mono tabular numerals.
- Hardware Shop Features: 2-line wrapped descriptions, dual price tiers, empty cart invariant, Khata FIFO settle & void, Admin Report Builder, responsive hamburger drawer.

TYPOGRAPHY
- UI: "IBM Plex Sans" (or "Source Sans 3"); headings same family, weights
  500/600, no oversized hero type. Max heading in the app: 24px.
- Numbers: "IBM Plex Mono" or the sans with `font-variant-numeric: tabular-nums`
  for every amount, quantity, rate, GSTIN, invoice number. Right-align money.
- Devanagari fallback: "Noto Sans Devanagari" so Hindi/Marathi renders well.
- Body 14px (13px in dense tables), line-height 1.45, labels 12px medium
  with sentence case (not UPPERCASE everywhere).
- Format money with Intl en-IN: ₹1,24,350.00. Negative in parentheses or
  with a minus, never red-only (color is not the only signal).

LAYOUT & COMPONENT RULES
- App shell: left sidebar on desktop (collapsible, text labels, grouped
  Sales / Inventory / Parties / Reports / Settings); bottom tab bar on mobile
  (Bill, Items, Parties, Reports, More). Top bar: business switcher, global
  search (shadcn Command, Ctrl/Cmd+K), sync status, user menu.
- Tables are the main UI: sticky header, 36px rows, zebra off, hairline row
  rules, right-aligned numerics, column visibility menu, keyboard row
  navigation, inline row actions in a dropdown. On mobile collapse to
  two-line list rows (name + amount, secondary meta line) not horizontal-
  scrolling tables.
- Forms: label above input, helper text below, inline validation on blur,
  group related fields with a heading and a rule, primary action bottom-right
  (sticky footer on mobile). Never a wall of equal inputs.
- Dialogs for small confirmations; Sheets (side panels) for create/edit of
  products and parties so context stays visible; full pages for invoices.
- Empty states: one sentence + one action + a quiet line illustration or
  nothing. No cartoon mascots.
- Status chips (Paid, Partial, Due, Cancelled, Draft) are small rectangles
  with 10% tinted bg, 1px border, text + dot; always include the text.
- Motion: 120–180ms ease-out for opacity/translate on overlays only. Respect
  prefers-reduced-motion. No decorative animation.

KEY SCREENS (design each deliberately)
1. POS / New Invoice (most important)
   - Two-pane desktop: left = item search/scan (autofocus) + recent/frequent
     items list; right = bill table (item, qty, rate, disc, GST%, amount),
     totals panel pinned at the bottom with Taxable, CGST/SGST or IGST,
     Round-off, GRAND TOTAL (largest type on the screen, amber underline
     rule), payment mode buttons, "Save & Print" primary.
   - Keyboard map visible as small `kbd` hints (F2 search, F4 customer,
     F8 pay, Ctrl+Enter issue). Qty editable with +/- and typing.
   - Mobile: single column, sticky total bar at the bottom that opens a
     payment sheet.
2. Dashboard: not a wall of cards. Top line = Today's sales (large tabular
   number), cash/UPI split, receivables, payables as a compact stat row
   separated by vertical rules; below, a 30-day sales chart (one color, thin
   line/bars, direct labels, no legend if one series) and two plain tables
   (Low stock, Top dues). No donut charts unless 2-3 segments.
3. Invoice list: filter bar (date range, party, status), table, totals row,
   export menu. Invoice detail mirrors the printed invoice.
4. Products: table + side sheet editor; stock shown with unit and low-stock
   marker; bulk import wizard with row-level errors.
5. Party ledger: statement-style table with running balance column.
6. Reports: simple filter header + table first, chart second; always an
   Export button (CSV/XLSX/PDF).
7. Printed invoice (A4 / 80mm / 58mm): treat as a document design, not a web
   page. Strong header, GSTIN, HSN table, tax breakup, amount in words, UPI
   QR, terms. Monochrome-safe for thermal printers.
8. Auth: left-aligned compact form on paper background with the business
   name and one line of value; no hero illustration.

CONTENT & TONE
- Plain, specific microcopy: "Save & Print", "Record payment", "3 items below
  reorder level". No "Oops!", "Let's get started!", no exclamation marks.
- Error messages say what happened and what to do next.
- Numbers, dates (DD MMM YYYY, IST), and GSTIN always shown consistently.

ACCESSIBILITY & PERFORMANCE (non-negotiable)
- WCAG AA contrast, visible focus ring (2px teal offset), full keyboard
  operation of POS, proper labels/aria on icon buttons, focus trap and
  restore in dialogs, announce toasts politely.
- Touch targets ≥ 44px, no hover-only actions, input types/inputmode set
  (inputmode="decimal" for amounts, "numeric" for qty/mobile).
- Lazy-load charts/reports, virtualize long lists (> 200 rows), images
  with width/height, no layout shift, font-display swap with preload of the
  two main weights.
- Lighthouse mobile ≥ 90 on POS; initial JS ≤ 250 KB gz for the POS route.

PROCESS (follow in order for every screen)
1. State the screen's user goal and the 3 most frequent actions (≤ 5 lines).
2. Use the shadcn MCP to search/install needed components; list what you added.
3. Build the screen with real Indian sample data and all states: loading,
   empty, error, partial/long content, 360px mobile, 1280px desktop, dark.
4. Run the Vercel web-design-guidelines audit on the changed files. Report
   violations as a table (file:line, rule, fix) and fix them all.
5. Run react-best-practices on the screen's components; fix top issues.
6. Self-critique against the BANNED list above; remove anything that looks
   like a template. Then show a summary: what was built, what was audited,
   what remains.

DELIVERABLES FOR THE FIRST RUN
- globals.css with the full token set (light + dark) and shadcn variable
  overrides; tailwind config for fonts and radius; `components.json` updated.
- Theme sanity page `/dev/ui` showing type scale, colors, buttons, inputs,
  table, chips, dialog, sheet, empty state, in light and dark.
- App shell (sidebar/tab bar/top bar) and the POS screen as the reference.
Stop after these and wait for my review before building other screens.
```

---

## 2. Follow-up prompts

**Restyle default shadcn so it stops looking default**
```
Audit every installed shadcn component against our tokens. Change radius, border
weight, focus ring, density (row height, input height), disabled/hover states and
variants so nothing looks like stock shadcn. Show a before/after list of edits
per component. Do not change behavior or accessibility attributes.
```

**Run the audit only**
```
Using the Vercel web-design-guidelines skill, audit apps/web/src/features/<feature>
and output a table: file:line | violated guideline | severity | fix. Then apply
all fixes, re-run the audit, and show the result is clean.
```

**De-AI pass**
```
Review the screen "<name>" as a skeptical senior designer. List every element
that looks like generic AI/SaaS template output (gradients, over-rounded cards,
icon-in-circle rows, fake data, decorative emojis, equal-weight sections,
lorem/Western data). Replace each with a specific, purposeful alternative that
fits a ledger-book billing tool. Show the diff.
```

**Mobile cashier pass**
```
Simulate a cashier on a 360x640 Android phone with one hand. Walk through
"bill 5 items, split cash+UPI, print". Count taps and typing. Reduce taps,
enlarge targets, fix keyboard overlap and sticky bars. Report before/after
tap counts.
```

**Print template pass**
```
Design the 80mm thermal and A4 invoice templates as standalone print CSS.
Monochrome, no backgrounds, 8-10px safe margins for thermal, tabular numerals,
HSN/tax table, amount in words, UPI QR. Provide print previews as PDF samples
with realistic Indian data.
```

---

## 3. Design review checklist (use before merging UI PRs)
- [ ] Uses shadcn MCP-installed components; no duplicated primitives
- [ ] Tokens only (no hard-coded hex in components)
- [ ] Money/qty are tabular, right-aligned, en-IN formatted
- [ ] Realistic Indian sample data; no Lorem/Western placeholders
- [ ] None of the BANNED patterns present
- [ ] Loading, empty, error, long-content, mobile 360px, dark mode checked
- [ ] Keyboard-only run of the main task succeeds
- [ ] Vercel web-design-guidelines audit clean
- [ ] react-best-practices issues resolved or ticketed
- [ ] Lighthouse mobile ≥ 90 (POS), no CLS
