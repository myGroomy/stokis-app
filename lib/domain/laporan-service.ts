// lib/domain/laporan-service.ts
// Operasi laporan — port dari Laporan.js. Menggunakan Google Sheets API.

import { resolveCabang } from '@/lib/google/registry';
import { readSheetData, sheetToObjects, findRowIndex, appendRows, writeRow, setCellValue, ensureSheet, columnIndexToLetter } from '@/lib/google/sheets';
import { calculateStatus, parseThreshold } from './so';
import { ApiError } from './errors';
import { randomToken, buildLaporanId, formatDate } from './ids';

interface LaporanRow {
  Laporan_ID: string;
  Sesi_ID: string;
  Tanggal_Operasional: string;
  Shift: string;
  Petugas: string;
  Link_PDF?: string;
  Link_XLSX?: string;
  Status?: string;
}

interface SaveLaporanPayload {
  sesiId?: string;
  tanggalOperasional?: string;
  shift?: string;
  petugas?: string;
  items?: SaveLaporanItem[];
  linkPdf?: string;
  linkXlsx?: string;
  note?: string;
  previousSOInfo?: { tanggal?: string; shift?: string } | null;
}

interface SaveLaporanItem {
  itemId?: string;
  namaBarang?: string;
  satuan?: string;
  area?: string;
  threshold?: number;
  step1?: unknown;
  step2?: unknown;
  keterangan?: string;
  prevStep1?: number | null;
  prevStep2?: number | null;
  prevTotal?: number | null;
  prevTanggal?: string | null;
  prevShift?: string | null;
  prevKeterangan?: string;
  statusIsi?: 'Isi' | 'Kosong' | '';
  tglRefill?: string;
  tglPakai?: string;
}

/**
 * Simpan catatan laporan langsung dari payload. Idempoten per sesiId.
 * Menjamin selalu ada laporanId yang valid untuk halaman konfirmasi/share.
 */
export async function saveLaporan(
  cabangId: string,
  payload: SaveLaporanPayload
): Promise<{ status: string; sesiId: string; laporanId: string; rows_written: number }> {
  const sesiId = String((payload && payload.sesiId) || '');
  if (!sesiId) throw new ApiError('validation_error', 'sesiId wajib disertakan');

  const { spreadsheetId } = await resolveCabang(cabangId);
  const laporanRows = await readAllRows(spreadsheetId, 'Laporan_PDF');

  const existing = laporanRows.find((r) => String(r['Sesi_ID']) === sesiId);
  if (existing && existing['Laporan_ID']) {
    return {
      status: 'already_processed',
      sesiId,
      laporanId: String(existing['Laporan_ID']),
      rows_written: 0,
    };
  }

  let jumlahKritis = 0;
  let jumlahHampirHabis = 0;
  (payload.items || []).forEach((it) => {
    const total = (Number(it.step1) || 0) + (Number(it.step2) || 0);
    const threshold = parseThreshold(it.threshold);
    if (threshold === null) return;
    const s = calculateStatus(total, threshold);
    if (s === 'Kritis') jumlahKritis++;
    else if (s === 'Hampir Habis') jumlahHampirHabis++;
  });

  const laporanId = buildLaporanId(payload.tanggalOperasional || '', randomToken(8));
  const shift = payload.shift ? String(payload.shift).trim() : '';

  await appendRows(spreadsheetId, 'Laporan_PDF', [[
    laporanId,
    sesiId,
    payload.tanggalOperasional || '',
    shift,
    payload.petugas || '',
    new Date(),
    payload.linkPdf || '',
    jumlahKritis,
    jumlahHampirHabis,
    'Belum Dikirim',
  ]]);

  // Simpan baris detail laporan (perbandingan SO lama vs sekarang) ke sheet
  // Laporan_SO sebagai data riil, formatnya sama dengan tabel di PDF.
  await saveLaporanDetail(cabangId, {
    laporanId,
    tanggalOperasional: payload.tanggalOperasional || '',
    shift,
    petugas: payload.petugas || '',
    items: payload.items || [],
    note: String(payload.note || ''),
    previousSOInfo: payload.previousSOInfo || null,
  });

  return { status: 'success', sesiId, laporanId, rows_written: 1 };
}

