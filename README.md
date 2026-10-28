# BillBook — GST Billing & Inventory SaaS

GST-ready billing + inventory SaaS for small Indian businesses (kirana first). Built as a TypeScript MERN modular monolith with PWA delivery.

---

## Architecture Overview

- **`client/`**: React 18 + Vite + TypeScript PWA with TailwindCSS, dense ledger book design system, TanStack Query, Zustand, i18next.
- **`server/`**: Express + TypeScript API, MongoDB Atlas (managed replica set for ACID multi-document transactions), Mongoose, Zod, Pino, Helmet, Rate Limiter.
- **`packages/shared/`**: Pure GST engine, integer paise currency helpers, shared Zod schemas, state codes, and Indian financial year numbering.
- **`packages/config/`**: Shared TypeScript strict configs, Prettier, and ESLint setups.

---

## Prerequisites

- **Node.js**: v20 or v22
- **pnpm**: v9 or v10+ (`npm i -g pnpm`)
- **MongoDB Atlas** cluster (see [Docs/ATLAS_SETUP.md](Docs/ATLAS_SETUP.md))

---

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   - Copy `server/.env.example` to `server/.env` and update your `MONGODB_URI`
   - Copy `client/.env.example` to `client/.env`

3. **Start development servers (Client + Server concurrently):**
   ```bash
   pnpm dev
   ```
   - Client runs at: `http://localhost:5173`
   - Server runs at: `http://localhost:5000`

4. **Run tests across all workspaces:**
   ```bash
   pnpm test
   ```

5. **Typecheck all packages:**
   ```bash
   pnpm typecheck
   ```
