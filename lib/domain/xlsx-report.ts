import * as ExcelJS from 'exceljs';

export interface XlsxItem {
  itemId?: string;
  namaBarang?: string;
  area?: string;
  satuan?: string;
  threshold?: number;
  step1?: number;
  step2?: number;
  keterangan?: string;
  prevStep1?: number | null;
  prevStep2?: number | null;
  prevTotal?: number | null;
}

type StatusType = 'KRITIS' | 'HAMPIR HABIS' | 'AMAN' | 'Tidak Dipantau';

function getStatus(step1: number, step2: number, threshold: number): StatusType {
  const total = step1 + step2;
  if (!threshold || threshold <= 0) return 'Tidak Dipantau';
  if (total <= threshold) return 'KRITIS';
  if (total <= threshold * 2) return 'HAMPIR HABIS';
  return 'AMAN';
}

function formatDate(date: string | number | null | undefined): string {
  const v = normalizeDate(date);
  if (!v) return '-';
  const day = String(v.getUTCDate()).padStart(2, '0');
  const month = String(v.getUTCMonth() + 1).padStart(2, '0');
  const year = v.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Normalkan nilai tanggal (serial number Google Sheets/Excel, ISO YYYY-MM-DD,
 * atau Date) menjadi sebuah Date. Menggunakan origin serial 25569 = 1970-01-01
 * yang konsisten dengan ids.ts agar tidak terjadi pergeseran tanggal.
 */
function normalizeDate(date: string | number | null | undefined): Date | null {
  if (date == null || date === '') return null;
  if (typeof date === 'number' && Number.isFinite(date)) {
    const ms = Math.round((date - 25569) * 86400000);
    if (!Number.isFinite(ms)) return null;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(date).trim();
  // Serial number (5-6 digit), mis. "46266" = 2026-09-01.
  if (/^\d{5,6}$/.test(s)) {
    const ms = Math.round((Number(s) - 25569) * 86400000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // ISO YYYY-MM-DD (dengan/ tanpa waktu) — parse sebagai UTC agar tanggal stabil.
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildXlsxFileName(input: { cabangKode?: string; tanggalOperasional?: string; shift?: string; petugas?: string }): string {
  const kode = (input.cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const d = normalizeDate(input.tanggalOperasional);
  const tgl = d
    ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`
    : String(input.tanggalOperasional || '');
  const shiftLabel = (input.shift || 'SO').toUpperCase();
  const petugasLabel = String(input.petugas || 'Petugas').replace(/[/\\:*?"<>|]/g, '').trim();
  return `${kode} - ${tgl} - ${shiftLabel} - ${petugasLabel}.xlsx`;
}

export interface XlsxReportInput {
  laporanId: string;
  cabangNama: string;
  cabangKode: string;
  tanggalOperasional: string;
  shift: string;
  petugas: string;
  items: XlsxItem[];
  previousSOInfo?: { tanggal?: string | number | null; shift?: string; petugas?: string } | null;
}

const STATUS_ORDER: Record<StatusType, number> = { 'KRITIS': 0, 'HAMPIR HABIS': 1, 'AMAN': 2, 'Tidak Dipantau': 3 };

const COLORS = {
  headerInfo: 'FF2563EB', headerPrev: 'FF4B5563', headerCurr: 'FF059669', headerHasil: 'FFD97706',
  subHeader: 'FFE2E8F0', kritisText: 'FFB91C1C', kritisBg: 'FFFEE2E2',
  hampirText: 'FFA16207', hampirBg: 'FFFEF9C3', amanText: 'FF047857', amanBg: 'FFD1FAE5',
  white: 'FFFFFFFF', textDark: 'FF1E293B',
};

export async function generateXlsxReport(input: XlsxReportInput): Promise<{ buffer: Buffer; fileName: string }> {
  const sortedItems = [...input.items].sort((a, b) => {
    const statusA = getStatus(Number(a.step1) || 0, Number(a.step2) || 0, Number(a.threshold) || 0);
    const statusB = getStatus(Number(b.step1) || 0, Number(b.step2) || 0, Number(b.threshold) || 0);
    return STATUS_ORDER[statusA] - STATUS_ORDER[statusB];
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Detail SO');

  const currTgl = formatDate(input.tanggalOperasional);
  const prevTgl = formatDate(input.previousSOInfo?.tanggal);
  const prevShift = input.previousSOInfo?.shift || '-';
  const prevPetugas = input.previousSOInfo?.petugas || '-';

  const titleRow = ws.insertRow(1, ['LAPORAN STOCK OPNAME HARIAN']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  ws.getRow(1).height = 24;

  const currHeader = ws.insertRow(2, ['INFORMASI LAPORAN HARI INI']);
  currHeader.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.white } };
  currHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerInfo } } as any;
  ws.mergeCells('A2:N2');
  ws.getRow(2).height = 16;

  const currInfo = ws.insertRow(3, ['Cabang', input.cabangKode + ' (' + input.cabangNama + ')', 'Tanggal', currTgl, 'Shift', input.shift, 'Petugas', input.petugas]);
  currInfo.height = 14;

  const prevHeader = ws.insertRow(4, ['INFORMASI STOCK OPNAME SEBELUMNYA']);
  prevHeader.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.white } };
  prevHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerPrev } } as any;
  ws.mergeCells('A4:N4');
  ws.getRow(4).height = 16;

  const prevInfo = ws.insertRow(5, ['Tanggal', prevTgl, 'Shift', prevShift, 'Petugas', prevPetugas]);
  prevInfo.height = 14;

  ws.insertRow(6, []);

  const row7 = ws.insertRow(7, ['INFORMASI BARANG', '', '', '', '', 'SO SEBELUMNYA', '', '', 'SO SEKARANG', '', '', 'HASIL & ANALISIS', '', '']);
  ws.mergeCells('A7:E7');
  ws.mergeCells('F7:H7');
  ws.mergeCells('I7:K7');
  ws.mergeCells('L7:N7');

  ['A7', 'F7', 'I7', 'L7'].forEach((cell, idx) => {
    const colors = [COLORS.headerInfo, COLORS.headerPrev, COLORS.headerCurr, COLORS.headerHasil];
    const c = ws.getCell(cell);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[idx] } } as any;
    c.font = { bold: true, color: { argb: COLORS.white }, size: 10 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  ws.getRow(7).height = 18;

  const row8 = ws.insertRow(8, ['No', 'Nama Barang', 'Area', 'Satuan', 'Batas Min', 'Step 1', 'Step 2', 'Total', 'Step 1', 'Step 2', 'Total', 'Pemakaian', 'Status', 'Keterangan']);
  for (let i = 1; i <= 14; i++) {
    const cell = row8.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subHeader } } as any;
    cell.font = { bold: true, color: { argb: COLORS.textDark }, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }
  ws.getRow(8).height = 18;

  sortedItems.forEach((it, idx) => {
    const s1 = Number(it.step1) || 0;
    const s2 = Number(it.step2) || 0;
    const total = s1 + s2;
    const threshold = Number(it.threshold) || 0;
    const prevTotal = it.prevTotal != null ? Number(it.prevTotal) : null;
    const penggunaan = prevTotal != null ? prevTotal - total : null;
    const status = getStatus(s1, s2, threshold);

    const newRow = ws.insertRow(idx + 9, [idx + 1, it.namaBarang || '', it.area || '', it.satuan || '', threshold || '', it.prevStep1 ?? '', it.prevStep2 ?? '', prevTotal ?? '', s1, s2, total, penggunaan ?? '', status, it.keterangan || '']);
    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

    newRow.eachCell((cell, colNum) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } } as any;
      cell.alignment = { horizontal: [1, 5, 6, 7, 8, 9, 10, 11, 12].includes(colNum) ? 'center' : 'left', vertical: 'middle', wrapText: true };
      if (colNum === 13) {
        if (status === 'KRITIS') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.kritisBg } } as any;
          cell.font = { bold: true, color: { argb: COLORS.kritisText }, size: 9 };
        } else if (status === 'HAMPIR HABIS') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.hampirBg } } as any;
          cell.font = { bold: true, color: { argb: COLORS.hampirText }, size: 9 };
        } else if (status === 'AMAN') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.amanBg } } as any;
          cell.font = { bold: true, color: { argb: COLORS.amanText }, size: 9 };
        }
      }
    });
    newRow.height = 16;
  });

  ws.columns = [{ width: 5 }, { width: 24 }, { width: 12 }, { width: 8 }, { width: 10 }, { width: 8 }, { width: 8 }, { width: 9 }, { width: 8 }, { width: 8 }, { width: 9 }, { width: 11 }, { width: 15 }, { width: 20 }];
  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: 8 }];

  const buffer = await wb.xlsx.writeBuffer() as any as Buffer;
  return { buffer, fileName: buildXlsxFileName(input) };
}
