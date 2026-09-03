# Stokis — Developer Documentation

> Multi-branch stock opname system with automatic XLSX reports & WhatsApp integration.

## Overview

Stokis is a serverless Next.js application that streamlines daily inventory counting across multiple branch locations. It uses Google Sheets as its database and Google Drive for automated Excel report storage.

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| UI | DaisyUI, Framer Motion, Recharts, Lucide Icons |
| Backend | Next.js API Routes → Domain Services → Google APIs |
| Database | Google Sheets API v4 (per-branch isolation) |
| Storage | Google Drive API v3 (XLSX reports) |
| Auth | Custom PIN-based HMAC session |

## Quick Start

```bash
# Clone
git clone https://github.com/myGroomy/stokis.git
cd stokis

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your credentials

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System design, service interactions, Mermaid diagrams |
| [Folder Structure](./folder-structure.md) | Directory layout and file purposes |
| [Development Guide](./development-guide.md) | Setup, dependencies, scripts, coding conventions |
| [Operations](./operations.md) | Deployment, CI/CD, configuration, monitoring |
| [API Reference](./api-reference.md) | All endpoints, request/response, authentication |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STOKIS_API_KEY` | Yes | Secret key for session signing (min 32 chars) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | GCP Service Account email |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Yes | SA private key (from JSON key file) |
| `REGISTRY_SPREADSHEET_ID` | Yes | Google Sheet registry spreadsheet ID |

## License

Personal Use Only.
