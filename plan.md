# Implementation Plan: Sistem Stock Opname Multi Cabang
## Arsitektur: Vercel (Frontend) + Apps Script (Backend API) + Google Sheets (Database)

---

## Resources

| Komponen | URL / ID |
|---|---|
| **Apps Script Project** | https://script.google.com/home/projects/18B8deMmo-PMP3BPTUqtfCLldktlY08Zv-5tGNkdXSHXRDSXqnKx4b0jJ/edit |
| **Google Drive Folder** | https://drive.google.com/drive/u/0/folders/1IC8xwCoTN_tra4piKq7bI2LQaedJbdZG |
| **Frontend** | Vercel (Next.js) |
| **Database** | Google Sheets (Registry + Spreadsheet per Cabang) |

---

## Arsitektur Sistem

```
Browser
  │
  ▼
Vercel Frontend (Next.js)
  │  (/api/* — Server Functions)
  │  [menyimpan STOKIS_API_KEY & APPS_SCRIPT_URL]
  │
  ▼
Google Apps Script Web App
  │  (doGet / doPost — JSON only)
  │  [validasi X-API-Key dari Script Properties]
  │
  ▼
Google Sheets
  ├── Registry Spreadsheet
  │     ├── Daftar_Cabang
  │     ├── Template_Referensi
  │     └── Settings_Global
  └── Spreadsheet per Cabang (1 sheet per cabang)
        ├── Master_Item
        ├── SO_Transaksi
        ├── Laporan_PDF
        ├── Petugas
        └── Settings
```

---

## FASE 1 — Setup Database & Infrastruktur Google Sheets

> **Goal:** Registry Spreadsheet dan Template Spreadsheet siap, Apps Script dapat mengaksesnya.

### Tugas 1.1 — Buat Registry Spreadsheet

**Di Google Drive** (folder: `1IC8xwCoTN_tra4piKq7bI2LQaedJbdZG`):

- [ ] Buat Spreadsheet baru bernama **`STOKIS_REGISTRY`**
- [ ] Catat Spreadsheet ID Registry (akan dipakai di Script Properties)

**Sheet: `Daftar_Cabang`** (kolom header baris 1):

| Kolom | Nama Header |
|---|---|
| A | Cabang_ID |
| B | Nama_Cabang |
| C | Alamat |
| D | Spreadsheet_ID |
| E | Folder_Drive_ID |
| F | PIC_Nama |
| G | Nomor_WA_Cabang |
| H | Aktif |
| I | Tanggal_Dibuat |

**Sheet: `Template_Referensi`** (kolom header baris 1):

| Kolom | Nama Header |
|---|---|
| A | Template_Spreadsheet_ID |
| B | Template_Versi |
| C | Terakhir_Diperbarui |

**Sheet: `Settings_Global`** (kolom header baris 1 + isi data):

| A (Key) | B (Value) |
|---|---|
| Folder_Drive_Induk | `1IC8xwCoTN_tra4piKq7bI2LQaedJbdZG` |
| Nama_Sistem | Sistem Stock Opname Multi Cabang |

---

### Tugas 1.2 — Buat Template Spreadsheet Cabang

**Di Google Drive** (folder yang sama):

- [ ] Buat Spreadsheet baru bernama **`STOKIS_TEMPLATE_CABANG`**
- [ ] Catat Spreadsheet ID Template (akan disimpan ke `Template_Referensi`)

**Sheet: `Master_Item`** — Header:

```
Item_ID | Nama_Barang | Area | Satuan | Konversi_Isi | Konversi_Keterangan | Threshold | Aktif | Tanggal_Dibuat
```

**Sheet: `SO_Transaksi`** — Header:

```
Transaksi_ID | Timestamp | Tanggal_Operasional | Shift | Item_ID | Nama_Barang | Area | Step1 | Step2 | Total | Petugas | Sesi_ID
```

**Sheet: `Laporan_PDF`** — Header:

```
Laporan_ID | Sesi_ID | Tanggal_Operasional | Shift | Petugas | Waktu_Dibuat | Link_PDF | Jumlah_Kritis | Jumlah_Hampir_Habis | Status_Kirim_WA
```

**Sheet: `Petugas`** — Header:

```
Petugas_ID | Nama | Nomor_WA | Aktif
```

**Sheet: `Settings`** — Data:

