# Stokis - Multi-Branch Stock Opname System

Stokis is a modern, serverless Next.js web application designed to streamline daily stock opname (inventory counting) operations across multiple branch locations. It integrates directly with Google Sheets as its primary database and uses Google Drive for automated PDF report generation and storage, eliminating the need for traditional database servers.

---

## What is Stokis?

**Stokis** (Stock Opname System) adalah sistem pencatatan stock opname untuk multi-cabang. Fitur utama:

| Fitur | Deskripsi |
|-------|-----------|
| **Input SO** | Form pencatatan per item dengan Step 1 & Step 2 counting |
| **Previous SO Comparison** | Bandingkan stok sekarang vs sebelumnya |
| **Threshold Monitoring** | Status otomatis: Kritis / Hampir Habis / Aman |
| **PDF Reports** | Generate PDF dengan comparison table, urut berdasarkan status kritis |
| **WhatsApp Template** | Copy template pesan WA untuk laporan |
| **Dashboard** | Grafik harian & mingguan (bar/line/area) |
| **Master Item** | Kelola item, threshold, dan area penempatan |
| **Multi-Branch** | Support unlimited cabang dengan isolasi data otomatis |

---

## Why Stokis Exists

Banyak bisnis retail/kafe/F&B kesulitan dengan:
- **Manual tracking** - Spreadsheet berantakan antar lokasi
- **Reporting lambat** - PDF harus dibuat manual
- **Data terfragmentasi** - Tidak ada view konsolidasi
- **Tidak ada alert** - Stock kritis tidak terdeteksi

Stokis menyelesaikan ini dengan:
- **Google Sheets sebagai database** - Gratis, real-time, familiar
- **Auto-clone template** - Tambah cabang dalam hitungan detik
- **PDF Auto-generate** - Langsung simpan ke Drive folder per cabang
- **Visual dashboard** - Langsung lihat mana item kritis

---

## Tech Stack

```
Frontend:     Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript
Animations:  Framer Motion + Custom Quantum Pulse Loader
Charts:      Recharts (Bar/Line/Area toggle)
Icons:       Lucide React
Backend:     Next.js API Routes → Google Apps Script
Database:    Google Sheets (per cabang)
File Storage: Google Drive (PDF reports)
Auth:        Custom PIN-based auth (admin/petugas)
```

---

## How to Start from Zero

### Prerequisites
- Node.js 18+ & npm
- Google Account (untuk Sheets & Drive)
- Code editor (VS Code recommended)

### Step 1: Clone & Install
```bash
git clone https://github.com/myGroomy/stokis.git
cd stokis
npm install
```

### Step 2: Google Apps Script Setup

1. **Buat Google Apps Script Project**
   - Buka https://script.google.com
   - Buat project baru
   - Copy isi file `scripts/clasp/Code.js` (registry + utility functions)
   - Copy isi `SO.js`, `MasterItem.js`, `Cabang.js`, `PDF.js`, `Laporan.js`, dll sesuai kebutuhan

2. **Deploy sebagai Web App**
   - Klik Deploy → New deployment
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (supaya Next.js bisa call)
   - Copy **Web App URL**

3. **Buat Template Spreadsheet**
   - Buat Google Sheet baru
   - Buat sheet dengan nama:
     - `Master_Item` (kolom: Item_ID, Nama_Barang, Area, Satuan, Threshold, Aktif)
     - `SO_Transaksi` (kolom: Transaksi_ID, Timestamp, Tanggal_Operasional, Shift, Item_ID, Nama_Barang, Area, Step1, Step2, Total, Petugas, Sesi_ID, Keterangan)
     - `Laporan_PDF` (kolom: Laporan_ID, Sesi_ID, Tanggal_Operasional, Shift, Petugas, Waktu_Dibuat, Link_PDF, Jumlah_Kritis, Jumlah_Hampir_Habis, Status_Kirim_WA)
   - Copy **Spreadsheet ID** dari URL

4. **Buat Root Drive Folder**
   - Buat folder di Google Drive untuk menyimpan folder PDF semua cabang
   - Copy **Folder ID** dari URL

### Step 3: Environment Variables
Buat `.env.local` di root folder:
```env
# URL dari Step 2.2
GAS_WEB_APP_URL="https://script.google.com/macros/s/.../exec"

# ID dari Step 2.3
TEMPLATE_SPREADSHEET_ID="1abc...def"

# ID dari Step 2.4
ROOT_DRIVE_FOLDER_ID="1xyz...789"
```

### Step 4: Run Development Server
```bash
npm run dev
```
Buka http://localhost:3000

---

## User Guide

### Login
- **Admin**: Username & PIN (6 digit) - akses semua fitur
- **Petugas**: Username & PIN - akses input SO & laporan

### Input Stock Opname
1. Pilih cabang di navbar
2. Pilih tanggal & shift (Opening/Closing)
3. Isi Step 1 & Step 2 per item
4. (Opsional) Tambah keterangan untuk item tertentu
5. Klik "Simpan & Buat Laporan"
6. Review popup ringkasan → Konfirmasi
7. PDF otomatis terbuka, data tersimpan di Sheets

### Lihat Laporan
1. Menu **Laporan** - list semua SO per cabang
2. Klik tombol **WhatsApp** → Copy template pesan
3. Paste ke WhatsApp group/manager

### Dashboard
- **Harian**: Grafik distribusi status (Kritis/Hampir Habis/Aman)
- **Mingguan**: Tren aktivitas per hari dengan toggle Bar/Line/Area chart

### Master Item (Admin Only)
- Tambah/edit item dengan threshold
- Search & filter by area
- Inline edit threshold langsung di tabel

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐
│   Next.js App   │────▶│  Google Apps Script  │
│   (Frontend)    │     │  (Backend Logic)     │
└─────────────────┘     └──────────┬───────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Google Sheets API       │
                    │  (Master_Item,          │
                    │   SO_Transaksi,         │
                    │   Laporan_PDF)          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Google Drive API       │
                    │  (PDF Storage)          │
                    └─────────────────────────┘
```

---

## Project Structure

```
stokis/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (proxy ke GAS)
│   │   ├── so/           # SO CRUD endpoints
│   │   ├── laporan/       # Laporan endpoints
│   │   ├── master-item/   # Master item endpoints
│   │   ├── cabang/        # Branch management
│   │   └── users/         # User auth
│   ├── so/input/          # Input SO page
│   ├── so/konfirmasi/     # Confirmation page
│   ├── laporan/           # Laporan list page
│   ├── dashboard/         # Analytics pages
│   ├── master-item/       # Master item admin
│   ├── cabang/            # Branch admin
│   ├── petugas/           # User management
│   └── login/             # Login page
├── components/            # React components
│   ├── ui/               # Reusable UI (QuantumLoader, etc.)
│   ├── WATemplateModal.tsx
│   └── PageTransition.tsx
├── lib/                   # Utilities
│   ├── appsscript.ts      # GAS API caller
│   ├── AuthContext.tsx    # Auth context
│   ├── CabangContext.tsx   # Branch context
│   └── utils.ts           # cn() utility
├── scripts/clasp/         # Google Apps Script files
│   ├── Code.gs           # Registry & utilities
│   ├── SO.js             # SO logic
│   ├── PDF.js            # PDF generation
│   ├── MasterItem.js     # Item management
│   └── ...
├── public/               # Static assets
└── app/globals.css       # Tailwind + custom animations
```

---

## License

Personal Use Only.

---

## Contributing

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push & PR

---

Built with ❤️ for small business inventory management.