import * as ExcelJS from 'exceljs';
import { parseThreshold } from './so';

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
  prevKeterangan?: string;
}

type StatusType = 'KRITIS' | 'HAMPIR HABIS' | 'AMAN' | 'Tidak Dipantau';

function getStatus(step1: number, step2: number, threshold: number | null | undefined): StatusType {
  const total = step1 + step2;
  if (threshold === null || threshold === undefined || isNaN(threshold) || threshold < 0) {
    return 'Tidak Dipantau';
  }
  if (total <= threshold) return 'KRITIS';
  if (threshold > 0 && total <= threshold * 2) return 'HAMPIR HABIS';
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
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Detail SO');

  const currTgl = formatDate(input.tanggalOperasional);
  const prevTgl = formatDate(input.previousSOInfo?.tanggal);
  const prevShift = input.previousSOInfo?.shift || '-';
  const prevPetugas = input.previousSOInfo?.petugas || '-';

  const titleRow = ws.insertRow(1, ['LAPORAN STOCK OPNAME HARIAN']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  ws.getRow(1).height = 24;

  const thinBorder = { top: { style: 'thin' as const }, left: { style: 'thin' as const }, bottom: { style: 'thin' as const }, right: { style: 'thin' as const } };

  const currHeader = ws.insertRow(2, ['INFORMASI LAPORAN HARI INI']);
  currHeader.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.white } };
  currHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerInfo } } as any;
  ws.mergeCells('A2:N2');
  ws.getRow(2).height = 16;

  const currInfo = ws.insertRow(3, ['Cabang', input.cabangKode + ' (' + input.cabangNama + ')', 'Tanggal', currTgl, 'Shift', input.shift, 'Petugas', input.petugas]);
  currInfo.height = 14;
  for (let i = 1; i <= 8; i++) { currInfo.getCell(i).border = thinBorder; }

  const prevHeader = ws.insertRow(4, ['INFORMASI STOCK OPNAME SEBELUMNYA']);
  prevHeader.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.white } };
  prevHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerPrev } } as any;
  ws.mergeCells('A4:N4');
  ws.getRow(4).height = 16;

  const prevInfo = ws.insertRow(5, ['Tanggal', prevTgl, 'Shift', prevShift, 'Petugas', prevPetugas]);
  prevInfo.height = 14;
  for (let i = 1; i <= 6; i++) { prevInfo.getCell(i).border = thinBorder; }

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
    c.border = thinBorder;
  });
  ws.getRow(7).height = 18;

  const row8 = ws.insertRow(8, ['No', 'Nama Barang', 'Area', 'Satuan', 'Batas Min', 'Step 1', 'Step 2', 'Total', 'Step 1', 'Step 2', 'Total', 'Pemakaian', 'Status', 'Keterangan Sebelumnya', 'Keterangan']);
  for (let i = 1; i <= 15; i++) {
    const cell = row8.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subHeader } } as any;
    cell.font = { bold: true, color: { argb: COLORS.textDark }, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  }
  ws.getRow(8).height = 18;

  const sortedItems = [...input.items].sort((a, b) => {
    const sa = getStatus(Number(a.step1) || 0, Number(a.step2) || 0, parseThreshold(a.threshold));
    const sb = getStatus(Number(b.step1) || 0, Number(b.step2) || 0, parseThreshold(b.threshold));
    return STATUS_ORDER[sa] - STATUS_ORDER[sb];
  });

  const ROW_COLORS: Record<StatusType, { bg: string; text: string }> = {
    'KRITIS':          { bg: COLORS.kritisBg, text: COLORS.kritisText },
    'HAMPIR HABIS':    { bg: COLORS.hampirBg, text: COLORS.hampirText },
    'AMAN':            { bg: COLORS.amanBg,   text: COLORS.amanText },
    'Tidak Dipantau':  { bg: 'FFFFFFFF',      text: COLORS.textDark },
  };

  sortedItems.forEach((it, idx) => {
    const s1 = Number(it.step1) || 0;
    const s2 = Number(it.step2) || 0;
    const total = s1 + s2;
    const threshold = parseThreshold(it.threshold);
    const thresholdCell = threshold != null ? threshold : '';
    const prevTotal = it.prevTotal != null ? Number(it.prevTotal) : null;
    const diff = prevTotal != null ? total - prevTotal : null;
    const diffValue = diff ?? '';
    const status = getStatus(s1, s2, threshold);
    const rc = ROW_COLORS[status];

    const newRow = ws.insertRow(idx + 9, [idx + 1, it.namaBarang || '', it.area || '', it.satuan || '', thresholdCell, it.prevStep1 ?? '', it.prevStep2 ?? '', prevTotal ?? '', s1, s2, total, diffValue, status, it.prevKeterangan || '', it.keterangan || '']);

    newRow.eachCell((cell, colNum) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rc.bg } } as any;
      cell.alignment = { horizontal: [1, 5, 6, 7, 8, 9, 10, 11, 12].includes(colNum) ? 'center' : 'left', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
      if (colNum === 12) {
        cell.numFmt = '+0;-0;0';
        const isNeg = typeof diffValue === 'number' && diffValue < 0;
        const isPos = typeof diffValue === 'number' && diffValue > 0;
        cell.font = {
          bold: true,
          color: { argb: isNeg ? COLORS.kritisText : isPos ? COLORS.amanText : COLORS.textDark },
          size: 9,
        };
      }
      if (colNum === 13) {
        cell.font = { bold: true, color: { argb: rc.text }, size: 9 };
      }
    });
    newRow.height = 16;
  });

  ws.columns = [{ width: 5 }, { width: 24 }, { width: 12 }, { width: 8 }, { width: 10 }, { width: 8 }, { width: 8 }, { width: 9 }, { width: 8 }, { width: 8 }, { width: 9 }, { width: 11 }, { width: 15 }, { width: 20 }, { width: 20 }];
  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: 8 }];

  const buffer = await wb.xlsx.writeBuffer() as any as Buffer;
  return { buffer, fileName: buildXlsxFileName(input) };
}