| A (Key) | B (Value) |
|---|---|
| Daftar_Shift | Opening, Closing |
| Kelipatan_Threshold_Hampir_Habis | 2 |
| Daftar_Area | Meja Biru Depan, Chiller, Freezer Ayam dan Alat, Barang Alat dan Kebersihan, Meja Laci, Gas dan Utilitas |

- [ ] Isi baris pertama `Template_Referensi` di Registry dengan ID template yang baru dibuat, versi `v1`, dan tanggal hari ini.

---

### Tugas 1.3 — Set Script Properties di Apps Script

Buka: https://script.google.com/home/projects/18B8deMmo-PMP3BPTUqtfCLldktlY08Zv-5tGNkdXSHXRDSXqnKx4b0jJ/edit

**Project Settings → Script Properties**, tambahkan:

| Property Key | Value |
|---|---|
| `STOKIS_API_KEY` | *(generate string random 32+ karakter)* |
| `REGISTRY_SPREADSHEET_ID` | *(ID Spreadsheet Registry dari tugas 1.1)* |

---

## FASE 2 — Backend: Apps Script sebagai Pure JSON API

> **Goal:** Apps Script hanya mengembalikan JSON. Semua HTML dihapus. API key divalidasi di setiap request.

### Tugas 2.1 — Struktur File Apps Script

```
Code.gs          ← doGet / doPost router + validasi API key
Utils.gs         ← helper: generateId, sheetToObjects, formatDate
Registry.gs      ← resolveCabangSpreadsheet_, getCabangList, getRegistry_
Cabang.gs        ← createCabang, updateCabang, setCabangActive
MasterItem.gs    ← getMasterItems, addItem, updateThreshold, setItemActive
Petugas.gs       ← getPetugasList, addPetugas, updatePetugas, setPetugasActive
SO.gs            ← submitSO, calculateStatus_, getDataPembanding_
PDF.gs           ← generatePDF_, buildPdfHtml_
Laporan.gs       ← searchLaporan, getShareWhatsAppLink, updateStatusKirimWA
Dashboard.gs     ← getDashboardHarian, getDashboardMingguan
```

> **Hapus semua file `.html` yang ada di proyek Apps Script sebelum mulai.**

---

### Tugas 2.2 — Implementasi `Code.gs` (Router + Auth)

```javascript
// Code.gs

const API_KEY_PROP = 'STOKIS_API_KEY';

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  // 1. Parse body
  let body = {};
  try {
    body = e.postData ? JSON.parse(e.postData.contents) : {};
  } catch (err) {
    body = {};
  }

  // 2. Validasi API Key (dari body atau query param)
  const apiKey = PropertiesService.getScriptProperties().getProperty(API_KEY_PROP);
  const incomingKey = body['x-api-key'] || (e.parameter && e.parameter['x-api-key']);

  if (!incomingKey || incomingKey !== apiKey) {
    return jsonResponse_({ success: false, error: { code: 'UNAUTHORIZED', message: 'API key tidak valid' } });
  }

  // 3. Route
  const action = body.action || (e.parameter && e.parameter.action);
  const cabangId = body.cabangId || (e.parameter && e.parameter.cabangId);
  const payload = body.payload || {};

  try {
    return routeAction_(action, cabangId, payload, e.parameter || {});
  } catch (err) {
    Logger.log('ERROR [%s] cabang=%s : %s', action, cabangId, err.message);
    return jsonResponse_({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

function routeAction_(action, cabangId, payload, params) {
  switch (action) {
    // --- Cabang ---
    case 'getCabangList':        return jsonResponse_({ success: true, data: getCabangList() });
    case 'createCabang':         return jsonResponse_({ success: true, data: createCabang(payload) });
    case 'updateCabang':         return jsonResponse_({ success: true, data: updateCabang(cabangId, payload) });
    case 'setCabangActive':      return jsonResponse_({ success: true, data: setCabangActive(cabangId, payload.aktif) });
    // --- Master Item ---
    case 'getMasterItems':       return jsonResponse_({ success: true, data: getMasterItems(cabangId) });
    case 'addItem':              return jsonResponse_({ success: true, data: addItem(cabangId, payload) });
    case 'updateThreshold':      return jsonResponse_({ success: true, data: updateThreshold(cabangId, payload.itemId, payload.threshold) });
    case 'setItemActive':        return jsonResponse_({ success: true, data: setItemActive(cabangId, payload.itemId, payload.aktif) });
    // --- Petugas ---
    case 'getPetugasList':       return jsonResponse_({ success: true, data: getPetugasList(cabangId) });
    case 'addPetugas':           return jsonResponse_({ success: true, data: addPetugas(cabangId, payload) });
    case 'updatePetugas':        return jsonResponse_({ success: true, data: updatePetugas(cabangId, payload.petugasId, payload) });
    case 'setPetugasActive':     return jsonResponse_({ success: true, data: setPetugasActive(cabangId, payload.petugasId, payload.aktif) });
    // --- SO ---
    case 'submitSO':             return jsonResponse_({ success: true, data: submitSO(cabangId, payload) });
    // --- Laporan ---
    case 'searchLaporan':        return jsonResponse_({ success: true, data: searchLaporan(cabangId, params) });
    case 'getShareWhatsAppLink': return jsonResponse_({ success: true, data: getShareWhatsAppLink(cabangId, payload.laporanId) });
    case 'updateStatusKirimWA':  return jsonResponse_({ success: true, data: updateStatusKirimWA(cabangId, payload.laporanId) });
    // --- Dashboard ---
    case 'getDashboardHarian':   return jsonResponse_({ success: true, data: getDashboardHarian(cabangId, params.tanggal) });
    case 'getDashboardMingguan': return jsonResponse_({ success: true, data: getDashboardMingguan(cabangId, params.dari, params.sampai) });

    default:
      return jsonResponse_({ success: false, error: { code: 'ACTION_TIDAK_DIKENAL', message: 'Action tidak dikenal: ' + action } });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

### Tugas 2.3 — Implementasi `Utils.gs`

```javascript
// Utils.gs