export const LAPORAN_DETAIL_SHEET = 'Laporan_SO';

const LAPORAN_DETAIL_HEADERS = [
  'Laporan_ID', 'Tanggal_Operasional', 'Shift', 'Petugas',
  'Item_ID', 'Nama_Barang', 'Area', 'Satuan', 'Threshold',
  'Prev_Step1', 'Prev_Step2', 'Prev_Total', 'Prev_Tanggal', 'Prev_Shift', 'Prev_Keterangan',
  'Step1', 'Step2', 'Total',
  'Penggunaan', 'Keterangan', 'Status',
  'Status_Isi', 'Tgl_Refill', 'Tgl_Pakai',
  'Note',
];

async function saveLaporanDetail(
  cabangId: string,
  data: {
    laporanId: string;
    tanggalOperasional: string;
    shift: string;
    petugas: string;
    items: SaveLaporanItem[];
    note?: string;
    previousSOInfo?: { tanggal?: string; shift?: string } | null;
  }
): Promise<void> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  await ensureSheet(spreadsheetId, LAPORAN_DETAIL_SHEET, LAPORAN_DETAIL_HEADERS);

  const prevTanggal = data.previousSOInfo?.tanggal || '';
  const prevShift = data.previousSOInfo?.shift || '';
  const note = String(data.note || '');

  const rows: unknown[][] = (data.items || []).map((it) => {
    const step1 = Number(it.step1) || 0;
    const step2 = Number(it.step2) || 0;
    const total = step1 + step2;
    const prevTotal = it.prevTotal != null ? Number(it.prevTotal) : null;
    const penggunaan = prevTotal != null ? prevTotal - total : null;
    const threshold = parseThreshold(it.threshold);
    const status = calculateStatus(total, threshold);
    return [
      data.laporanId,
      data.tanggalOperasional,
      data.shift,
      data.petugas,
      it.itemId || '',
      it.namaBarang || '',
      it.area || '',
      it.satuan || '',
      threshold != null ? threshold : null,
      it.prevStep1 != null ? Number(it.prevStep1) : null,
      it.prevStep2 != null ? Number(it.prevStep2) : null,
      prevTotal,
      (it.prevTanggal || prevTanggal) as string | null,
      (it.prevShift || prevShift) as string | null,
      it.prevKeterangan || '',
      step1,
      step2,
      total,
      penggunaan,
      it.keterangan || '',
      status,
      it.statusIsi || '',
      it.tglRefill || '',
      it.tglPakai || '',
      note,
    ];
  });

  if (rows.length > 0) {
    await appendRows(spreadsheetId, LAPORAN_DETAIL_SHEET, rows);
  }
}

export async function searchLaporan(
  cabangId: string,
  params: { tanggal?: string; shift?: string; petugas?: string }
): Promise<LaporanRow[]> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  let rows = (await readAllRows(spreadsheetId, 'Laporan_PDF')) as unknown as LaporanRow[];
  if (params.tanggal) rows = rows.filter((r) => formatDate(r['Tanggal_Operasional']) === params.tanggal);
  if (params.shift) rows = rows.filter((r) => r['Shift'] === params.shift);
  if (params.petugas) rows = rows.filter((r) => r['Petugas'] === params.petugas);
  return rows;
}

export async function getShareWhatsAppLink(
  cabangId: string,
  laporanId: string
): Promise<{ waLink: string; laporan: LaporanRow }> {
  const { spreadsheetId, cabang } = await resolveCabang(cabangId);
  const rows = await readAllRows(spreadsheetId, 'Laporan_PDF');
  const laporan = rows.find((r) => String(r['Laporan_ID']) === laporanId) as LaporanRow | undefined;
  if (!laporan) throw new ApiError('not_found', 'Laporan ' + laporanId + ' tidak ditemukan');
  const nomorWA = String(cabang['Nomor_WA_Cabang'] || '').replace(/\D/g, '');
  const teks = `Laporan SO ${cabang['Nama_Cabang'] || ''} - ${formatDate(laporan['Tanggal_Operasional'])} ${laporan['Shift']}\n${laporan['Link_XLSX'] || ''}`;
  return { waLink: `https://wa.me/${nomorWA}?text=${encodeURIComponent(teks)}`, laporan };
}

