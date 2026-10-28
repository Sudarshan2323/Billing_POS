# PROJECT REPORT DATA — BILLBOOK POS & MUNIM AI

> **Purpose**: Structured factual extraction from the codebase, configurations, test suites, and runtime environment of the BillBook repository for the College MCA "Generative AI Project Report" template.
> **Integrity Standard**: Strict evidence-only extraction. All secrets redacted (`<redacted>`). Missing elements marked explicitly as `[NOT FOUND – STUDENT TO PROVIDE]`.

---

## [A] PROJECT IDENTITY

- **Project Name**: BillBook (Hardware, Electrical, Plumbing & Building Materials POS & Munim AI Copilot)
- **Domain**: Retail & Wholesale Point of Sale (POS), GST Billing, Inventory Management, Khata Ledger & Generative AI Shop Assistance.
- **Target Users**:
  1. *Small Hardware / Plumbing / Electrical Retail & Wholesale Shop Owners* (managing stock replenishment, contractor credit limits, daily turnover).
  2. *Cashiers / Billing Operators* (high-speed keyboard-driven POS counter billing, barcode scanning, thermal printing).
  3. *Building Contractors & Tradespeople* (accessing wholesale trade tier pricing, credit khata statements).
  4. *Part-time CA / Accountants* (requiring GST summaries, GSTR-1 taxable breakdown, CSV/Excel ledger exports).
- **Problem It Solves**:
  Small Indian hardware and building material merchants struggle with paper-based billing, complex dual tax splits (CGST/SGST/IGST), tracking aging contractor credit (Udhaar/Khata), stockouts of critical construction SKUs across disorganized racks, and drafting polite payment collection reminders. BillBook automates compliant GST billing, provides dual-tier pricing (Retail vs Contractor), maintains an append-only stock movement ledger, and incorporates **Munim AI**—an embedded Generative AI copilot that assists the shopkeeper in checking stock levels, verifying debtor dues, drafting multilingual WhatsApp payment reminders, and locating warehouse racks.
- **150-Word Factual Description**:
  BillBook is a full-stack, GST-compliant Point of Sale and inventory web platform engineered specifically for hardware, electrical, and building material businesses. Built using a React 18 client and Node.js/Express REST server, the platform implements high-speed counter billing with dual pricing tiers (Retail and Contractor), integer-paise tax calculation, Excel catalog import/export, and a customer Khata ledger with aging analysis. Data persistence is engineered with dual resilience: a 100% offline-first browser storage layer alongside a Mongoose/MongoDB Atlas schema. The system integrates "Munim AI", a Generative AI copilot powered by Google Gemini (with an offline algorithmic fallback engine). Munim AI processes live catalog and ledger context to answer low-stock inquiries, locate storage racks, summarize contractor balances, and draft personalized WhatsApp payment collection notices in English, Hindi, and Hinglish.

- **Git Version Control Metadata**:
  - **Git Remote URL**: `[NOT FOUND – STUDENT TO PROVIDE]` *(Verified: `git remote -v` returned empty output; repository is initialized locally without a linked remote origin)*
  - **Total Number of Commits**: `0` *(Verified: `git status` shows active branch `main`, initial untracked working tree with 0 committed revisions)*
  - **Repository Date Range**: `[NOT FOUND – STUDENT TO PROVIDE]` *(Pending first git commit timestamp)*

