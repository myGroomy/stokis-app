# Folder Structure

```
stokis/
├── app/                          # Next.js App Router (pages + API)
│   ├── api/                      # 27 API endpoints
│   │   ├── auth/                 # Authentication (login, me, logout)
│   │   ├── so/                   # Stock Opname (init, submit, xlsx, pdf)
│   │   │   └── [laporanId]/      # Per-laporan (xlsx, xlsx-file, status-wa)
│   │   ├── laporan/              # Reports (list, detail, export)
│   │   │   └── [laporanId]/      # Per-laporan (regenerate)
│   │   ├── master-item/          # Master item CRUD
│   │   ├── cabang/               # Branch management
│   │   ├── petugas/              # Staff management
│   │   ├── users/                # User management
│   │   ├── dashboard/            # Analytics (harian, mingguan)
│   │   └── debug/                # Debug endpoints (sheets, env, gas-url)
│   ├── so/                       # SO pages
│   │   ├── input/page.tsx        # Main SO input form
│   │   └── konfirmasi/[id]/      # SO confirmation page
│   ├── laporan/page.tsx          # Laporan list page
│   ├── dashboard/                # Dashboard pages
│   │   ├── harian/page.tsx       # Daily dashboard
│   │   └── mingguan/page.tsx     # Weekly dashboard
│   ├── master-item/page.tsx      # Master item admin
│   ├── cabang/page.tsx           # Branch admin
│   ├── petugas/page.tsx          # Staff admin
│   ├── login/page.tsx            # Login page
│   ├── docs/                     # In-app documentation (Next.js pages)
│   │   ├── layout.tsx            # Docs layout wrapper
│   │   ├── page.tsx              # Docs index
│   │   ├── introduction/
│   │   ├── getting-started/
│   │   ├── user-guide/
│   │   ├── product/
│   │   ├── developer/
│   │   ├── troubleshooting/
│   │   ├── faq/
│   │   └── changelog/
│   ├── layout.tsx                # Root layout (providers + navbar)
│   ├── page.tsx                  # Home page
│   └── globals.css               # Tailwind + custom animations
│
├── components/                   # React components
│   ├── Navbar.tsx                # Global navigation bar
│   ├── AuthGuard.tsx             # Auth wrapper
│   ├── OnboardingTour.tsx        # First-time user tour
│   ├── SOGeneratingOverlay.tsx   # Loading overlay during SO generation
│   ├── WATemplateModal.tsx       # WhatsApp message template
│   ├── PageTransition.tsx        # Framer Motion transitions
│   ├── QuantumLoader.tsx         # Animated loading spinner
│   └── docs/                     # Documentation components
│       ├── DocsLayout.tsx        # Docs page layout
│       ├── DocsSidebar.tsx       # Docs navigation sidebar
│       ├── DocsTOC.tsx           # Table of contents
│       ├── DocsSearch.tsx        # Client-side search
│       ├── DocsPage.tsx          # Docs page wrapper
│       ├── DocsPageNav.tsx       # Prev/next navigation
│       ├── CodeBlock.tsx         # Code display with copy
│       └── Callout.tsx           # Info/warning/tip boxes
│
├── lib/                          # Business logic + utilities
│   ├── auth.ts                   # HMAC-SHA256 session signing
│   ├── session.ts                # Session cookie management
│   ├── env.ts                    # Centralized env var access
│   ├── appsscript.ts             # Dispatcher (legacy GAS proxy)
│   ├── tour.tsx                  # Onboarding tour config
│   ├── google/                   # Google API layer
│   │   ├── client.ts             # JWT auth client (Sheets + Drive)
│   │   ├── sheets.ts             # Google Sheets CRUD helpers
│   │   ├── drive.ts              # Google Drive upload helpers
│   │   └── registry.ts           # Branch resolver + registry
│   ├── domain/                   # Business logic (TS port from GAS)
│   │   ├── ids.ts                # ID generation + encoding
│   │   ├── errors.ts             # Custom error types (ApiError)
│   │   ├── so.ts                 # SO constants + helpers
│   │   ├── so-validation.ts      # SO payload validation
│   │   ├── so-service.ts         # SO submit + previous SO query
│   │   ├── laporan-service.ts    # Laporan CRUD + WA link
│   │   ├── cabang-service.ts     # Branch CRUD + creation
│   │   ├── master-item-service.ts # Master item CRUD
│   │   ├── petugas-service.ts    # Staff CRUD
│   │   ├── users-service.ts      # User auth + CRUD
│   │   ├── dashboard-service.ts  # Dashboard aggregation
│   │   └── xlsx-report.ts        # XLSX report generation (ExcelJS)
│   ├── contexts/                 # React contexts
│   │   ├── AppContext.tsx         # Global app state
│   │   └── SoContext.tsx          # SO form state
│   └── LanguageContext.tsx        # i18n context (ID/EN)
│
├── apps-script/                  # Google Apps Script (legacy)
│   ├── Code.gs                   # Main GAS dispatcher
│   ├── SO.gs                     # SO functions
│   ├── Laporan.gs                # Laporan functions
│   ├── Cabang.gs                 # Branch functions
│   ├── MasterItem.gs             # Master item functions
│   ├── Petugas.gs                # Staff functions
│   ├── Users.gs                  # User functions
│   ├── Dashboard.gs              # Dashboard data
│   ├── PDF.gs                    # PDF generation
│   ├── Utils.gs                  # Utility functions
│   ├── Registry.gs               # Registry management
│   ├── SOValidation.gs           # SO validation
│   ├── SetupPhase1.gs            # Initial setup
│   ├── TestPhase2.gs             # Test script
│   ├── SetKey.gs / GetKey.gs     # API key management
│   ├── appsscript.json           # GAS manifest
│   └── .clasp.json               # CLASP config
│
├── scripts/                      # Utility scripts
│   ├── seed-items.js             # Seed master item data
│   ├── so-integration-test.mjs   # Integration test for SO flow
│   └── so-bulk-sample.json       # Sample bulk SO data
│
├── test/                         # Unit tests
│   ├── so-validation.test.js     # SO validation tests
│   └── xlsx-upload-bug.test.js   # XLSX upload bug tests
│
├── public/                       # Static assets
│   ├── logo.jpg                  # Stokis logo
│   ├── favicon.jpg               # Favicon
│   ├── icon.png                  # App icon
│   └── *.svg                     # UI icons
│
├── docs/                         # Developer documentation (this folder)
│   ├── README.md                 # Project overview
│   ├── architecture.md           # System architecture
│   ├── folder-structure.md       # This file
│   ├── development-guide.md      # Setup guide
│   ├── operations.md             # Deployment guide
│   └── api-reference.md          # API documentation
│
├── .env.example                  # Env var template
├── .env.local                    # Local env vars (gitignored)
├── next.config.ts                # Next.js config + security headers
├── tsconfig.json                 # TypeScript config
├── postcss.config.mjs            # PostCSS (Tailwind v4)
├── eslint.config.mjs             # ESLint config
└── package.json                  # Dependencies + scripts
```

## Key Directories Explained

### `app/api/` — Backend API

All server-side logic lives here. Each route file exports HTTP method handlers (`GET`, `POST`, etc.) that:
1. Parse request body/params
2. Call domain services from `lib/domain/`
3. Return JSON responses

### `lib/domain/` — Business Logic

Pure TypeScript business logic, ported from Google Apps Script. No framework dependencies — just data transformation, validation, and service orchestration.

### `lib/google/` — Google API Layer

Abstraction over Google Sheets API and Drive API. Handles JWT authentication, retry logic, and error normalization.

### `components/docs/` — Documentation Site

The in-app documentation site built with Next.js App Router. Includes sidebar navigation, table of contents, search, and responsive layout.

### `apps-script/` — Legacy Google Apps Script

Original backend implemented as GAS functions. Still maintained for backward compatibility but the primary path is now the TypeScript domain layer.