function formatDate_(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getSheetByName_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan');
  return sheet;
}

function sheetToObjects_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}
```

---

### Tugas 2.4 — Implementasi `Registry.gs`

```javascript
// Registry.gs

let _registryCache = null;
let _cabangCache = {};

function getRegistry_() {
  if (_registryCache) return _registryCache;
  const id = PropertiesService.getScriptProperties().getProperty('REGISTRY_SPREADSHEET_ID');
  if (!id) throw new Error('REGISTRY_SPREADSHEET_ID belum dikonfigurasi');
  _registryCache = SpreadsheetApp.openById(id);
  return _registryCache;
}

function resolveCabangSpreadsheet_(cabangId) {
  if (_cabangCache[cabangId]) return _cabangCache[cabangId];
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Daftar_Cabang');
  const rows = sheetToObjects_(sheet);
  const cabang = rows.find(r => r['Cabang_ID'] === cabangId);
  if (!cabang) throw new Error('CABANG_TIDAK_DITEMUKAN: ' + cabangId);
  if (!cabang['Aktif']) throw new Error('CABANG_TIDAK_AKTIF: ' + cabangId);
  const ss = SpreadsheetApp.openById(cabang['Spreadsheet_ID']);
  _cabangCache[cabangId] = { spreadsheet: ss, cabang: cabang };
  return _cabangCache[cabangId];
}

function getCabangList() {
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Daftar_Cabang');
  return sheetToObjects_(sheet).filter(r => r['Aktif'] === true);
}

function getSettingsGlobal_() {
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Settings_Global');
  const result = {};
  sheetToObjects_(sheet).forEach(r => { result[r['Key']] = r['Value']; });
  return result;
}
```

---

### Tugas 2.5 — Implementasi `Cabang.gs`

```javascript
// Cabang.gs

function createCabang(payload) {
  const { Nama_Cabang, Alamat, PIC_Nama, Nomor_WA_Cabang } = payload;
  if (!Nama_Cabang) throw new Error('Nama_Cabang wajib diisi');
  const registry = getRegistry_();

  // Ambil Template ID
  const tmplSheet = getSheetByName_(registry, 'Template_Referensi');
  const templateId = tmplSheet.getRange(2, 1).getValue();
  if (!templateId) throw new Error('Template_Spreadsheet_ID belum diisi di Registry');

  // Ambil Folder Induk
  const settings = getSettingsGlobal_();
  const parentFolderId = settings['Folder_Drive_Induk'];
  const parentFolder = DriveApp.getFolderById(parentFolderId);

  // Salin template → spreadsheet baru
  const newFile = DriveApp.getFileById(templateId).makeCopy('SO_' + Nama_Cabang, parentFolder);
  const newSpreadsheetId = newFile.getId();

  // Buat folder PDF
  const pdfFolder = parentFolder.createFolder('PDF_' + Nama_Cabang);
  const pdfFolderId = pdfFolder.getId();

  // Generate Cabang_ID
  const daftarSheet = getSheetByName_(registry, 'Daftar_Cabang');
  const cabangId = 'CBG' + String(daftarSheet.getLastRow()).padStart(3, '0');

  // Tulis ke Registry
  daftarSheet.appendRow([
    cabangId, Nama_Cabang, Alamat || '', newSpreadsheetId, pdfFolderId,
    PIC_Nama || '', Nomor_WA_Cabang || '', true, new Date()
  ]);

  Logger.log('createCabang: %s (%s)', Nama_Cabang, cabangId);
  return { cabangId, spreadsheetId: newSpreadsheetId, folderId: pdfFolderId };
}