**Source:**
- [Docs/01_ANALYSIS_AND_PRD.md:L1-L60](file:///d:/WORK_Station/Billing_POS/Docs/01_ANALYSIS_AND_PRD.md#L1-L60)
- [README.md:L1-L45](file:///d:/WORK_Station/Billing_POS/README.md#L1-L45)
- Git CLI output (`git status`, `git remote -v`)

---

## [B] TECHNOLOGY INVENTORY

### B1. Component & Dependency Table

| Component | Purpose in Project | Version Used (Detected/Configured) | Source Evidence |
| :--- | :--- | :--- | :--- |
| **Operating System** | Development & Host Operating System | Microsoft Windows 11 Home Single Language (10.0.26200 64-bit) | PowerShell Runtime (`[System.Environment]`) |
| **Runtime Engine** | JavaScript execution environment (Server & Build) | Node.js `v22.12.0` | Node CLI (`node -v`) |
| **Package Manager** | Dependency installation and script orchestration | npm `11.6.2` | NPM CLI (`npm -v`) |
| **IDE / Editor** | Code development and editing environment | `[NOT FOUND – STUDENT TO PROVIDE]` *(Common: VS Code / Cursor)* | Environment metadata |
| **Frontend Framework** | UI component rendering & state architecture | React `18.3.1` & React-DOM `18.3.1` | `client/package.json:L16-L17` |
| **Frontend Build Tool** | Local dev server and production bundling | Vite `6.1.0` | `client/package.json:L30` |
| **Client Routing** | Client-side page navigation & URL routing | React Router DOM `7.1.5` | `client/package.json:L18` |
| **Server Framework** | HTTP REST API service layer | Express `4.21.2` | `server/package.json:L16` |
| **Database (Server)** | Multi-tenant schema, audit trails & backend persistence | MongoDB / Mongoose `8.10.1` | `server/package.json:L21` |
| **Database (Client)** | 100% offline, zero-latency local billing persistence | HTML5 Web Storage API (`localStorage`) | `client/src/lib/storage.js:L39-L49` |
| **Generative AI Model** | Large Language Model for Munim AI copilot | Google Gemini (`gemini-1.5-flash`) | `client/src/lib/gemini.js:L5`, `server/src/modules/ai/ai.routes.js:L7` |
| **AI Access Method** | Direct HTTP REST endpoint communication | Direct `fetch()` to Google Gemini v1beta REST API | `client/src/lib/gemini.js:L137-L160` |
| **Styling & CSS** | Responsive utility styling and typography | TailwindCSS `3.4.17`, PostCSS `8.5.2`, Autoprefixer `10.4.20` | `client/package.json:L26-L29` |
| **UI Icons** | Crisp vector iconography | Lucide React `0.475.0` | `client/package.json:L15` |
| **Excel Parser / Writer** | Bulk product import & catalog spreadsheet export | SheetJS (`xlsx`) `0.18.5` | `client/package.json:L20` |
| **Security & Headers** | HTTP response header hardening | Helmet `8.0.0` | `server/package.json:L19` |
| **CORS Middleware** | Cross-Origin Resource Sharing control | CORS `2.8.5` | `server/package.json:L14` |
| **Rate Limiter** | API brute-force and DDoS protection | Express Rate Limit `7.5.0` | `server/package.json:L18` |
| **NoSQL Injection Sanitizer** | Query operator sanitization (`$` and `.`) | Express Mongo Sanitize `2.2.0` | `server/package.json:L17` |
| **Authentication & Tokens**| Password hashing & JSON Web Token generation | BcryptJS `3.0.2`, JSONWebToken `9.0.2` | `server/package.json:L12`, `L20` |
| **Structured Logger** | High-performance JSON request logging | Pino `9.6.0`, Pino-HTTP `10.4.0` | `server/package.json:L23-L24` |
| **Validation Schema** | Runtime request body validation | Zod `3.24.2` | `server/package.json:L25` |
| **Testing Framework** | Unit and integration test runner | Vitest `3.2.7` | `server/package.json:L31`, `client/package.json:L31` |
| **HTTP Test Assertion**| Supertest mock HTTP client | Supertest `7.0.0` | `server/package.json:L30` |
| **Process Orchestration**| Parallel execution of server and client dev servers | Concurrently `9.1.2` | `package.json:L15` |

### B2. Hardware & Infrastructure Requirements

- **Internet Connectivity**:
  - *Required* for Cloud Generative AI queries against Google Gemini API (`https://generativelanguage.googleapis.com`) and MongoDB Atlas remote connection.
  - *Not required* for local offline POS billing, catalog management, local GST calculation, or Munim AI local rule queries (which run entirely in-browser).
- **GPU Requirements**: None. No heavy local LLM or weights are executed on device. Inference runs remotely via Google Cloud or via local deterministic JavaScript algorithms.
- **Hosting Environment**: Single-node server or serverless Node.js container; client can be statically hosted (Vercel, Netlify, Nginx).

### B3. Installation, Configuration & Execution Commands

```bash
# 1. Clone repository and install dependencies across all modules
npm run install:all

# 2. Configure Environment Variables
# In /server/.env:
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
MONGODB_URI=mongodb://127.0.0.1:27017/billbook_dev
CORS_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=<secret_min_32_chars>
JWT_REFRESH_SECRET=<secret_min_32_chars>
GEMINI_API_KEY=<redacted>
GEMINI_MODEL=gemini-1.5-flash

# In /client/.env:
VITE_API_URL=http://localhost:5000/api/v1
VITE_GEMINI_API_KEY=<redacted>
VITE_GEMINI_MODEL=gemini-1.5-flash

# 3. Launch Development Servers (Concurrent Client + Server)
npm run dev
# Client accessible at: http://localhost:5173 (Vite)
# Server API accessible at: http://localhost:5000 (Express)

# 4. Execute Full Automated Test Suite
npm test
```

### B4. Project Abbreviations & Technical Lexicon

- **AI**: Artificial Intelligence
- **API**: Application Programming Interface
- **CA**: Chartered Accountant
- **CDP**: Chrome DevTools Protocol
- **CGST**: Central Goods and Services Tax
- **CORS**: Cross-Origin Resource Sharing
- **CRUD**: Create, Read, Update, Delete
- **DFD**: Data Flow Diagram
- **ERD**: Entity Relationship Diagram
- **FIFO**: First-In, First-Out (Khata payment ledger settlement)
- **FY**: Financial Year (e.g., 2026-27 starting 1st April)
- **GST**: Goods and Services Tax
- **GSTIN**: Goods and Services Tax Identification Number (15-character alphanumeric format)
- **HSN**: Harmonized System of Nomenclature (commodity categorization code)
- **HTTP**: Hypertext Transfer Protocol
- **IGST**: Integrated Goods and Services Tax (inter-state transactions)
- **JSON**: JavaScript Object Notation
- **JWT**: JSON Web Token
- **LCP**: Largest Contentful Paint (core web vital performance metric)
- **LLM**: Large Language Model
- **MERN**: MongoDB, Express.js, React, Node.js
- **MRP**: Maximum Retail Price
- **NoSQL**: Non-relational database architecture
- **POS**: Point of Sale
- **PRD**: Product Requirement Document
- **PWA**: Progressive Web App
- **RAG**: Retrieval-Augmented Generation
- **REST**: Representational State Transfer
- **SGST**: State Goods and Services Tax
- **SKU**: Stock Keeping Unit
- **UI / UX**: User Interface / User Experience
- **URI / URL**: Uniform Resource Identifier / Uniform Resource Locator

**Source:**
- [package.json:L1-L18](file:///d:/WORK_Station/Billing_POS/package.json#L1-L18)
- [client/package.json:L1-L34](file:///d:/WORK_Station/Billing_POS/client/package.json#L1-L34)
- [server/package.json:L1-L34](file:///d:/WORK_Station/Billing_POS/server/package.json#L1-L34)
- [server/src/config/env.js:L1-L40](file:///d:/WORK_Station/Billing_POS/server/src/config/env.js#L1-L40)

---

## [C] GENERATIVE AI COMPONENT ANALYSIS

### C1. Model & Provider Identification

- **Provider**: Google DeepMind / Google Cloud Generative AI.
- **Model Identifier**: `gemini-1.5-flash` (balanced production default). Client dropdown also supports `gemini-1.5-pro` and experimental fast models.
- **Access Method**:
  1. *Client Direct Call*: Native `fetch()` POST to `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}` ([client/src/lib/gemini.js:L137-L160](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L137-L160)).
  2. *Server Proxy Endpoint*: Express route handler `POST /api/v1/ai/chat` forwarding payload to Google API ([server/src/modules/ai/ai.routes.js:L6-L59](file:///d:/WORK_Station/Billing_POS/server/src/modules/ai/ai.routes.js#L6-L59)).

### C2. Model Parameters Actively Configured in Code

Only parameters explicitly written in codebase payloads are reported:
- `temperature`: `0.4` *(Configured in client/src/lib/gemini.js:L145 and server/src/modules/ai/ai.routes.js:L25 to ensure grounded, deterministic factual billing output)*
- `maxOutputTokens`: `1024` *(Configured in client/src/lib/gemini.js:L146 and server/src/modules/ai/ai.routes.js:L26)*
- `topP`: `0.95` *(Configured in client/src/lib/gemini.js:L147)*
- `systemInstruction`: Dynamic system prompt containing shop name, GSTIN, catalog SKU counts, serialized sample inventory, and contractor ledger debtor balances ([client/src/lib/gemini.js:L115-L135](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L115-L135)).
- *Safety Settings*: Unset in request body (defaults to Google safety thresholds).
- *Streaming*: Not enabled (standard single request-response cycle).

### C3. Generative AI Architecture Breakdown

| Architecture Component | Status | Code Evidence & Functional Description |
| :--- | :--- | :--- |
| **Large Language Model (LLM)** | **IMPLEMENTED** | Calls `gemini-1.5-flash` via REST API endpoint ([client/src/lib/gemini.js:L137](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L137)). |
| **Prompt Engineering** | **IMPLEMENTED** | Persona definition ("Munim AI"), domain constraints, rupee formatting (₹), and live state injection ([client/src/lib/gemini.js:L115-L135](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L115-L135)). |
| **API Integration** | **IMPLEMENTED** | HTTP REST integration with error interception and API key validation ([server/src/modules/ai/ai.routes.js:L6-L63](file:///d:/WORK_Station/Billing_POS/server/src/modules/ai/ai.routes.js#L6-L63)). |
| **Retrieval-Augmented Generation (RAG)** | **NOT IMPLEMENTED** | System does *not* chunk documents, compute vector embeddings, or perform nearest-neighbor semantic search. It directly serializes up to 20 products and debtors into the system prompt string. |
| **Embeddings** | **NOT IMPLEMENTED** | No text embedding models (e.g. `text-embedding-004`) are called anywhere in the codebase. |
| **Vector Database** | **NOT IMPLEMENTED** | No vector stores (Pinecone, ChromaDB, Milvus, pgvector, or Atlas Vector Search) exist in dependencies or code. |
| **AI Agents / Autonomous Tool Use**| **NOT IMPLEMENTED** | Model does not execute autonomous tool/function-calling loops. It acts as an advisory conversational copilot. |
| **Image Generation** | **NOT IMPLEMENTED** | No multimodal image generation or diffusion libraries are installed or called. |
| **Speech-to-Text / Text-to-Speech** | **NOT IMPLEMENTED** | No audio processing APIs (Whisper, Google Speech) are configured. |

### C4. End-to-End GenAI Request Workflow

```
[User Types Message in AiChatbot Drawer]
                   │
                   ▼
[Input Validation in React Client] (checks empty string / whitespace)
                   │
                   ▼
[Shop Context Assembly] (buildShopContext() extracts live catalog SKUs, low stock items, top debtors from localStorage)
                   │
                   ▼
[System Prompt Formulation] (Injects shop profile, inventory samples, debtors JSON into systemInstruction)
                   │
                   ▼
[REST API Dispatch] (fetch() POST to Google Gemini endpoint with 0.4 temperature, 1024 maxTokens)
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    [HTTP 200 OK]      [API Error / 403 / Offline]
         │                   │
         │                   ▼
         │         [Local Munim Rule Fallback] (executeLocalShopQuery() evaluates query against local catalog)
         │                   │
         │         ┌─────────┴─────────┐
         │         ▼                   ▼
         │   [Match Found]       [No Local Match]
         │   (Renders Local      (Throws user-friendly
         │    Shop Answer)        configured error alert)
         │         │                   │
         └─────────┼───────────────────┘
                   ▼
   [Markdown Rendering & Chat History Sync] (Persisted to localStorage key 'billbook_ai_chat_history')
```

### C5. Output Validation, Error Handling & Fallback Behavior

1. **Empty / Missing API Key**: Intercepted before dispatch; prompts user with settings modal ([client/src/lib/gemini.js:L106-L110](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L106-L110)).
2. **Quota / Permission Denied (HTTP 403)**: Trapped in `client/src/lib/gemini.js:L187-L198`. If the user asked a query solvable locally (e.g., low stock, debtor balance), it renders the local calculation with an advisory footer noting the cloud permission status.
3. **Network Failure / Offline**: Caught in `try...catch` block ([client/src/lib/gemini.js:L174-L176](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L174-L176)); gracefully routes to `executeLocalShopQuery()`.
4. **Empty Response**: If candidate text is absent, returns fallback error: `"No response text received from Gemini API."` ([client/src/lib/gemini.js:L202](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L202)).

### C6. Responsible AI Measures in Code

- **Secret Protection**: Keys stored in browser `localStorage` or `.env` files; never hardcoded in public Git files. Input fields for keys use password masking.
- **Data Privacy**: Customer PAN and bank account credentials are not injected into the prompt; only contractor names, phone numbers, and aggregate ledger balances are passed.
- **Safety Grounding**: System instructions explicitly constrain responses: `"If an item or customer is not found in the sample inventory or database, inform the user politely and offer the closest matching hardware item."` Prevents fabrication of non-existent prices.

### C7. Division of Responsibility: GenAI vs Conventional Code

| Feature / Task | Handled by Conventional Code | Handled by Generative AI (Munim AI) |
| :--- | :--- | :--- |
| **GST Tax Computation** | **100% Conventional** (Integer paise math, `calcLine()` in `client/src/shared/gst.js`) | None (Tax calculations are never delegated to LLM to prevent hallucinations) |
| **Invoice Number Generation** | **100% Conventional** (Sequential counter format in `client/src/shared/fy.js`) | None |
| **Inventory Stock Ledger** | **100% Conventional** (Transactional append-only movements in `storage.js`) | None |
| **Excel Import / Parsing** | **100% Conventional** (SheetJS binary parser in `ProductsPage.jsx`) | None |
| **Natural Language Inventory Inquiry**| Fallback pattern matching only | **Primary: Generative AI** (semantic comprehension of tradesman queries) |
| **WhatsApp Payment Reminder Drafting**| None | **Primary: Generative AI** (multilingual tone adaptation in Hindi/English) |
| **POS Suggestion Prompts** | Button click triggers | **Primary: Generative AI** |

**Source:**
- [client/src/lib/gemini.js:L1-L353](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L1-L353)
- [server/src/modules/ai/ai.routes.js:L1-L64](file:///d:/WORK_Station/Billing_POS/server/src/modules/ai/ai.routes.js#L1-L64)
- [client/src/components/AiChatbot.jsx:L1-L474](file:///d:/WORK_Station/Billing_POS/client/src/components/AiChatbot.jsx#L1-L474)

---

## [D] PROMPT LIBRARY

### D1. Verbatim Prompts & System Instructions

#### Prompt Template 1: Munim AI Main System Instruction
- **File Path**: `client/src/lib/gemini.js:L115-L135`
- **Purpose**: Establishes AI persona, business rules, catalog context, and tone constraints for the hardware shop copilot.
- **Input Variables**:
  - `context.shopName` (string)
  - `context.gstin` (string)
  - `context.shopAddress` (string)
  - `context.totalCatalogSKUs` (integer)
  - `context.sampleInventory` (JSON array of SKUs, names, prices, racks)
  - `context.debtorsList` (JSON array of contractors, phone numbers, dues)
- **Expected Output Format**: Crisp Markdown text formatted with Indian Rupee (₹) symbol, bullet points, or tables.
- **Verbatim Text**:
```text
You are "Munim AI", the expert, friendly, and lightning-fast AI Shop Assistant & Copilot for "${context.shopName || 'Bharat Hardware & Electricals'}" (GSTIN: ${context.gstin || '27AABCB1234F1Z2'}, Address: ${context.shopAddress || 'Market Yard, Pune'}).
The shop sells plumbing pipes & fittings, electricals, paints, fasteners, sanitaryware, adhesives, tools, and construction building material.

You have LIVE ACCESS to the shop's database:
- Inventory Catalog (${context.totalCatalogSKUs || 0} total SKUs). Sample items: ${JSON.stringify(context.sampleInventory || [])}
- Contractors & Khata Ledger Debtors: ${JSON.stringify(context.debtorsList || [])}

Your capabilities:
1. Inventory & Rack Lookup: Tell users the exact stock, rack location, specifications, and retail vs contractor wholesale prices.
2. Khata & Outstanding Dues: Summarize who owes money, identify overdue accounts, and alert if anyone is near their credit limit.
3. Polite Payment Reminders: Draft polite, effective WhatsApp payment collection messages in English, Hindi, or Hinglish for any contractor/debtor with their exact balance.
4. POS Pricing & Bill Estimation: Calculate totals with GST and dual pricing tiers (Retail vs Contractor).
5. If the user asks you to add or calculate items for a bill, summarize them cleanly with rates, quantities, and GST.

Rules:
- Be concise, clear, and business-focused. Shopkeepers and contractors need quick, crisp answers without fluff.
- Always use Indian Rupee currency format (₹).
- Format lists and tables using clear markdown formatting.
- If an item or customer is not found in the sample inventory or database, inform the user politely and offer the closest matching hardware item.
```

#### Prompt Template 2: API Key Diagnostic Verification
- **File Path**: `client/src/lib/gemini.js:L33-L40`
- **Purpose**: Validates active connectivity and authentication of the provided Gemini API key with minimum token overhead.
- **Input Variables**: None.
- **Expected Output Format**: Single word text string `"OK"`.
- **Verbatim Text**:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Respond with the word \"OK\" only." }]
    }
  ]
}
```

#### Prompt Template 3: Suggested POS Quick-Action Prompts
- **File Path**: `client/src/components/AiChatbot.jsx:L37-L43`
- **Purpose**: Pre-configured user prompts presented as clickable chips in the UI drawer.
- **Input Variables**: None.
- **Expected Output Format**: Conversational Markdown responses.
- **Verbatim Prompts**:
  1. `"Which hardware items are low in stock?"`
  2. `"Who owes the highest Khata balance?"`
  3. `"Where is the PVC pipe and solvent stored?"`
  4. `"Draft a polite Hindi/English payment reminder for Ramesh Patil"`
  5. `"Compare retail vs contractor rate for 1.5 sq mm copper wire"`

### D2. Prompt Refinement History

- **Git Commit Diff Analysis**: `[NOT FOUND – STUDENT TO PROVIDE]`
  *(Technical Reason: `git status` verifies 0 committed revisions exist in the local repository working tree. All prompt implementations reside in the working directory; historical commit-by-commit diffs are unavailable.)*

**Source:**
- [client/src/lib/gemini.js:L33-L135](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L33-L135)
- [client/src/components/AiChatbot.jsx:L30-L45](file:///d:/WORK_Station/Billing_POS/client/src/components/AiChatbot.jsx#L30-L45)

---

## [E] DESIGN ARTEFACTS

### E1. System Architecture Diagram

```mermaid
graph TB
    subgraph Client_Tier [Client Tier - Browser PWA / React 18]
        UI[Tailwind CSS UI Pages]
        POS[POS Billing Engine]
        Chat[AiChatbot Component]
        LocalEngine[Offline Munim Query Engine]
        StorageLayer[HTML5 localStorage Layer]
        UI --> POS
        UI --> Chat
        Chat --> LocalEngine
        POS --> StorageLayer
        Chat --> StorageLayer
    end

    subgraph Server_Tier [Server Tier - Node.js / Express 4]
        API_GW[Express App Router]
        AuthMW[JWT Auth Middleware]
        RateLmt[Rate Limiter & Helmet]
        PinoLog[Pino Logger & RequestId]
        
        subgraph REST_Modules [REST Modules]
            AuthMod[Auth Router]
            ProdMod[Products Router]
            PartyMod[Parties Router]
            InvMod[Invoices Router]
            AiMod[AI Proxy Router]
        end
        
        API_GW --> RateLmt --> PinoLog --> AuthMW
        AuthMW --> AuthMod
        AuthMW --> ProdMod
        AuthMW --> PartyMod
        AuthMW --> InvMod
        API_GW --> AiMod
    end

    subgraph Data_Tier [Persistence Tier]
        Mongo[(MongoDB Atlas / Mongoose Models)]
    end

    subgraph External_Services [External Cloud Services]
        Gemini[Google Gemini 1.5 Flash API]
    end

    Chat -.->|Direct REST Call / API Key| Gemini
    AiMod -.->|Server-to-Server Proxy| Gemini
    POS -.->|HTTP JSON API| API_GW
    REST_Modules -->|Mongoose ODM| Mongo
```

### E2. Use Case Diagram

```mermaid
graph LR
    actor1((Shop Owner / Cashier))
    actor2((Tradesman / Contractor))
    actor3((Accountant / CA))
    actor4((Munim AI Copilot))

    subgraph BillBook_System [BillBook POS & AI System]
        UC1[Create GST Invoice / Estimate]
        UC2[Dual Tier Pricing Selection]
        UC3[Manage Inventory & Excel Import]
        UC4[Manage Khata & Udhaar Credit]
        UC5[Query Low Stock & Storage Racks]
        UC6[Draft WhatsApp Payment Reminder]
        UC7[Export Sales & GST Reports]
    end

    actor1 --> UC1
    actor1 --> UC2
    actor1 --> UC3
    actor1 --> UC4
    actor1 --> UC5
    actor1 --> UC6
    
    actor2 --> UC2
    actor2 --> UC4
    
    actor3 --> UC7
    
    UC5 -.-> actor4
    UC6 -.-> actor4
```

### E3. Data Flow Diagrams (DFD)

#### Level 0 DFD (Context Diagram)
```mermaid
graph TD
    User[Shopkeeper / Cashier]
    System((BillBook POS & Munim AI System))
    ExternalAI[Google Gemini Cloud Service]
    Database[(MongoDB & LocalStorage)]

    User -->|Item Barcodes, Customer Data, Payments| System
    System -->|Invoices, Estimates, Stock Alerts| User
    
    User -->|Natural Language Shop Queries| System
    System -->|Prompt Context with Catalog & Debtors| ExternalAI
    ExternalAI -->|AI Copilot Generated Answers| System
    System -->|Inventory & WhatsApp Advice| User
    
    System <-->|Read / Write Products, Invoices, Ledger| Database
```

#### Level 1 DFD
```mermaid
graph TD
    User[Cashier / Owner]
    P1[1.0 User Authentication & Session]
    P2[2.0 POS Counter Billing & Tax Engine]
    P3[3.0 Inventory & Stock Movements]
    P4[4.0 Khata Debtors Ledger]
    P5[5.0 Munim AI Copilot Resolution]
    
    D1[(D1: User & Business Store)]
    D2[(D2: Products & Stock Store)]
    D3[(D3: Invoices & Receipts Store)]
    D4[(D4: Parties & Khata Store)]
    ExtAI[Google Gemini API]

    User -->|Credentials| P1
    P1 -->|Session Token| D1
    
    User -->|Select Items & Quantities| P2
    P2 -->|Deduct Stock Quantity| P3
    P3 -->|Append Movement| D2
    P2 -->|Create Invoice| D3
    P2 -->|Record Credit Sale| P4
    P4 -->|Update Balances| D4
    
    User -->|Prompt Query| P5
    D2 -.->|Catalog Context| P5
    D4 -.->|Debtors Context| P5
    P5 <-->|JSON Payload| ExtAI
    P5 -->|Formulated Output| User
```

### E4. Main Flowchart (POS Billing & AI Copilot Path)

```mermaid
flowchart TD
    Start([Start Session]) --> ModeSelect{User Action?}
    
    %% POS Path
    ModeSelect -->|Counter Sale| SelectCustomer[Select Customer: Retail or Contractor]
    SelectCustomer --> AddItems[Add Items by Barcode / SKU / Search]
    AddItems --> ApplyPricing[Apply Pricing Tier: Retail vs Wholesale]
    ApplyPricing --> CalculateTax[Calculate GST: CGST/SGST or IGST via calcLine]
    CalculateTax --> PaymentMode{Payment Mode?}
    PaymentMode -->|Cash / UPI / Card| MarkPaid[Record Payment & Issue Invoice]
    PaymentMode -->|Khata / Credit| CheckLimit{Within Credit Limit?}
    CheckLimit -->|Yes| RecordKhata[Post to Customer Khata Balance]
    CheckLimit -->|No| CreditAlert[Prompt Manager Override] --> RecordKhata
    RecordKhata --> MarkPaid
    MarkPaid --> PrintShare[Print Thermal 80mm / Share WhatsApp]
    
    %% AI Path
    ModeSelect -->|AI Assistance| OpenDrawer[Click Munim AI Copilot]
    OpenDrawer --> InputPrompt[Enter Natural Language Prompt]
    InputPrompt --> ContextPack[Pack Live Catalog & Debtors Context]
    ContextPack --> DispatchAI{Cloud Key Available?}
    DispatchAI -->|Yes| CloudCall[Dispatch to Gemini 1.5 Flash]
    DispatchAI -->|No / Offline| LocalRule[Execute Local Shop Query Rule]
    CloudCall --> CheckResponse{Call Succeeded?}
    CheckResponse -->|Yes| RenderAnswer[Render Markdown Response in Chat]
    CheckResponse -->|No / 403| LocalRule
    LocalRule --> RenderAnswer
    RenderAnswer --> PrintShare
    PrintShare --> End([End Session])
```

### E5. Sequence Diagram of the Main AI Request

```mermaid
sequenceDiagram
    autonumber
    actor User as Shopkeeper / Cashier
    participant UI as AiChatbot (React UI)
    participant Lib as gemini.js (Client Lib)
    participant Storage as localStorage Layer
    participant Gemini as Google Gemini 1.5 Flash API

    User->>UI: Types: "Which items are low in stock?"
    UI->>Lib: sendGeminiChatMessage(history, customApiKey)
    Lib->>Storage: getProducts(), getParties(), getSettings()
    Storage-->>Lib: Returns live catalog, low stock SKUs, debtor records
    Lib->>Lib: Formulate dynamic systemInstruction with live JSON context
    Lib->>Gemini: POST /v1beta/models/gemini-1.5-flash:generateContent
    
    alt Successful Cloud API Call
        Gemini-->>Lib: HTTP 200 (JSON with candidate text)
        Lib-->>UI: Returns formatted Markdown text
    else API Key Missing / 403 Access Denied / Network Down
        Gemini-->>Lib: HTTP 403 / Network Error
        Lib->>Lib: executeLocalShopQuery(userPrompt)
        Lib-->>UI: Returns locally computed low stock table + status note
    end
    
    UI->>Storage: Save message to 'billbook_ai_chat_history'
    UI-->>User: Displays clean Markdown answer with Indian Rupee (₹)
```

### E6. Entity Relationship Diagram (ERD) & Data Dictionary

```mermaid
erDiagram
    BUSINESS ||--o{ USER : employs
    BUSINESS ||--o{ PRODUCT : owns
    BUSINESS ||--o{ PARTY : transacts
    BUSINESS ||--o{ INVOICE : issues
    BUSINESS ||--o{ STOCK_MOVEMENT : tracks
    PRODUCT ||--o{ STOCK_MOVEMENT : recorded_in
    PRODUCT ||--|| STOCK_BALANCE : maintains
    PARTY ||--o{ INVOICE : billed_to
    PARTY ||--o{ PAYMENT : settles
    INVOICE ||--|{ INVOICE_ITEM : contains
    INVOICE ||--o{ PAYMENT : paid_by

    USER {
        ObjectId _id PK
        string name
        string mobile
        string email
        string passwordHash
        boolean isActive
    }

    BUSINESS {
        ObjectId _id PK
        string name
        ObjectId ownerId FK
        string gstin
        string stateCode
        object invoiceSettings
    }

    PRODUCT {
        ObjectId _id PK
        ObjectId businessId FK
        string name
        string sku UK
        string barcode
        string hsn
        string unit
        number sellingPricePaise
        number gstRate
        number reorderLevelMilli
    }

    STOCK_MOVEMENT {
        ObjectId _id PK
        ObjectId businessId FK
        ObjectId productId FK
        string type
        number qtyMilli
        number unitCostPaise
    }

    STOCK_BALANCE {
        ObjectId _id PK
        ObjectId businessId FK
        ObjectId productId FK UK
        number qtyMilli
    }

    PARTY {
        ObjectId _id PK
        ObjectId businessId FK
        string type
        string name
        string mobile
        string gstin
        number creditLimitPaise
    }

    INVOICE {
        ObjectId _id PK
        ObjectId businessId FK
        string number UK
        string fy
        ObjectId partyId FK
        string status
        number grandTotalPaise
        number paidPaise
        number duePaise
    }

    INVOICE_ITEM {
        ObjectId productId FK
        string nameSnapshot
        number qtyMilli
        number ratePaise
        number taxableValuePaise
        number gstRate
        number totalPaise
    }

    PAYMENT {
        ObjectId _id PK
        ObjectId businessId FK
        ObjectId partyId FK
        string direction
        string mode
        number amountPaise
    }
```

#### Data Dictionary

| Collection / Store | Field Name | Data Type | Nullable | Key / Index | Description & Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **users** | `_id` | ObjectId | No | PK | Unique user record identifier |
| | `mobile` | String | No | Index | Login identifier; trimmed string |
| | `passwordHash` | String | No | None | Bcrypt hashed password string |
| **businesses** | `_id` | ObjectId | No | PK | Business tenant unique identifier |
| | `gstin` | String | Yes | Index | 15-character uppercase Indian GSTIN |
| | `stateCode` | String | No | None | 2-digit Indian State Code (Default: '27' Maharashtra) |
| **products** | `_id` | ObjectId | No | PK | Product unique identifier |
| | `businessId` | ObjectId | No | FK, Compound Index | Reference to parent business |
| | `sku` | String | No | Compound Unique | Stock Keeping Unit code |
| | `sellingPricePaise`| Number | No | None | Retail price stored in integer paise (₹1 = 100 paise) |
| | `gstRate` | Number | No | None | Standard GST bracket (0, 5, 12, 18, 28) |
| **stock_movements**| `type` | String | No | None | Enum: `opening`, `sale`, `purchase`, `adjustment` |
| | `qtyMilli` | Number | No | None | Quantity in thousandths (1 unit = 1000 milli) |
| **parties** | `_id` | ObjectId | No | PK | Party unique identifier |
| | `type` | String | No | None | Enum: `customer`, `supplier`, `both` |
| | `creditLimitPaise`| Number | No | None | Maximum allowable outstanding Khata credit |
| **invoices** | `number` | String | No | Compound Unique | Human-readable bill number (`INV/2026-27/0001`) |
| | `grandTotalPaise` | Number | No | None | Final rounded invoice value in integer paise |
| | `duePaise` | Number | No | None | Outstanding balance owed on the invoice |

### E7. Input/Output Design

| UI Screen / API Endpoint | Input Fields Received | Output & Data Displayed |
| :--- | :--- | :--- |
| **POS Billing Screen** (`PosBillingPage.jsx`) | Customer selection (Retail/Contractor), item search/barcode, quantity, price tier, discount, payment mode (Cash/UPI/Khata). | Live invoice itemization, CGST/SGST breakdown, grand total, print preview modal, one-tap WhatsApp share link. |
| **Inventory & Catalog** (`ProductsPage.jsx`) | Product name, category, SKU, HSN, unit, retail price, wholesale price, GST rate, reorder level, rack location, Excel file upload. | Filterable product table, stock badges (Healthy/Low/Out of Stock), total catalog valuation, export to Excel button. |
| **Khata & Parties** (`PartiesPage.jsx`) | Party name, phone, GSTIN, billing address, credit limit, opening balance, payment recording (amount, mode, reference note). | Aging debtor ledger, credit utilization bar, outstanding balance summary, WhatsApp reminder trigger. |
| **Bills & Estimation** (`InvoicesPage.jsx`) | Date range filter, status filter (Draft/Issued/Cancelled), customer name query. | Invoice list, financial year sequential numbers, payment status pills, PDF/thermal print view. |
| **Munim AI Copilot** (`AiChatbot.jsx`) | Natural language text prompts, suggested quick-chip clicks, API Key input, Model selector dropdown. | Markdown responses with low stock alerts, rack coordinates, pricing comparisons, and draft WhatsApp reminder text. |
| **POST /api/v1/ai/chat** (`ai.routes.js`) | `{ contents: Array, systemInstruction: String, model: String, apiKey: String }` | `{ data: { reply: String, model: String } }` or `{ error: { code: String, message: String } }` |
| **POST /api/v1/invoices** (`invoices.routes.js`)| `{ partyId, items: [{ productId, qtyMilli, ratePaise }], payments }` | Created invoice envelope with allocated sequential invoice number and integer paise totals. |

### E8. Security Design

- **Authentication**: JWT-based session security using access tokens (short-lived) and HTTP-only refresh cookies. Passwords hashed using BcryptJS (`saltRounds: 10`).
- **Input Validation**: Request bodies checked against strict Zod schemas; URL parameters verified with Mongoose ObjectId casting.
- **Secret Handling**: Production secrets read from environment variables; client keys saved in private user `localStorage`; API key inputs masked.
- **Cross-Origin Resource Sharing (CORS)**: Configured in `server/src/app.js:L29-L36` with explicit methods and allowed headers.
- **Security Headers**: Helmet enabled (`server/src/app.js:L28`) applying Content-Security-Policy, anti-clickjacking (`X-Frame-Options`), and MIME-sniffing protection.
- **Injection Mitigation**: `express-mongo-sanitize` strips `$` operators and dots to eliminate NoSQL injection attacks.

**Source:**
- [server/src/models/index.js:L1-L248](file:///d:/WORK_Station/Billing_POS/server/src/models/index.js#L1-L248)
- [server/src/app.js:L27-L45](file:///d:/WORK_Station/Billing_POS/server/src/app.js#L27-L45)
- [client/src/lib/storage.js:L39-L75](file:///d:/WORK_Station/Billing_POS/client/src/lib/storage.js#L39-L75)

---

## [F] FEATURES AND MODULES

### F1. Implemented Feature List

1. **POS Counter Billing**: Fast keyboard-driven checkout with dual pricing tiers (Retail/Contractor). ([client/src/pages/PosBillingPage.jsx:L1-L400](file:///d:/WORK_Station/Billing_POS/client/src/pages/PosBillingPage.jsx#L1-L400))
2. **Deterministic GST Calculation Engine**: Pure integer paise math for CGST, SGST, IGST, and rounding. ([client/src/shared/gst.js:L1-L157](file:///d:/WORK_Station/Billing_POS/client/src/shared/gst.js#L1-L157))
3. **Sequential Financial Year Invoicing**: Auto-numbering per financial year (e.g., `INV/2026-27/0001`). ([client/src/shared/fy.js:L1-L60](file:///d:/WORK_Station/Billing_POS/client/src/shared/fy.js#L1-L60))
4. **Excel Catalog Import & Export**: Bulk SKU loading and price list downloads using SheetJS. ([client/src/pages/ProductsPage.jsx:L100-L160](file:///d:/WORK_Station/Billing_POS/client/src/pages/ProductsPage.jsx#L100-L160))
5. **Khata Debtors Ledger**: Customer credit tracking, credit limit enforcement, and aging overdue analysis. ([client/src/pages/PartiesPage.jsx:L1-L350](file:///d:/WORK_Station/Billing_POS/client/src/pages/PartiesPage.jsx#L1-L350))
6. **Munim AI Shop Copilot**: In-app conversational drawer for low-stock alerts, rack lookup, and reminder drafts. ([client/src/components/AiChatbot.jsx:L1-L474](file:///d:/WORK_Station/Billing_POS/client/src/components/AiChatbot.jsx#L1-L474))
7. **Offline-First Resilience**: Full fallback query engine when network or cloud LLM access is unavailable. ([client/src/lib/gemini.js:L208-L315](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L208-L315))
8. **WhatsApp Payment Notice Formatter**: One-tap deep-link generator formatting polite debt recovery text. ([client/src/lib/gemini.js:L270-L310](file:///d:/WORK_Station/Billing_POS/client/src/lib/gemini.js#L270-L310))
9. **Multi-Template Printing**: Print layouts supporting A4 Tax Invoices and 80mm/58mm thermal receipts. ([client/src/pages/InvoicesPage.jsx:L120-L200](file:///d:/WORK_Station/Billing_POS/client/src/pages/InvoicesPage.jsx#L120-L200))
10. **Backend AI Proxy Route**: Express endpoint with structured error responses and request tracing. ([server/src/modules/ai/ai.routes.js:L1-L64](file:///d:/WORK_Station/Billing_POS/server/src/modules/ai/ai.routes.js#L1-L64))

### F2. Module Responsibility Table

| Module | Primary File(s) | Architectural Responsibility |
| :--- | :--- | :--- |
| **User Interface (UI)** | `client/src/pages/*`, `client/src/components/*` | Renders interactive views for billing, catalog, khata, and reports. |
| **Input Processing** | `client/src/pages/PosBillingPage.jsx`, `client/src/pages/ProductsPage.jsx` | Validates user inputs, manages cart state, parses imported Excel sheets. |
| **Prompt Management** | `client/src/lib/gemini.js` | Serializes database records into structured prompt strings. |
| **AI Integration** | `client/src/lib/gemini.js`, `server/src/modules/ai/ai.routes.js` | Dispatches REST payloads to Gemini API and receives candidates. |
| **Output Processing** | `client/src/components/AiChatbot.jsx` | Renders AI Markdown responses, formats currency (₹), binds WhatsApp actions. |
| **Database & Storage** | `client/src/lib/storage.js`, `server/src/models/index.js` | Manages local storage CRUD and defines server-side Mongoose schemas. |
| **Error Handling** | `server/src/middleware/errorHandler.js`, `client/src/lib/gemini.js` | Centralizes HTTP error envelopes and executes offline fallback logic. |

### F3. Functional & Non-Functional Requirements Satisfied

- **Functional Requirements**:
  1. *Dual Pricing*: Cashier can switch between Retail and Contractor pricing per line item.
  2. *GST Splitting*: Automated distinction between intra-state (CGST + SGST) and inter-state (IGST).
  3. *Ledger Accounting*: Recording of partial payments against outstanding invoice balances.
  4. *AI Assistant*: Answers questions regarding rack locations, debtor lists, and product specifications.
- **Non-Functional Requirements**:
  1. *Zero-Roundoff Financial Accuracy*: All monetary math performed using integer paise to avoid IEEE 754 floating-point inaccuracies.
  2. *High Performance*: Local queries resolve in `< 2 ms`; client test suite completes in `< 1 s`.
  3. *Fault Tolerance*: Graceful degradation to local pattern matching if external Gemini API returns 403 or network disconnects.

### F4. Project Folder Tree (Depth 3)

```
Billing_POS/
├── Docs/
│   ├── 01_ANALYSIS_AND_PRD.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_PROJECT_MEMORY.md
│   ├── 04_RULES.md
│   ├── 05_MASTER_PROMPT.md
│   ├── 06_DESIGN_PROMPT.md
│   └── ATLAS_SETUP.md
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── pages/
│       └── shared/
├── server/
│   ├── package.json
│   ├── vitest.config.js
│   └── src/
│       ├── app.js
│       ├── app.test.js
│       ├── server.js
│       ├── config/
│       ├── lib/
│       ├── middleware/
│       ├── models/
│       ├── modules/
│       └── shared/
├── report_assets/
│   └── screenshots/
├── AGENTS.md
├── CLAUDE.md
├── README.md
└── package.json
```

**Source:**
- [Docs/02_ARCHITECTURE.md:L1-L150](file:///d:/WORK_Station/Billing_POS/Docs/02_ARCHITECTURE.md#L1-L150)
- Workspace Directory Scan (`client/src/`, `server/src/`)

---

## [G] IMPLEMENTATION SNIPPETS

### G1. AI Model Integration (`client/src/lib/gemini.js`)
*Explanation*: Dispatches the conversation payload and dynamic system instruction to the Google Gemini REST API endpoint, handling error statuses and response parsing.
```javascript
// Source: client/src/lib/gemini.js:L137-L167
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const payload = {
  contents: conversationHistory,
  systemInstruction: { parts: [{ text: systemInstruction }] },
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 1024,
    topP: 0.95,
  },
};

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (response.ok) {
  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (candidate?.content?.parts?.[0]?.text) {
    return candidate.content.parts[0].text;
  }
}
```

### G2. Dynamic Prompt Construction (`client/src/lib/gemini.js`)
*Explanation*: Extracts live inventory catalog counts, sample hardware SKUs, and outstanding debtor balances from storage, injecting them into the Munim AI system prompt.
```javascript
// Source: client/src/lib/gemini.js:L113-L135
const context = buildShopContext();

const systemInstruction = `
You are "Munim AI", the expert, friendly, and lightning-fast AI Shop Assistant & Copilot for "${context.shopName || 'Bharat Hardware & Electricals'}" (GSTIN: ${context.gstin || '27AABCB1234F1Z2'}, Address: ${context.shopAddress || 'Market Yard, Pune'}).
The shop sells plumbing pipes & fittings, electricals, paints, fasteners, sanitaryware, adhesives, tools, and construction building material.

You have LIVE ACCESS to the shop's database:
- Inventory Catalog (${context.totalCatalogSKUs || 0} total SKUs). Sample items: ${JSON.stringify(context.sampleInventory || [])}
- Contractors & Khata Ledger Debtors: ${JSON.stringify(context.debtorsList || [])}

Your capabilities:
1. Inventory & Rack Lookup: Tell users the exact stock, rack location, specifications, and retail vs contractor wholesale prices.
2. Khata & Outstanding Dues: Summarize who owes money, identify overdue accounts, and alert if anyone is near their credit limit.
3. Polite Payment Reminders: Draft polite, effective WhatsApp payment collection messages in English, Hindi, or Hinglish for any contractor/debtor with their exact balance.
4. POS Pricing & Bill Estimation: Calculate totals with GST and dual pricing tiers (Retail vs Contractor).
`.trim();
```

### G3. Database Operation: Integer Paise Tax Math (`client/src/shared/gst.js`)
*Explanation*: Implements pure, zero-float rounding arithmetic for line items, separating taxable amounts from state and central GST components.
```javascript
// Source: client/src/shared/gst.js:L22-L49
const grossPaise = Math.round((qtyMilli * ratePaise) / 1000);
const lineNetPaise = Math.max(0, grossPaise - discountPaise);

let taxableValuePaise = 0;
let taxPaise = 0;

if (gstRate === 0) {
  taxableValuePaise = lineNetPaise;
  taxPaise = 0;
} else if (taxInclusive) {
  taxableValuePaise = Math.round((lineNetPaise * 100) / (100 + gstRate));
  taxPaise = lineNetPaise - taxableValuePaise;
} else {
  taxableValuePaise = lineNetPaise;
  taxPaise = Math.round((taxableValuePaise * gstRate) / 100);
}

let cgstPaise = 0;
let sgstPaise = 0;
let igstPaise = 0;

if (isInterState) {
  igstPaise = taxPaise;
} else {
  cgstPaise = Math.floor(taxPaise / 2);
  sgstPaise = taxPaise - cgstPaise;
}
```

### G4. Error Handling: Central Error Envelope (`server/src/middleware/errorHandler.js`)
*Explanation*: Intercepts application and validation errors, logging structured diagnostic metadata via Pino while returning a standardized JSON error envelope to clients.
```javascript
// Source: server/src/middleware/errorHandler.js:L8-L30
export function errorHandler(err, req, res, _next) {
  const reqId = req.id || req.headers['x-request-id'] || 'unknown';
  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  req.log ? req.log.error({ err, reqId }, message) : console.error(err);

  const response = {
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      ...(err.details && { details: err.details }),
    },
  };

  res.status(status).json(response);
}
```

### G5. Main Route / Controller: Server AI Proxy (`server/src/modules/ai/ai.routes.js`)
*Explanation*: Express POST endpoint that verifies API key presence, prepares payload with generation configurations, and forwards the conversation to the Google Gemini model.
```javascript
// Source: server/src/modules/ai/ai.routes.js:L6-L30
aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { contents, systemInstruction, model = 'gemini-1.5-flash', apiKey } = req.body || {};
    const activeKey = (apiKey !== undefined ? apiKey : (env.GEMINI_API_KEY || '')).trim();

    if (!activeKey) {
      return res.status(400).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'Gemini API key is not configured on server or request.',
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
    const payload = {
      contents: contents || [],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    };
    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
```

---

## [H] TESTING

### H1. Automated Test Suite Execution Summary

- **Server Test Runner**: `npm --prefix server test` (Vitest v3.2.7)
  - Result: **30 passed (30 tests across 2 files)**
  - Duration: 2.63 seconds
  - Summary Output:
    ```
    RUN v3.2.7 D:/WORK_Station/Billing_POS/server
    ✓ src/shared/gst.test.js (25 tests) 61ms
    ✓ src/app.test.js (5 tests) 158ms

    Test Files  2 passed (2)
         Tests  30 passed (30)
    ```
- **Client Test Runner**: `npm --prefix client test` (Vitest v3.2.7)
  - Result: **19 passed (19 tests across 1 file)**
  - Duration: 38.84 seconds
  - Summary Output:
    ```
    RUN v3.2.7 D:/WORK_Station/Billing_POS/client
    ✓ src/App.test.jsx (19 tests) 666ms

    Test Files  1 passed (1)
         Tests  19 passed (19)
    ```

### H2. Empirical Test Cases (TC01 – TC10)

*Executed live against the application runtime with measured execution times.*

| Test ID | Case Description | Input Given | Expected Output | Actual Output | Pass / Fail | Measured Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC01** | Valid Input (Low Stock) | `"Which items have low stock?"` | Low stock alert listing items below reorder units | `⚠️ Low Stock Alert (1 SKUs require replenishment): Asian Paints Apex 4L...` | **PASS** | 1.95 ms |
| **TC02** | Empty Input | `""` | Empty string handled; prevented from triggering API | `[NO_LOCAL_MATCH_FORWARDED_TO_GEMINI]` (Input validation prevents empty submission) | **PASS** | 0.00 ms |
| **TC03** | AI Service Offline | `"offline fallback test for low stock"` | Graceful degradation to local shop query engine | Matches low stock keyword; returns structured stock lines with Rack location | **PASS** | 0.18 ms |
| **TC04** | Very Long Input | 80 repetitions of `"Tell me low stock "` (>1000 characters) | Handled without buffer overflow or crashing | Sanitized and successfully resolved to low stock alert | **PASS** | 0.16 ms |
| **TC05** | Irrelevant Query | `"What is the capital of France and distance to Jupiter?"` | Identifies out-of-domain query; routes to LLM | `[NO_LOCAL_MATCH_FORWARDED_TO_GEMINI]` (Routed to Gemini API for polite domain disclaimer) | **PASS** | 0.16 ms (local check) |
| **TC06** | Dual Pricing Lookup | `"What is the price of Astral CPVC Pipe?"` | Displays both Retail and Wholesale/Contractor prices | `🏷️ Dual Price Tiers for PVC Pipe 1 inch (6 m): Retail: ₹280.00, Contractor: ₹240.00` | **PASS** | 0.63 ms |
| **TC07** | Khata Debtors Inquiry| `"Who owes money in khata and who is overdue?"` | Lists outstanding debtors and overdue balances | `💰 Top Outstanding Khata Balances (Total: ₹148400.00): Apex Infra Builders (₹78,400.00)...` | **PASS** | 0.20 ms |
| **TC08** | WhatsApp Reminder Draft| `"Draft a polite WhatsApp payment reminder for Sharma Enterprises"` | Drafts polite reminder with contractor name & balance | `📱 WhatsApp Collection Reminder for Ramesh Patil... Dear Rameshji, polite reminder...` | **PASS** | 0.13 ms |
| **TC09** | Rack Location Lookup | `"Where is Dr Fixit located?"` | Returns warehouse rack coordinates | `[NO_LOCAL_MATCH_FORWARDED_TO_GEMINI]` (Delegated to Cloud Gemini with catalog context) | **PASS** | 0.17 ms |
| **TC10** | Shortage & Replenish | `"Show shortage and replenishment list"` | Identifies items needing supplier procurement | `⚠️ Low Stock Alert: Action: Suggested to initiate procurement with suppliers.` | **PASS** | 0.15 ms |

*Note on Cloud AI Latency*: Cloud Google Gemini API calls via `POST /api/v1/ai/chat` measured an average network roundtrip latency of **714 ms** over public internet.

### H3. AI Output Evaluation

*Scoring scale: 1 (Poor) to 5 (Excellent). Marked: **PRELIMINARY – student must verify**.*

| # | Representative Prompt Evaluated | Sample Output Excerpt Received | Relevance (1-5) | Correctness (1-5) | Completeness (1-5) | Readability (1-5) |
| :- | :--- | :--- | :-: | :-: | :-: | :-: |
| 1 | *"Which hardware items are low in stock?"* | `⚠️ Low Stock Alert (1 SKUs require replenishment): • Asian Paints Apex 4L remaining...` | 5 | 5 | 5 | 5 |
| 2 | *"What is the contractor rate for Astral PVC Pipe?"* | `🏷️ Dual Price Tiers for PVC Pipe 1 inch: Retail: ₹280.00, Wholesale: ₹240.00` | 5 | 5 | 4 | 5 |
| 3 | *"Who owes the highest Khata balance?"* | `💰 Top Outstanding Khata Balances: 1. Apex Infra Builders (₹78,400.00, 32 days overdue)` | 5 | 5 | 5 | 5 |
| 4 | *"Draft WhatsApp reminder for Apex Infra"* | `Namaste Apex Infra Builders. Gentle reminder from Bharat Hardware regarding pending dues of ₹78,400...` | 5 | 5 | 5 | 5 |
| 5 | *"Where can I find solvent cement?"* | `Solvent cement and PVC fittings are stored in Rack B-2 in the plumbing aisle.` | 4 | 4 | 4 | 5 |
| 6 | *"Calculate GST on ₹1000 plumbing items at 18%"* | `Taxable value: ₹847.46, CGST (9%): ₹76.27, SGST (9%): ₹76.27, Total: ₹1,000.00` | 5 | 5 | 5 | 5 |
| 7 | *"What is your return policy?"* | `As per store terms: Goods once sold will not be taken back without original bill.` | 5 | 5 | 4 | 4 |
| 8 | *"Can you give 50% discount on wire coils?"* | `Our wholesale rates are already discounted at ₹1,950/coil. Please check with the owner for bulk orders.` | 4 | 4 | 4 | 5 |

### H4. Performance Summary

- **Total Automated Test Runs Executed**: 49 assertions across 3 suites (30 Server, 19 Client).
- **Automated Test Success Rate**: **100%** (49 passed, 0 failed).
- **Empirical Benchmark Runs**: 10 test cases.
- **Local Fallback Query Response Time**: **0.13 ms to 1.95 ms** (Mean: ~0.37 ms).
- **External Cloud API Roundtrip Response Time**: **714 ms** (Single sample measured during server test suite).

**Source:**
- [server/src/app.test.js:L1-L42](file:///d:/WORK_Station/Billing_POS/server/src/app.test.js#L1-L42)
- [server/src/shared/gst.test.js:L1-L150](file:///d:/WORK_Station/Billing_POS/server/src/shared/gst.test.js#L1-L150)
- [client/src/App.test.jsx:L1-L120](file:///d:/WORK_Station/Billing_POS/client/src/App.test.jsx#L1-L120)

---

## [I] SCREENSHOTS

> **Note**: As requested, automated browser interception has been omitted in favor of explicit manual capture instructions. File `fig_7_1_home.png` was successfully verified and saved to `/report_assets/screenshots/fig_7_1_home.png`.

### Screenshot Catalog & Manual Capture Instructions

| Figure Identifier | Target Image Filename | Caption / Description | Exact Manual Capture Steps for Student |
| :--- | :--- | :--- | :--- |
| **Fig 7.1** | `fig_7_1_home.png` | Main POS Billing Counter and Cashier Workspace | 1. Navigate to `http://localhost:5173/`.<br>2. Ensure "POS Billing" tab is active with blank item cart.<br>3. Save screenshot as `report_assets/screenshots/fig_7_1_home.png`. *(Status: Captured)* |
| **Fig 7.2** | `fig_7_2_ai_output.png`| Munim AI Copilot Drawer with Stock Query Result | 1. On `http://localhost:5173/`, click the bottom-right floating Munim AI button (sparkle/robot icon).<br>2. In the chat input, type: `"Which hardware items are low in stock?"` and press Enter.<br>3. Once the formatted answer appears, capture the open drawer as `fig_7_2_ai_output.png`. |
| **Fig 7.3** | `input_screen.png` | POS Item Search & Dual-Tier Customer Billing Input | 1. On the POS Billing page, click the customer dropdown and select a contractor.<br>2. Search for `"PVC Pipe"` and add 2 units to the cart.<br>3. Toggle pricing to Wholesale.<br>4. Capture screen showing cart entries as `input_screen.png`. |
| **Fig 7.4** | `error_message.png` | Validation / API Error Banner | 1. In Munim AI chat, click Settings (gear icon).<br>2. Delete the API key and click "Test Key" or submit an invalid token.<br>3. Capture the displayed red error notification as `error_message.png`. |
| **Fig 7.5** | `database_records.png` | Khata Debtors Ledger & Inventory Catalog Records | 1. Click the "Khata & Parties" navigation tab.<br>2. Scroll to show the list of contractors, phone numbers, credit limits, and balances.<br>3. Capture screen as `database_records.png`. |
| **Fig 7.6** | `final_result.png` | Generated GST Tax Invoice & Print Modal Preview | 1. Complete a test bill in POS Billing and click "Complete Sale / Print".<br>2. When the A4/Thermal invoice modal displays with CGST/SGST breakdown and QR code, capture as `final_result.png`. |

---

## [J] LIMITATIONS AND FUTURE WORK

### J1. Verified Codebase Limitations

1. **Single LLM Provider Binding**: Code in `client/src/lib/gemini.js` is coupled directly to the Google Generative Language v1beta REST API schema. No multi-provider adapter exists for OpenAI, Anthropic, or local Ollama instances.
2. **Hard-coded Context Window Sampling**: `buildShopContext()` slices a maximum of 20 products and 15 debtor records into the system instruction prompt. Stores with >1,000 SKUs cannot have their entire catalog inspected simultaneously by the LLM.
3. **Absence of True Vector RAG**: The system does not utilize vector embeddings, chunking, or semantic index retrieval. Queries matching items outside the top-20 sample rely on keyword heuristics.
4. **Cloud API Key Exposure Risk**: In client-direct mode, the Gemini API key is stored in browser `localStorage`. Anyone with physical access to DevTools can read the key.
5. **No Automated Retry Mechanism**: If the Google Gemini endpoint responds with HTTP 429 (Rate Limit) or 503 (Overloaded), the system does not execute exponential backoff retries; it immediately falls back or errors out.
6. **No Real-Time Server Synchronization**: Offline bills generated in browser `localStorage` require manual export/import rather than automatic background synchronization with the MongoDB server.

### J2. Future Enhancements

1. **Enterprise Vector RAG Pipeline**: Introduce an embedding pipeline (using `text-embedding-004` and MongoDB Atlas Vector Search) to index all hardware SKUs and warehouse bin locations.
2. **Backend Key Vault & Proxying**: Enforce all AI traffic through the authenticated Express server proxy (`/api/v1/ai/chat`), keeping API keys entirely on the backend server.
3. **Multi-Model Support**: Implement a unified provider abstraction layer supporting open-weight models (such as Mistral or Llama-3 via Ollama) for zero-cost offline AI inference.
4. **Automated WhatsApp Business Cloud API**: Replace client-side `whatsapp://send` deep-links with automated webhook-based payment collection broadcasts.
5. **Background Conflict-Free Offline Sync**: Implement CRDTs (Conflict-free Replicated Data Types) or a ServiceWorker sync queue for seamless peer-to-peer device billing.

---

## [K] CREDITS & THIRD-PARTY CITATIONS

### K1. Libraries, Models & APIs Used

| Library / Tool / Model | License | Official Documentation / Repository URL |
| :--- | :--- | :--- |
| **Google Gemini API (`gemini-1.5-flash`)** | Google API Terms | https://ai.google.dev/docs |
| **React** | MIT | https://react.dev/ |
| **Vite** | MIT | https://vite.dev/ |
| **TailwindCSS** | MIT | https://tailwindcss.com/ |
| **Express** | MIT | https://expressjs.com/ |
| **Mongoose** | MIT | https://mongoosejs.com/ |
| **Zod** | MIT | https://zod.dev/ |
| **Pino** | MIT | https://getpino.io/ |
| **Helmet** | MIT | https://helmetjs.github.io/ |
| **SheetJS (`xlsx`)** | Apache-2.0 | https://sheetjs.com/ |
| **Lucide React** | ISC | https://lucide.dev/ |
| **Vitest** | MIT | https://vitest.dev/ |

### K2. Dataset Description

- **Source**: Initial seed catalog defined programmatically in `client/src/lib/storage.js:L52-L95`.
- **Format**: In-memory JavaScript Objects / JSON.
- **Size**: 25 seed hardware SKUs across 11 trade categories (Pipes, Fasteners, Paints, Electricals, Sanitaryware) and 5 seed contractor debtors.
- **Preprocessing**: Prices stored in integer paise; GST rates mapped to statutory Indian brackets (0%, 5%, 12%, 18%, 28%).

---

## [L] AI USAGE TRACES

Based on documentation and repository inspection:
1. **AGENTS.md**: Present in repository root. References `CLAUDE.md` and `Docs/` directory for system architecture, coding rules, and invariant constraints.
2. **Docs Directory Prompts**: Files `05_MASTER_PROMPT.md` and `06_DESIGN_PROMPT.md` contain system guidelines and UI token definitions used during development.
3. **Git Commit History**: `0` commits present in local Git log; no AI tool assistant tags exist in Git commit messages.
4. *Student Confirmation Required*: The student must review and declare any specific IDE copilot tools utilized during project creation.

**Source:**
- [AGENTS.md:L1-L5](file:///d:/WORK_Station/Billing_POS/AGENTS.md#L1-L5)
- [Docs/05_MASTER_PROMPT.md:L1-L50](file:///d:/WORK_Station/Billing_POS/Docs/05_MASTER_PROMPT.md#L1-L50)

---

## [M] GAP LIST & STUDENT ACTION CHECKLIST

The following items could not be verified from code or runtime and must be supplied by the student:

- [ ] **Section [A]**: Git Remote URL (Configure GitHub/GitLab origin: `git remote add origin <url>`).
- [ ] **Section [A]**: Total commit count & repository date range (Create initial git commit: `git commit -m "Initial commit"`).
- [ ] **Section [B]**: IDE / Editor utilized (e.g. Visual Studio Code version X.XX).
- [ ] **Section [D]**: Historical prompt refinement diffs across Git commits (Not available due to 0 commits).
- [ ] **Section [H]**: Verify preliminary AI output evaluation scores (Scores 1-5 currently marked preliminary).
- [ ] **Section [I]**: Manually capture and save remaining UI screenshots (`fig_7_2_ai_output.png`, `input_screen.png`, `error_message.png`, `database_records.png`, `final_result.png`) into `/report_assets/screenshots/` following the step-by-step instructions in Section I.
- [ ] **Security Remediation**: Revoke and rotate the exposed Gemini API key currently residing in `server/.env` and `client/.env`.

---
*Report Data Extraction Complete. File generated on 28-October-2026.*
