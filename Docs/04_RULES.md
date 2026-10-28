# 04 — RULES (Engineering, Security, Process)

Rule levels: **MUST** (blocking), **SHOULD** (default unless justified), **NEVER**.

## 1. General
1. MUST read `CLAUDE.md` and the relevant PRD/architecture sections before coding.
2. MUST implement only what the current phase asks. NEVER add unrequested features.
3. MUST ask when requirements conflict or are ambiguous; do not guess on money, tax, or legal behavior.
4. SHOULD prefer boring, well-known libraries over clever custom code.
5. MUST keep functions small and single-purpose; files under ~300 lines.

## 2. TypeScript & code style
1. MUST use TypeScript `strict: true`. NEVER use `any` (use `unknown` + narrowing). `@ts-ignore` needs a comment explaining why.
2. MUST use ESLint + Prettier; CI fails on warnings.
3. MUST validate all external input with zod; derive types via `z.infer`.
4. SHOULD use named exports; avoid default exports except for pages/lazy routes.
5. MUST handle errors with typed `AppError(code, httpStatus, message)`; no swallowed errors; no `console.log` (use pino).
6. MUST use async/await; NEVER mix callbacks and promises.
7. Dates: store UTC `Date`; display in `Asia/Kolkata`; FY logic in one util.

## 3. Money, tax, quantities (critical)
1. NEVER use floating point for money. Integer paise only.
2. NEVER compute GST outside `packages/shared/gst`.
3. MUST use largest-remainder allocation when splitting discounts/round-off so sums are exact.
4. MUST have golden-test coverage for every new tax rule.
5. Display formatting only at the UI edge: `formatINR(paise)` with `en-IN` grouping.
6. Quantity integer milli-units; unit conversions via explicit helper.

## 4. Database & data integrity
1. MUST scope every query by `businessId` through the base repository. Direct `Model.find()` outside repos is a lint error.
2. MUST use Mongo transactions for any multi-document financial write; keep transactions short.
3. MUST create indexes in code (`schema.index`) and document them; every list query must be index-backed.
4. NEVER hard-delete financial documents or parties/products referenced by documents. Use `deletedAt` / status.
5. MUST write an audit log entry for create/update/cancel on financial entities.
6. MUST make create endpoints for invoices/payments/purchases idempotent via `Idempotency-Key`.
7. Schema changes MUST ship with a migration script and be backward compatible for one release.
8. Database is **MongoDB Atlas**. MUST use `mongodb+srv` URIs with `retryWrites=true&w=majority`, a least-privilege DB user per environment, and IP allowlisting (NEVER `0.0.0.0/0` in production).
9. MUST reuse one shared DB connection per process; NEVER connect per request.
10. NEVER run tests, scripts, or experiments against the production Atlas cluster. Tests use mongodb-memory-server (replica set).
11. MUST keep `autoIndex: false` in production and build indexes via a migration/deploy step.

## 5. API rules
1. Versioned `/api/v1`; plural nouns; correct verbs and status codes (201, 204, 400, 401, 403, 404, 409, 422, 429).
2. Always paginate lists (default limit 20, max 100).
3. MUST enforce auth → tenant → RBAC → validation, in that order, on every non-public route.
4. Responses never include `passwordHash`, tokens, or other tenants' data.
5. Error shape stable: `{ error: { code, message, details? } }`; codes are SCREAMING_SNAKE (`INSUFFICIENT_STOCK`).
6. MUST document every endpoint in OpenAPI (generated from zod via `zod-to-openapi`).

## 6. Security
1. Passwords hashed with argon2id/bcrypt(≥12). NEVER log or return them.
2. Access token 15 min; refresh in httpOnly Secure SameSite cookie; rotate and revoke on reuse.
3. MUST apply helmet, strict CORS allowlist, rate limiting, body size limits, mongo-sanitize.
4. MUST NOT trust client-supplied `businessId`, `role`, totals, or prices — derive from token/DB.
5. Secrets via environment only; commit `.env.example`; CI scans for secrets (gitleaks).
6. Dependencies: pin versions, run `pnpm audit` in CI, review new packages before adding.
7. Public invoice links: signed + expiring tokens; no enumerable IDs.
8. NEVER store card numbers or UPI PINs.
9. File uploads: type + size allowlist, re-encode images, random filenames.

## 7. Frontend rules
1. Mobile-first; every screen usable at 360 px width; tap targets ≥ 44 px.
2. Server state via TanStack Query; no ad-hoc `useEffect` fetching.
3. Forms via react-hook-form + shared zod schemas.
4. Every list/page has loading, empty, and error states.
5. Accessibility: labels for inputs, focus management in dialogs, keyboard operable POS, color contrast AA.
6. User-facing strings via i18n keys (English default; Hindi/Marathi ready).
7. Money inputs: accept rupees as text, convert to paise at the boundary with validation.
8. NEVER put tokens in localStorage. Access token in memory only.
9. Performance budget: initial JS ≤ 250 KB gz for POS route; lazy-load reports and charts.
10. Destructive actions need confirmation dialogs with explicit consequences.

## 8. Testing
1. MUST add tests with every feature; bug fixes start with a failing test.
2. Coverage targets: shared/gst & money 100%; services ≥ 85%; overall ≥ 75%.
3. Integration tests run against a real Mongo replica set (memory server), not mocks, for transactions.
4. MUST include tenant-isolation tests (user A cannot read/write business B).
5. MUST include RBAC tests per route.
6. Property-based tests for totals and allocations.
7. E2E smoke on CI for the main happy path.

## 9. Git & process
1. Small focused commits; Conventional Commits.
2. Every PR: description, screenshots for UI, test evidence, checklist below.
3. NEVER commit directly to `main`; CI must pass.
4. NEVER rewrite shared history.

**PR checklist**
- [ ] Matches PRD/architecture; docs updated if not
- [ ] Money/tax handled via shared libs
- [ ] `businessId` scoping verified
- [ ] RBAC + validation present
- [ ] Tests added and passing
- [ ] Lint, typecheck clean
- [ ] No secrets, no `console.log`
- [ ] `CLAUDE.md` current state updated

## 10. Definition of Done (per feature)
1. Acceptance criteria in PRD met.
2. Unit + integration tests pass; edge cases covered.
3. Security rules satisfied.
4. UI has loading/empty/error states and works on mobile.
5. Docs/OpenAPI updated.
6. Manually smoke-tested through the UI.

## 11. AI behavior rules
1. Begin each session with a short plan; end with a summary of changes, tests run, and what's next.
2. Show file paths for every change; never paste partial files as if they were complete.
3. If a command or test fails, report the real output and fix the cause; NEVER fake success or comment out failing tests.
4. NEVER invent library APIs; check the installed version's docs/types when unsure.
5. Prefer editing existing files over creating duplicates; keep structure per architecture doc.
6. Flag legal/compliance uncertainty (GST rules change) instead of asserting; link to the official source for the owner to verify.