function updateCabang(cabangId, payload) {
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Daftar_Cabang');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === cabangId);
  if (rowIdx === -1) throw new Error('Cabang ' + cabangId + ' tidak ditemukan');
  // Kolom: B=Nama(1), C=Alamat(2), F=PIC(5), G=WA(6) — 0-indexed
  const map = { Nama_Cabang: 2, Alamat: 3, PIC_Nama: 6, Nomor_WA_Cabang: 7 };
  Object.entries(map).forEach(([key, col]) => {
    if (payload[key] !== undefined) sheet.getRange(rowIdx + 1, col).setValue(payload[key]);
  });
  return { updated: cabangId };
}

function setCabangActive(cabangId, aktif) {
  const registry = getRegistry_();
  const sheet = getSheetByName_(registry, 'Daftar_Cabang');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === cabangId);
  if (rowIdx === -1) throw new Error('Cabang ' + cabangId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 8).setValue(aktif === true || aktif === 'true');
  return { cabangId, aktif };
}
```

---

### Tugas 2.6 — Implementasi `MasterItem.gs`

```javascript
// MasterItem.gs

function getMasterItems(cabangId) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  return sheetToObjects_(getSheetByName_(spreadsheet, 'Master_Item')).filter(r => r['Aktif'] === true);
}

function addItem(cabangId, payload) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Master_Item');
  const itemId = 'ITM' + String(sheet.getLastRow()).padStart(5, '0');
  sheet.appendRow([
    itemId, payload.Nama_Barang, payload.Area, payload.Satuan,
    payload.Konversi_Isi || '', payload.Konversi_Keterangan || '',
    payload.Threshold || 0, true, new Date()
  ]);
  return { itemId };
}

function updateThreshold(cabangId, itemId, threshold) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Master_Item');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === itemId);
  if (rowIdx === -1) throw new Error('Item ' + itemId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 7).setValue(threshold);
  return { itemId, threshold };
}

function setItemActive(cabangId, itemId, aktif) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Master_Item');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === itemId);
  if (rowIdx === -1) throw new Error('Item ' + itemId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 8).setValue(aktif === true || aktif === 'true');
  return { itemId, aktif };
}
```

---

### Tugas 2.7 — Implementasi `Petugas.gs`

```javascript
// Petugas.gs

function getPetugasList(cabangId) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  return sheetToObjects_(getSheetByName_(spreadsheet, 'Petugas')).filter(r => r['Aktif'] === true);
}

function addPetugas(cabangId, payload) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Petugas');
  const petugasId = 'PTG' + String(sheet.getLastRow()).padStart(4, '0');
  sheet.appendRow([petugasId, payload.Nama, payload.Nomor_WA || '', true]);
  return { petugasId };
}

function updatePetugas(cabangId, petugasId, payload) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Petugas');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === petugasId);
  if (rowIdx === -1) throw new Error('Petugas ' + petugasId + ' tidak ditemukan');
  if (payload.Nama) sheet.getRange(rowIdx + 1, 2).setValue(payload.Nama);
  if (payload.Nomor_WA) sheet.getRange(rowIdx + 1, 3).setValue(payload.Nomor_WA);
  return { petugasId };
}

function setPetugasActive(cabangId, petugasId, aktif) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Petugas');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === petugasId);
  if (rowIdx === -1) throw new Error('Petugas ' + petugasId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 4).setValue(aktif === true || aktif === 'true');
  return { petugasId, aktif };
}
```

---

### Tugas 2.8 — Implementasi `SO.gs`

```javascript
// SO.gs

