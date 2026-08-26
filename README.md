# Stokis - Multi-Branch Stock Opname System

Stokis is a modern, serverless Next.js web application designed to streamline daily stock opname (inventory counting) operations across multiple branch locations. It integrates directly with Google Sheets as its primary database and uses Google Drive for automated PDF report generation and storage, eliminating the need for traditional database servers.

## Key Features

- **Google Workspace Integration (Serverless)**
  - Stores all transactional and master data directly in Google Sheets.
  - Generates PDF reports automatically via Google Apps Script (GAS) and saves them to isolated Google Drive folders per branch.
- **Multi-Branch Isolation**
  - Admins can easily add new branches.
  - The system automatically clones a template Google Sheet and creates a new Google Drive folder for each new branch, keeping data strictly isolated.
- **WhatsApp Integration**
  - Seamlessly generate pre-filled WhatsApp messages to send the generated PDF reports directly to managers or WhatsApp groups.
- **Atlassian Design System**
  - Fully implements the Atlassian UI specifications (Colors, Typography, Spacing, and Components) for a clean, professional, and accessible user experience.
- **Threshold Monitoring**
  - Track stock levels against custom thresholds (Kritis / Hampir Habis / Aman).
  - Daily and weekly analytic dashboards provide instant visibility into branch performance.

## Tech Stack

- **Frontend / Core App:** Next.js 14/15, React, Tailwind CSS, Lucide Icons, GSAP (animations).
- **Backend / API:** Next.js App Router API Routes.
- **Database / File Storage:** Google Sheets API & Google Drive API (via Google Apps Script).
- **Design System:** Atlassian Design System tokens and custom Tailwind utilities.

## Setup & Installation

### 1. Google Apps Script Setup
1. Create a Google Apps Script project.
2. Deploy the `apps-script/Code.gs` file as a Web App (Execute as: You, Access: Anyone).
3. Note the deployed **Web App URL**.
4. Create a template Google Sheet and a root Google Drive folder to store all branch data. Note their IDs.

### 2. Environment Variables
Create a `.env.local` file in the `frontend` folder (or root if running from root) and add the following variables:
```env
# URL of the deployed Google Apps Script Web App
GAS_WEB_APP_URL="https://script.google.com/macros/s/.../exec"

# ID of the template Google Sheet used for creating new branches
TEMPLATE_SPREADSHEET_ID="..."

# ID of the root Google Drive folder where new branch folders will be created
ROOT_DRIVE_FOLDER_ID="..."
```
*(Note: Because this is a personal project, `.env.local` may be committed to the repository. For public open-source projects, NEVER commit `.env` files).*

### 3. Run the Development Server
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

## Architecture Overview

The system uses a unique "Drive-as-a-Database" architecture. The Next.js API routes do not connect to a Postgres or MongoDB database. Instead, they act as a proxy layer that sends HTTP POST/GET requests to the Google Apps Script (GAS) Web App.

The GAS Web App then parses the JSON payload, performs the required Google Sheets manipulations (reading rows, appending data, cloning sheets), or uses `DriveApp` to generate PDFs and create folders, and returns the result back to Next.js.

## License

Personal Use Only.
