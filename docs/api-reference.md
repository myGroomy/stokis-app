# API Reference

Base URL: `/api`

All responses follow the envelope:

```json
{
  "success": true | false,
  "data?: T",
  "error?: { "code": "string", "message": "string" }
}
```

## Authentication

### POST `/api/auth/login`

PIN-based login. Returns session cookie.

**Request:**
```json
{
  "username": "string",
  "pin": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "username": "string",
    "nama": "string",
    "role": "admin" | "petugas",
    "cabangId": "string"
  }
}
```

Sets `stokis_session` cookie (httpOnly, SameSite=Strict, 7-day expiry).

### GET `/api/auth/me`

Get current user from session.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "username": "string",
    "nama": "string",
    "role": "admin" | "petugas",
    "cabangId": "string"
  }
}
```

### POST `/api/auth/logout`

Clear session cookie.

---

## Stock Opname

### POST `/api/so`

Submit stock opname counts. Requires auth.

**Request:**
```json
{
  "cabangId": "CBG001",
  "sesiId": "SES-abc123",
  "tanggalOperasional": "2026-09-01",
  "shift": "Opening",
  "petugas": "Budi",
  "note": "Catatan laporan (opsional), ditulis ke setiap baris transaksi",
  "items": [
    {
      "itemId": "ITM-001",
      "step1": 5,
      "step2": 3,
      "keterangan": "",
      "statusIsi": "Isi",
      "tglRefill": "2026-09-01",
      "tglPakai": ""
    }
  ]
}
```

Per-item fields depend on the item's `Tipe_Input` (from `Master_Item`):
- `single` / `dual`: `step1` (+ `step2` optional)
- `boolean`: `statusIsi` = `"Isi"` | `"Kosong"`
- `date`: `tglRefill` / `tglPakai` (YYYY-MM-DD)
- `note`: one value for the whole session; written to every transaction row.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "sesiId": "SES-abc123",
    "rows_written": 3,
    "laporanId": null
  }
}
```

### GET `/api/so/previous`

Get previous SO data for comparison. Requires auth.

**Query:** `?cabang=CBG001`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "latest": {
      "sesiId": "SES-abc123",
      "tanggal": "2026-08-31",
      "shift": "Closing",
      "petugas": "Budi",
      "waktu": "2026-08-31T17:00:00"
    },
    "items": {
      "Nama_Barang": {
        "step1": 5,
        "step2": 3,
        "total": 8,
        "tanggal": "2026-08-31",
        "shift": "Closing"
      }
    }
  }
}
```

### POST `/api/so/[laporanId]/save-laporan`

Save laporan record for an SO session. Requires auth.

**Request:**
```json
{
  "cabangId": "CBG001",
  "sesiId": "SES-abc123",
  "tanggalOperasional": "2026-09-01",
  "shift": "Opening",
  "petugas": "Budi",
  "note": "Catatan laporan (opsional)",
  "items": [
    {
      "itemId": "ITM-001",
      "namaBarang": "Beras",
      "satuan": "kg",
      "area": "Dapur",
      "threshold": 10,
      "step1": 5,
      "step2": 3,
      "prevStep1": 8,
      "prevStep2": 4,
      "prevTotal": 12
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "sesiId": "SES-abc123",
    "laporanId": "LPR-xyz789",
    "rows_written": 1
  }
}
```

### POST `/api/so/[laporanId]/xlsx`

Generate and upload XLSX report. Requires auth. Returns binary file.

**Request:**
```json
{
  "cabangId": "CBG001",
  "cabangNama": "Cabang Pusat",
  "cabangKode": "CP",
  "tanggalOperasional": "2026-09-01",
  "shift": "Opening",
  "petugas": "Budi",
  "note": "Catatan laporan (opsional, dirender sebagai box di bawah tabel XLSX)",
  "items": [
    {
      "itemId": "ITM-001",
      "namaBarang": "Beras",
      "satuan": "kg",
      "area": "Dapur",
      "threshold": 10,
      "step1": 5,
      "step2": 3,
      "prevStep1": 8,
      "prevStep2": 4,
      "prevTotal": 12
    }
  ]
}
```

**Response:** Binary XLSX (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

### GET `/api/so/[laporanId]/xlsx-file`

Public XLSX download (no auth required). Returns binary file directly from spreadsheet data.

---

## Laporan

### GET `/api/laporan`

List laporan records. Requires auth.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `cabang` | string | Branch ID filter |
| `tanggal` | string | Date filter (YYYY-MM-DD) |
| `shift` | string | Shift filter |
| `petugas` | string | Officer name filter |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "Laporan_ID": "LPR-xyz789",
      "Sesi_ID": "SES-abc123",
      "Tanggal_Operasional": "01/09/2026",
      "Shift": "Opening",
      "Petugas": "Budi",
      "Link_PDF": "https://...",
      "Link_XLSX": "https://...",
      "Status": "success"
    }
  ]
}
```

### GET `/api/laporan/[laporanId]`

Get single laporan detail.

### GET `/api/laporan/[laporanId]/regenerate`

Re-generate XLSX for existing laporan. Requires auth.

---

## Master Item

### GET `/api/master-item`

List active master items. Requires auth.

**Query:** `?cabang=CBG001`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "Item_ID": "ITM-001",
      "Nama_Barang": "Beras",
      "Area": "Dapur",
      "Satuan": "kg",
      "Konversi_Isi": "5",
      "Konversi_Keterangan": "1 Karung = 5 kg",
      "Threshold": 10,
      "Tipe_Input": "dual",
      "Aktif": true,
      "Created_At": "2026-01-01"
    }
  ]
}
```

### POST `/api/master-item`

Add new master item. Requires admin role.

**Request:**
```json
{
  "cabangId": "CBG001",
  "Nama_Barang": "Beras Premium",
  "Area": "Dapur",
  "Satuan": "kg",
  "Konversi_Isi": "5",
  "Konversi_Keterangan": "1 Karung = 5 kg",
  "Threshold": 10,
  "Tipe_Input": "dual"
}
```

`Tipe_Input` menentukan jenis input pada form SO per item (comma-separated bila kombinasi):
- `single` — satu angka (Step1)
- `dual` — dua angka (Step1 + Step2), default bila kosong
- `boolean` — dropdown Isi/Kosong
- `date` — Tgl_Refill + Tgl_Pakai
- contoh kombinasi: `boolean,date` (mis. tabung gas)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "itemId": "ITM-abc123"
  }
}
```