function submitSO(cabangId, payload) {
  const { spreadsheet, cabang } = resolveCabangSpreadsheet_(cabangId);
  const soSheet = getSheetByName_(spreadsheet, 'SO_Transaksi');
  const masterRows = sheetToObjects_(getSheetByName_(spreadsheet, 'Master_Item'));

  const sesiId = 'SES' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const timestamp = new Date();
  const transaksiList = [];

  payload.items.forEach(item => {
    const master = masterRows.find(m => m['Item_ID'] === item.itemId);
    if (!master) return;
    const step1 = Number(item.step1) || 0;
    const step2 = Number(item.step2) || 0;
    const total = step1 + step2;
    const transaksiId = 'TRX' + String(soSheet.getLastRow()).padStart(6, '0');
    soSheet.appendRow([
      transaksiId, timestamp, payload.tanggalOperasional, payload.shift,
      item.itemId, master['Nama_Barang'], master['Area'],
      step1, step2, total, payload.petugas, sesiId
    ]);
    transaksiList.push({ transaksiId, itemId: item.itemId, total });
  });

  const laporanId = generatePDF_(cabangId, spreadsheet, cabang, sesiId, payload.tanggalOperasional, payload.shift, payload.petugas, transaksiList, masterRows);
  return { sesiId, laporanId };
}

function calculateStatus_(total, threshold) {
  if (!threshold || threshold <= 0) return 'Tidak Dipantau';
  if (total <= threshold) return 'Kritis';
  if (total <= threshold * 2) return 'Hampir Habis';
  return 'Aman';
}
```

---

### Tugas 2.9 — Implementasi `PDF.gs`

```javascript
// PDF.gs

function generatePDF_(cabangId, spreadsheet, cabang, sesiId, tanggal, shift, petugas, transaksiList, masterRows) {
  const laporanSheet = getSheetByName_(spreadsheet, 'Laporan_PDF');
  const laporanId = 'RPT' + String(laporanSheet.getLastRow()).padStart(5, '0');

  let jumlahKritis = 0;
  let jumlahHampirHabis = 0;
  const rows = transaksiList.map(t => {
    const master = masterRows.find(m => m['Item_ID'] === t.itemId) || {};
    const status = calculateStatus_(t.total, master['Threshold'] || 0);
    if (status === 'Kritis') jumlahKritis++;
    if (status === 'Hampir Habis') jumlahHampirHabis++;
    return { ...t, nama: master['Nama_Barang'], area: master['Area'], threshold: master['Threshold'], status };
  });

  // Buat PDF dari HTML
  const html = buildPdfHtml_(cabang['Nama_Cabang'], tanggal, shift, petugas, rows, sesiId);
  const pdfBlob = Utilities.newBlob(html, 'text/html').getAs('application/pdf');
  pdfBlob.setName(laporanId + '_' + tanggal + '_' + shift + '.pdf');

  // Simpan ke folder Drive cabang
  const folder = DriveApp.getFolderById(cabang['Folder_Drive_ID']);
  const file = folder.createFile(pdfBlob);
  const pdfUrl = file.getUrl();

  // Catat ke Laporan_PDF
  laporanSheet.appendRow([
    laporanId, sesiId, tanggal, shift, petugas,
    new Date(), pdfUrl, jumlahKritis, jumlahHampirHabis, 'Belum Dikirim'
  ]);

  return laporanId;
}

function buildPdfHtml_(namaCabang, tanggal, shift, petugas, rows, sesiId) {
  const statusColor = { 'Kritis': 'red', 'Hampir Habis': 'orange', 'Aman': 'green', 'Tidak Dipantau': 'gray' };
  const rowsHtml = rows.map(r => `
    <tr>
      <td>${r.nama}</td><td>${r.area}</td>
      <td align="center">${r.total}</td>
      <td align="center">${r.threshold}</td>
      <td style="color:${statusColor[r.status] || 'black'};font-weight:bold">${r.status}</td>
    </tr>`).join('');

  return `<html><body style="font-family:Arial,sans-serif;padding:20px">
    <h2>Laporan Stock Opname — ${namaCabang}</h2>
    <p>Tanggal: <b>${tanggal}</b> &nbsp;|&nbsp; Shift: <b>${shift}</b> &nbsp;|&nbsp; Petugas: <b>${petugas}</b></p>
    <p style="color:#888;font-size:12px">Sesi ID: ${sesiId}</p>
    <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse:collapse">
      <thead style="background:#f0f0f0">
        <tr><th>Nama Barang</th><th>Area</th><th>Total</th><th>Threshold</th><th>Status</th></tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </body></html>`;
}
```

---

### Tugas 2.10 — Implementasi `Laporan.gs`

```javascript
// Laporan.gs