export async function updateStatusKirimWA(
  cabangId: string,
  laporanId: string
): Promise<{ laporanId: string; status: string }> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const { rows } = await readSheetData(spreadsheetId, 'Laporan_PDF');
  const found = findRowIndex(rows, 0, laporanId);
  if (found.index === -1) throw new ApiError('not_found', 'Laporan ' + laporanId + ' tidak ditemukan');
  const rowNumber = found.index + 2; // 1-based, +1 utk header
  await writeRow(spreadsheetId, `Laporan_PDF!J${rowNumber}`, ['Sudah Dikirim']);
  return { laporanId, status: 'Sudah Dikirim' };
}

/**
 * Simpan link XLSX yang sudah di-upload ke Drive ke baris Laporan_PDF.
 * Kolom K = Link_XLSX (kolom ke-11, 1-based).
 *
 * Self-healing: bila header 'Link_XLSX' belum ada di sheet, kolom tersebut
 * dibuat otomatis di posisi K agar link permanen tersimpan (mencegah upload
 * berhasil tapi link tidak tercatat karena kolomnya tidak ada).
 */
export async function updateLaporanXlsxLink(
  cabangId: string,
  sesiId: string,
  laporanId: string,
  linkXlsx: string
): Promise<{ updated: boolean }> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const { headers, rows } = await readSheetData(spreadsheetId, 'Laporan_PDF');
  const bySesi = findRowIndex(rows, 1, sesiId);
  const targetIndex = bySesi.index !== -1 ? bySesi.index : findRowIndex(rows, 0, laporanId).index;
  if (targetIndex === -1) return { updated: false };

  let colIndex = headers.findIndex((h) => h === 'Link_XLSX');
  if (colIndex === -1) {
    // Kolom Link_XLSX belum ada → buat di posisi K (index 10) + tulis header.
    colIndex = 10;
    await setCellValue(spreadsheetId, 'Laporan_PDF!K1', 'Link_XLSX');
  }

  const rowNumber = targetIndex + 2;
  const colLetter = columnIndexToLetter(colIndex);
  await writeRow(spreadsheetId, `Laporan_PDF!${colLetter}${rowNumber}`, [linkXlsx]);
  return { updated: true };
}

async function readAllRows(spreadsheetId: string, sheetName: string): Promise<Record<string, unknown>[]> {
  const { headers, rows } = await readSheetData(spreadsheetId, sheetName);
  return sheetToObjects(headers, rows);
}

/**
 * Ambil data laporan dari Laporan_PDF berdasarkan Laporan_ID.
 */
export async function getLaporanById(
  cabangId: string,
  laporanId: string
): Promise<LaporanRow | null> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const rows = await readAllRows(spreadsheetId, 'Laporan_PDF');
  return (rows.find((r) => String(r['Laporan_ID']) === laporanId) as unknown as LaporanRow) || null;
}

/**
 * Ambil detail item laporan dari Laporan_SO berdasarkan Laporan_ID.
 */
export async function getLaporanDetail(
  cabangId: string,
  laporanId: string
): Promise<Record<string, unknown>[]> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const { headers, rows } = await readSheetData(spreadsheetId, LAPORAN_DETAIL_SHEET);
  const all = sheetToObjects(headers, rows);
  return all.filter((r) => String(r['Laporan_ID']) === laporanId);
}

export interface SesiLiveExtra {
  note: string;
  byItemId: Record<string, { statusIsi?: 'Isi' | 'Kosong' | ''; tglRefill?: string; tglPakai?: string }>;
}

/**
 * Fallback data live dari SO_Transaksi untuk laporan lama yang kolom
 * Status_Isi/Tgl_Refill/Tgl_Pakai/Note di Laporan_SO masih kosong.
 * Diambil dari sesi SO aslinya, lalu di-join per Item_ID.
 */
