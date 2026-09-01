// lib/domain/laporan-service.ts
// Operasi laporan — port dari Laporan.js. Menggunakan Google Sheets API.

import { resolveCabang } from '@/lib/google/registry';
import { readSheetData, sheetToObjects, findRowIndex, appendRows, writeRow } from '@/lib/google/sheets';
import { calculateStatus } from './so';
import { ApiError } from './errors';
import { randomToken, buildLaporanId, formatDate } from './ids';

interface LaporanRow {
  Laporan_ID: string;
  Sesi_ID: string;
  Tanggal_Operasional: string;
  Shift: string;
  Petugas: string;
  Link_PDF?: string;
  Status?: string;
}

interface SaveLaporanPayload {
  sesiId?: string;
  tanggalOperasional?: string;
  shift?: string;
  petugas?: string;
  items?: Array<{ step1?: unknown; step2?: unknown; threshold?: unknown }>;
  linkPdf?: string;
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
    const threshold = Number(it.threshold) || 0;
    if (!threshold || threshold <= 0) return;
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

  return { status: 'success', sesiId, laporanId, rows_written: 1 };
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
  const teks = `Laporan SO ${cabang['Nama_Cabang'] || ''} - ${formatDate(laporan['Tanggal_Operasional'])} ${laporan['Shift']}\n${laporan['Link_PDF'] || ''}`;
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
 * Simpan link PDF yang sudah di-upload ke Drive ke baris Laporan_PDF.
 * Mencocokkan Sesi_ID (lebih unik) lalu fallback ke Laporan_ID.
 * Kolom G = Link_PDF.
 */
export async function updateLaporanPdfLink(
  cabangId: string,
  sesiId: string,
  laporanId: string,
  linkPdf: string
): Promise<{ updated: boolean }> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const { rows } = await readSheetData(spreadsheetId, 'Laporan_PDF');
  const bySesi = findRowIndex(rows, 1, sesiId);
  const targetIndex = bySesi.index !== -1 ? bySesi.index : findRowIndex(rows, 0, laporanId).index;
  if (targetIndex === -1) return { updated: false };
  const rowNumber = targetIndex + 2; // 1-based, +1 utk header
  await writeRow(spreadsheetId, `Laporan_PDF!G${rowNumber}`, [linkPdf]);
  return { updated: true };
}

async function readAllRows(spreadsheetId: string, sheetName: string): Promise<Record<string, unknown>[]> {
  const { headers, rows } = await readSheetData(spreadsheetId, sheetName);
  return sheetToObjects(headers, rows);
}