function searchLaporan(cabangId, params) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  let rows = sheetToObjects_(getSheetByName_(spreadsheet, 'Laporan_PDF'));
  if (params.tanggal) rows = rows.filter(r => formatDate_(r['Tanggal_Operasional']) === params.tanggal);
  if (params.shift)   rows = rows.filter(r => r['Shift'] === params.shift);
  if (params.petugas) rows = rows.filter(r => r['Petugas'] === params.petugas);
  return rows;
}

function getShareWhatsAppLink(cabangId, laporanId) {
  const { spreadsheet, cabang } = resolveCabangSpreadsheet_(cabangId);
  const rows = sheetToObjects_(getSheetByName_(spreadsheet, 'Laporan_PDF'));
  const laporan = rows.find(r => r['Laporan_ID'] === laporanId);
  if (!laporan) throw new Error('Laporan ' + laporanId + ' tidak ditemukan');
  const nomorWA = String(cabang['Nomor_WA_Cabang']).replace(/\D/g, '');
  const teks = `Laporan SO ${cabang['Nama_Cabang']} - ${laporan['Tanggal_Operasional']} ${laporan['Shift']}\n${laporan['Link_PDF']}`;
  return { waLink: `https://wa.me/${nomorWA}?text=${encodeURIComponent(teks)}`, laporan };
}

function updateStatusKirimWA(cabangId, laporanId) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Laporan_PDF');
  const rows = sheet.getDataRange().getValues();
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === laporanId);
  if (rowIdx === -1) throw new Error('Laporan ' + laporanId + ' tidak ditemukan');
  sheet.getRange(rowIdx + 1, 10).setValue('Sudah Dikirim');
  return { laporanId, status: 'Sudah Dikirim' };
}
```

---

### Tugas 2.11 — Implementasi `Dashboard.gs`

```javascript
// Dashboard.gs

function getDashboardHarian(cabangId, tanggal) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const masterRows = sheetToObjects_(getSheetByName_(spreadsheet, 'Master_Item'));
  const soRows = sheetToObjects_(getSheetByName_(spreadsheet, 'SO_Transaksi'))
    .filter(r => formatDate_(r['Tanggal_Operasional']) === tanggal);

  const detail = soRows.map(r => {
    const master = masterRows.find(m => m['Item_ID'] === r['Item_ID']) || {};
    return { ...r, Status: calculateStatus_(r['Total'], master['Threshold'] || 0) };
  });

  return {
    tanggal,
    totalTransaksi: soRows.length,
    kritis: detail.filter(r => r.Status === 'Kritis').length,
    hampirHabis: detail.filter(r => r.Status === 'Hampir Habis').length,
    detail
  };
}

function getDashboardMingguan(cabangId, dari, sampai) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const soRows = sheetToObjects_(getSheetByName_(spreadsheet, 'SO_Transaksi'))
    .filter(r => { const t = formatDate_(r['Tanggal_Operasional']); return t >= dari && t <= sampai; });

  const trenPerHari = {};
  soRows.forEach(r => {
    const t = formatDate_(r['Tanggal_Operasional']);
    trenPerHari[t] = (trenPerHari[t] || 0) + 1;
  });
  return { dari, sampai, totalTransaksi: soRows.length, trenPerHari };
}
```

---

### Tugas 2.12 — Deploy Apps Script sebagai Web App

1. Klik **Deploy → New Deployment**
2. Type: **Web App**
3. Setting:
   - Execute as: `Me`
   - Who has access: `Anyone` *(keamanan via API key di kode)*
4. Klik **Deploy** → Catat **Web App URL**
5. Simpan URL ke: `APPS_SCRIPT_URL` (dipakai di Vercel env vars)

---

## FASE 3 — Frontend: Next.js di Vercel

> **Goal:** 9 halaman berjalan di Vercel. Browser tidak pernah langsung ke Apps Script.

### Tugas 3.1 — Setup Project Next.js

```bash
npx create-next-app@latest stokis-frontend --typescript --tailwind --app
cd stokis-frontend
```

**Struktur folder:**

```
stokis-frontend/
├── app/
│   ├── page.tsx                           ← / (Pilih Cabang)
│   ├── so/
│   │   ├── input/page.tsx                 ← /so/input (Input SO)
│   │   └── konfirmasi/[laporanId]/page.tsx
│   ├── laporan/page.tsx
│   ├── master-item/page.tsx
│   ├── petugas/page.tsx
│   ├── cabang/page.tsx
│   └── dashboard/
│       ├── harian/page.tsx
│       └── mingguan/page.tsx
├── app/api/
│   ├── cabang/
│   │   ├── route.ts                       ← GET, POST
│   │   └── [cabangId]/
│   │       ├── route.ts                   ← PUT
│   │       └── status/route.ts            ← PATCH
│   ├── master-item/
│   │   ├── route.ts
│   │   └── [itemId]/
│   │       ├── threshold/route.ts
│   │       └── status/route.ts
│   ├── petugas/
│   │   ├── route.ts
│   │   └── [petugasId]/
│   │       ├── route.ts
│   │       └── status/route.ts
│   ├── so/route.ts
│   ├── laporan/
│   │   ├── route.ts
│   │   └── [laporanId]/
│   │       ├── wa-link/route.ts
│   │       └── status-wa/route.ts
│   └── dashboard/
│       ├── harian/route.ts
│       └── mingguan/route.ts
└── lib/
    └── appsscript.ts                      ← Helper panggil Apps Script