---

## Cabang (Branches)

### GET `/api/cabang`

List active branches. Requires auth.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "Cabang_ID": "CBG001",
      "Nama_Cabang": "Cabang Pusat",
      "Spreadsheet_ID": "1aBc...",
      "Folder_Drive_ID": "1xYz...",
      "Aktif": true,
      "Alamat": "Jl. Merdeka No. 1",
      "PIC_Nama": "Budi",
      "Nomor_WA_Cabang": "628123456789"
    }
  ]
}
```

### POST `/api/cabang`

Create new branch. Requires admin role. Clones template spreadsheet.

**Request:**
```json
{
  "Nama_Cabang": "Cabang Baru",
  "Alamat": "Jl. Baru No. 2",
  "PIC_Nama": "Sari",
  "Nomor_WA_Cabang": "628987654321"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "cabangId": "CBG003",
    "spreadsheetId": "1aBc...",
    "folderId": "1xYz..."
  }
}
```

---

## Dashboard

### GET `/api/dashboard/harian`

Daily dashboard data. Requires auth.

**Query:** `?cabang=CBG001&tanggal=2026-09-01`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tanggal": "2026-09-01",
    "totalTransaksi": 15,
    "kritis": 2,
    "hampirHabis": 3,
    "aman": 10,
    "detail": [
      {
        "Transaksi_ID": "TRX-001",
        "Nama_Barang": "Beras",
        "Total": 8,
        "Status": "Aman"
      }
    ]
  }
}
```

### GET `/api/dashboard/mingguan`

Weekly dashboard data. Requires auth.

**Query:** `?cabang=CBG001&tanggal=2026-09-01`

---

## Debug Endpoints

### GET `/api/debug/env`

Check environment variable status (no auth).

### GET `/api/debug/sheets`

Test Google Sheets connectivity (no auth).

### GET `/api/debug/gas-url`

Test Apps Script URL (no auth).

### GET `/api/health`

Health check (no auth).

**Response (200):**
```json
{ "status": "ok" }
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired session |
| `FORBIDDEN` | 403 | Insufficient role or wrong branch |
| `CABANG_REQUIRED` | 400 | Missing cabangId parameter |
| `SESI_ID_INVALID` | 400 | Invalid session ID format |
| `ITEMS_REQUIRED` | 400 | Empty items array |
| `PAYLOAD_INVALID` | 400 | Invalid request body |
| `CABANG_TIDAK_DITEMUKAN` | 404 | Branch not found in registry |
| `SPREADSHEET_ID_KOSONG` | 500 | Branch has no spreadsheet configured |