export async function getSesiLiveData(
  spreadsheetId: string,
  sesiId: string
): Promise<SesiLiveExtra> {
  if (!spreadsheetId || !sesiId) return { note: '', byItemId: {} };
  try {
    const { headers, rows } = await readSheetData(spreadsheetId, 'SO_Transaksi');
    const all = sheetToObjects(headers, rows).filter((r) => String(r['Sesi_ID']) === sesiId);
    if (all.length === 0) return { note: '', byItemId: {} };
    const byItemId: SesiLiveExtra['byItemId'] = {};
    all.forEach((r) => {
      const itemId = String(r['Item_ID'] || '').trim();
      if (!itemId) return;
      byItemId[itemId] = {
        statusIsi: (r['Status_Isi'] === 'Isi' || r['Status_Isi'] === 'Kosong') ? r['Status_Isi'] as 'Isi' | 'Kosong' : '',
        tglRefill: String(r['Tgl_Refill'] || ''),
        tglPakai: String(r['Tgl_Pakai'] || ''),
      };
    });
    return { note: String(all[0]['Note'] || ''), byItemId };
  } catch {
    return { note: '', byItemId: {} };
  }
}

// ---------------------------------------------------------------------------
// Settings per cabang (sheet "Settings", kolom Key/Value)
// ---------------------------------------------------------------------------

export const CABANG_SETTINGS_SHEET = 'Settings';

export type UrutanLaporan = 'Area' | 'Urutan_Input';

export const URUTAN_LAPORAN_KEY = 'Urutan_Laporan';

const URUTAN_LAPORAN_VALUES: UrutanLaporan[] = ['Area', 'Urutan_Input'];

/** Normalisasi nilai Urutan_Laporan; nilai tidak dikenal → default 'Urutan_Input'. */
export function normalizeUrutanLaporan(value: unknown): UrutanLaporan {
  const s = String(value ?? '').trim();
  return URUTAN_LAPORAN_VALUES.includes(s as UrutanLaporan) ? (s as UrutanLaporan) : 'Urutan_Input';
}

/** Baca semua key/value sheet Settings cabang. Aman jika sheet belum ada. */
export async function getCabangSettings(spreadsheetId: string): Promise<Record<string, string>> {
  try {
    const { headers, rows } = await readSheetData(spreadsheetId, CABANG_SETTINGS_SHEET);
    const objs = sheetToObjects(headers, rows);
    const result: Record<string, string> = {};
    objs.forEach((r) => {
      result[String(r['Key'] ?? '')] = String(r['Value'] ?? '');
    });
    return result;
  } catch {
    return {};
  }
}

/** Ambil Urutan_Laporan untuk cabang (default 'Urutan_Input'). */
export async function getUrutanLaporan(spreadsheetId: string): Promise<UrutanLaporan> {
  const settings = await getCabangSettings(spreadsheetId);
  return normalizeUrutanLaporan(settings[URUTAN_LAPORAN_KEY]);
}

/** Simpan Urutan_Laporan untuk cabang. Membuat sheet/pastikan header bila perlu. */
export async function setUrutanLaporan(spreadsheetId: string, value: UrutanLaporan): Promise<UrutanLaporan> {
  const normalized = normalizeUrutanLaporan(value);
  await ensureSheet(spreadsheetId, CABANG_SETTINGS_SHEET, ['Key', 'Value']);
  const { rows } = await readSheetData(spreadsheetId, CABANG_SETTINGS_SHEET);
  const found = findRowIndex(rows, 0, URUTAN_LAPORAN_KEY);
  if (found.index !== -1) {
    const rowNumber = found.index + 2;
    await writeRow(spreadsheetId, `${CABANG_SETTINGS_SHEET}!B${rowNumber}`, [normalized]);
  } else {
    await appendRows(spreadsheetId, CABANG_SETTINGS_SHEET, [[URUTAN_LAPORAN_KEY, normalized]]);
  }
  return normalized;
}