```

---

### Tugas 3.2 — `lib/appsscript.ts` (Helper Server-Side)

```typescript
// lib/appsscript.ts
// Hanya dijalankan di sisi server (API Routes), TIDAK di client

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_KEY = process.env.STOKIS_API_KEY!;

export interface ASResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export async function callAppsScript<T = unknown>(
  action: string,
  cabangId?: string,
  payload?: Record<string, unknown>
): Promise<ASResponse<T>> {
  const body = JSON.stringify({
    action,
    cabangId,
    payload: payload || {},
    'x-api-key': API_KEY,
  });

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    redirect: 'follow', // Apps Script redirect 302
  });

  if (!res.ok) {
    return { success: false, error: { code: 'HTTP_ERROR', message: `HTTP ${res.status}` } };
  }

  return res.json() as Promise<ASResponse<T>>;
}
```

---

### Tugas 3.3 — Contoh API Routes

**`app/api/cabang/route.ts`** (GET + POST):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function GET() {
  const result = await callAppsScript('getCabangList');
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await callAppsScript('createCabang', undefined, body);
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
```

**`app/api/cabang/[cabangId]/status/route.ts`** (PATCH):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function PATCH(req: NextRequest, { params }: { params: { cabangId: string } }) {
  const body = await req.json();
  const result = await callAppsScript('setCabangActive', params.cabangId, body);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
```

**`app/api/so/route.ts`** (POST submitSO):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function POST(req: NextRequest) {
  const { cabangId, ...payload } = await req.json();
  const result = await callAppsScript('submitSO', cabangId, payload);
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
```

---

### Tugas 3.4 — Environment Variables

**`.env.local`** (tidak di-commit):

```env
STOKIS_API_KEY=<sama persis dengan nilai di Script Properties Apps Script>
APPS_SCRIPT_URL=<Web App URL dari Fase 2 Tugas 2.12>
```

**Vercel Dashboard → Project Settings → Environment Variables:**

| Name | Value | Env |
|---|---|---|
| `STOKIS_API_KEY` | `<api-key>` | Production, Preview |
| `APPS_SCRIPT_URL` | `<apps-script-url>` | Production, Preview |

> ⚠️ JANGAN gunakan prefix `NEXT_PUBLIC_` — kunci akan bocor ke browser!

---

### Tugas 3.5 — Peta Halaman Frontend

| Route | Halaman | API yang Dipanggil |
|---|---|---|
| `/` | Pilih Cabang | `GET /api/cabang` |
| `/so/input` | Input Stock Opname | `GET /api/master-item`, `GET /api/petugas` |
| `/so/konfirmasi/[id]` | Konfirmasi + WA | `GET /api/laporan/[id]/wa-link` |
| `/laporan` | Riwayat Laporan | `GET /api/laporan` |
| `/master-item` | Kelola Item | `GET/POST/PATCH /api/master-item` |
| `/petugas` | Kelola Karyawan | `GET/POST/PUT/PATCH /api/petugas` |
| `/cabang` | Kelola Cabang | `GET/POST/PUT/PATCH /api/cabang` |
| `/dashboard/harian` | Dashboard Harian | `GET /api/dashboard/harian` |
| `/dashboard/mingguan` | Dashboard Mingguan | `GET /api/dashboard/mingguan` |

---

## FASE 4 — Testing & Deployment

### Tugas 4.1 — Test Functions di Apps Script Editor

```javascript
// Jalankan dari Apps Script Editor (tidak perlu deploy)
// Hapus file ini setelah testing selesai

function testGetCabangList() {
  const result = getCabangList();
  Logger.log(JSON.stringify(result));
}

function testCreateCabang() {
  const result = createCabang({
    Nama_Cabang: 'SO Bandung Malam Test',
    PIC_Nama: 'Taufik Alwan',
    Nomor_WA_Cabang: '628123456789'
  });
  Logger.log(JSON.stringify(result));
  // Catat cabangId dari hasil untuk test berikutnya
}

function testAddItem() {
  const result = addItem('CBG001', {
    Nama_Barang: 'Beras 5kg', Area: 'Meja Biru Depan',
    Satuan: 'kg', Threshold: 10
  });
  Logger.log(JSON.stringify(result));
}

function testSubmitSO() {
  const result = submitSO('CBG001', {
    tanggalOperasional: '2026-08-26',
    shift: 'Opening',
    petugas: 'Taufik Alwan',
    items: [{ itemId: 'ITM00001', step1: 5, step2: 2 }]
  });
  Logger.log(JSON.stringify(result)); // Harus menghasilkan PDF di Drive
}
```

### Tugas 4.2 — Test API Key via curl

```bash
# Harus UNAUTHORIZED
curl -X POST "https://<apps-script-url>/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"getCabangList"}'

# Harus success
curl -X POST "https://<apps-script-url>/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"getCabangList","x-api-key":"<api-key>"}'
```

### Tugas 4.3 — Deploy ke Vercel

```bash
cd stokis-frontend
npm run build   # pastikan build sukses lokal
vercel --prod
```

### Tugas 4.4 — Checklist Final (Kriteria Selesai PRD)

- [ ] Semua 19 endpoint API pada bagian 8 PRD dapat diakses dan mengembalikan JSON terstruktur
- [ ] Request tanpa API key → response `{ success: false, error: { code: "UNAUTHORIZED" } }`
- [ ] Tidak ada API key yang terlihat di Browser DevTools → Network tab
- [ ] Semua 9 halaman berjalan di Vercel tanpa error
- [ ] Submit SO → PDF terbuat → tersimpan di Drive → tercatat di sheet `Laporan_PDF`
- [ ] Share WA → tautan `wa.me/...` terbentuk dengan benar
- [ ] Tambah cabang via UI → spreadsheet baru otomatis terbuat di Drive
- [ ] Tidak ada file `.html` tersisa di proyek Apps Script
- [ ] URL lama Apps Script tidak lagi dibagikan ke pengguna akhir

---

## Timeline Pengerjaan

| Minggu | Fase | Tugas |
|---|---|---|
| **Minggu 1** | FASE 1 | Buat STOKIS_REGISTRY, STOKIS_TEMPLATE_CABANG, set Script Properties |
| **Minggu 2** | FASE 2 | Buat semua file .gs, test manual, deploy Web App |
| **Minggu 3** | FASE 3 | Setup Next.js, buat semua API Routes |
| **Minggu 4** | FASE 3 | Buat semua halaman UI frontend |
| **Minggu 5** | FASE 4 | Test end-to-end, set Vercel env vars, deploy production |

---

## Catatan Penting

> **Keamanan API Key:** `STOKIS_API_KEY` di Vercel **tidak boleh** menggunakan prefix `NEXT_PUBLIC_`. Tanpa prefix ini, variabel hanya tersedia di Server Functions, tidak ikut terbundel ke kode klien.

> **Apps Script Deployment:** Setiap perubahan kode Apps Script memerlukan deployment baru. Gunakan **"Manage deployments"** dan perbarui versi yang sedang dipakai Vercel, sehingga URL tidak berubah.

> **CORS:** Tidak perlu konfigurasi CORS di Apps Script. Browser memanggil Vercel API Route (same origin), lalu Vercel memanggil Apps Script dari sisi server (server-to-server, bebas CORS).

> **Error Codes Standar:**
> - `UNAUTHORIZED` — API key tidak ada atau salah
> - `CABANG_TIDAK_DITEMUKAN` — Cabang_ID tidak ada di Registry
> - `CABANG_TIDAK_AKTIF` — Cabang ada tapi dinonaktifkan
> - `INTERNAL_ERROR` — Error tidak terduga di Apps Script
> - `ACTION_TIDAK_DIKENAL` — Action tidak ada di switch-case router
