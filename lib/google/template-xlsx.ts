// lib/google/template-xlsx.ts
// Baca template .xlsx lokal → isi data dengan ExcelJS → return buffer.
// Semua formatting template (font, warna, border, merged cells, column widths) dipertahankan.

import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import type { XlsxItem, XlsxReportInput } from '@/lib/domain/xlsx-report';
import { XLSX_FONT } from '@/lib/domain/xlsx-report';
import { parseThreshold } from '@/lib/domain/so';

const TEMPLATE_PATH = path.join(process.cwd(), 'Templates', 'PREVIEW SO FORMAT REPORTS (1).xlsx');

function formatDateShort(date: string | number | null | undefined): string {
  const v = normalizeDate(date);
  if (!v) return '-';
  const day = String(v.getUTCDate()).padStart(2, '0');
  const month = String(v.getUTCMonth() + 1).padStart(2, '0');
  const year = v.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeDate(date: string | number | null | undefined): Date | null {
  if (date == null || date === '') return null;
  if (typeof date === 'number' && Number.isFinite(date)) {
    const ms = Math.round((date - 25569) * 86400000);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms);
  }
  const s = String(date).trim();
  if (/^\d{5,6}$/.test(s)) {
    const ms = Math.round((Number(s) - 25569) * 86400000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isUtilitasBoolean(it: XlsxItem): boolean {
  return (it.tipeInput || '').toLowerCase().includes('boolean');
}

function isUtilitasNumeric(it: XlsxItem): boolean {
  const t = (it.tipeInput || '').toLowerCase();
  return t.includes('single') || t.includes('dual');
}

/**
 * Generate XLSX dari template Google Sheets.
 * 1. Download template .xlsx dari Drive via API
 * 2. Buka dengan ExcelJS (formatting preserved)
 * 3. Isi data values + formulas
 * 4. Return buffer
 */
export async function generateXlsxFromTemplate(
  input: XlsxReportInput
): Promise<{ buffer: Buffer; fileName: string }> {
  // ── Build file name ───────────────────────────────────────────────
  const kode = (input.cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const d = normalizeDate(input.tanggalOperasional);
  const tgl = d
    ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`
    : String(input.tanggalOperasional || '');
  const shiftLabel = (input.shift || 'SO').toUpperCase();
  const petugasLabel = String(input.petugas || 'Petugas').replace(/[/\\:*?"<>|]/g, '').trim();
  const fileName = `${kode} - ${tgl} - ${shiftLabel} - ${petugasLabel}.xlsx`;

  // ── 1. Read template from local file ──────────────────────────────
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);

  // ── 2. Open with ExcelJS ─────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(templateBuffer as any);
  const ws = wb.getWorksheet('SO DETAILS') || wb.worksheets[0];
  if (!ws) throw new Error('Sheet SO DETAILS tidak ditemukan di template');

  // ── 3. Separate items ──────────────────────────────────────────
  const regularItems: XlsxItem[] = [];
  const utilitasBoolean: XlsxItem[] = [];
  const utilitasNumeric: XlsxItem[] = [];

  input.items.forEach((it) => {
    if (isUtilitasBoolean(it)) {
      utilitasBoolean.push(it);
    } else if (isUtilitasNumeric(it) && (it.area || '').toLowerCase().includes('utilitas')) {
      utilitasNumeric.push(it);
    } else {
      regularItems.push(it);
    }
  });

  // ── 4. Build data rows ──────────────────────────────────────────
  const currTgl = formatDateShort(input.tanggalOperasional);
  const prevTgl = formatDateShort(input.previousSOInfo?.tanggal);
  const prevShift = input.previousSOInfo?.shift || '-';
  const prevPetugas = input.previousSOInfo?.petugas || '-';
  const cabangLabel = input.cabangKode + ' (' + input.cabangNama + ')';

  interface DataRow {
    type: 'divider' | 'subheader' | 'item' | 'utilgas' | 'utiltoken' | 'note';
    no?: number;
    nama?: string;
    satuan?: string;
    threshold?: number | string;
    prevS1?: number | string | null;
    prevS2?: number | string | null;
    prevTotal?: number | string | null;
    s1?: number;
    s2?: number;
    keterangan?: string;
    areaName?: string;
    statusIsi?: string;
    tglRefill?: string;
    tglPakai?: string;
    noteText?: string;
  }

  const dataRows: DataRow[] = [];

  // Group regular items
  const groupMode = input.groupMode === 'Area' ? 'Area' : 'Urutan_Input';
  const groups: Array<{ area?: string; items: XlsxItem[] }> = [];

  if (groupMode === 'Area') {
    const byArea = new Map<string, XlsxItem[]>();
    regularItems.forEach((it) => {
      const key = (it.area || '').trim() || 'Area Umum';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key)!.push(it);
    });
    byArea.forEach((items, area) => groups.push({ area, items }));
  } else {
    groups.push({ items: regularItems });
  }

  let globalNo = 0;

  groups.forEach((group) => {
    if (group.area != null) {
      dataRows.push({ type: 'divider', areaName: group.area });
      dataRows.push({ type: 'subheader' });
    }
    group.items.forEach((it) => {
      globalNo++;
      const s1 = Number(it.step1) || 0;
      const s2 = Number(it.step2) || 0;
      const threshold = parseThreshold(it.threshold);
      const thresholdVal = threshold != null ? threshold : '';
      const p1 = it.prevStep1 != null && it.prevStep1 !== '' ? Number(it.prevStep1) : null;
      const p2 = it.prevStep2 != null && it.prevStep2 !== '' ? Number(it.prevStep2) : null;
      const prevTotal = (p1 != null || p2 != null)
        ? (p1 || 0) + (p2 || 0)
        : (it.prevTotal != null && it.prevTotal !== '' ? Number(it.prevTotal) : null);

      dataRows.push({
        type: 'item', no: globalNo, nama: it.namaBarang, satuan: it.satuan,
        threshold: thresholdVal, prevS1: p1, prevS2: p2, prevTotal,
        s1, s2, keterangan: it.keterangan,
      });
    });
  });

  // Utilitas
  if (utilitasBoolean.length > 0 || utilitasNumeric.length > 0) {
    dataRows.push({ type: 'divider', areaName: 'UTILITAS' });
    dataRows.push({ type: 'subheader' });

    utilitasBoolean.forEach((it) => {
      globalNo++;
      const threshold = parseThreshold(it.threshold);
      dataRows.push({
        type: 'utilgas', no: globalNo, nama: it.namaBarang, satuan: it.satuan,
        threshold: threshold != null ? threshold : '',
        statusIsi: it.statusIsi || '', tglRefill: it.tglRefill, tglPakai: it.tglPakai,
        keterangan: it.keterangan,
      });
    });

    utilitasNumeric.forEach((it) => {
      globalNo++;
      const threshold = parseThreshold(it.threshold);
      const p1 = it.prevStep1 != null && it.prevStep1 !== '' ? Number(it.prevStep1) : null;
      dataRows.push({
        type: 'utiltoken', no: globalNo, nama: it.namaBarang, satuan: it.satuan,
        threshold: threshold != null ? threshold : '',
        prevS1: p1, prevS2: it.prevStep2, tglRefill: it.tglRefill, tglPakai: it.tglPakai,
        keterangan: it.keterangan,
      });
    });
  }

  const note = String(input.note || '').trim();
  if (note) {
    dataRows.push({ type: 'note', noteText: note });
  }

  // ── 5. Update header rows (rows 1-5) ────────────────────────────
  // Row 1: Title
  ws.getCell('E1').value = `LAPORAN STOCK OPNAME HARIAN ${input.cabangNama.toUpperCase()}`;
  ws.getCell('E1').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.title.size, color: { argb: 'FF000000' } } as any;
  // Row 2: Group labels
  ws.getCell('E2').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.info.size, color: { argb: 'FF000000' } } as any;
  ws.getCell('H2').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.info.size, color: { argb: 'FF000000' } } as any;
  // Row 3: Info bar
  ws.getCell('A3').value = cabangLabel;
  ws.getCell('C3').value = currTgl;
  ws.getCell('D3').value = input.shift;
  ws.getCell('E3').value = input.petugas;
  ws.getCell('F3').value = input.shift;
  ws.getCell('H3').value = cabangLabel;
  ws.getCell('J3').value = prevTgl;
  ws.getCell('K3').value = prevShift;
  ws.getCell('L3').value = prevPetugas;
  // Row 3 fonts
  for (const addr of ['A3','C3','D3','E3','F3','H3','J3','K3','L3']) {
    ws.getCell(addr).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.info.size, color: { argb: 'FF000000' } } as any;
  }
  // Row 4: Group headers
  ws.getCell('A4').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.groupHeader.size, color: { argb: 'FF000000' } } as any;
  ws.getCell('K4').font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.groupHeader.size, color: { argb: 'FF000000' } } as any;
  // Row 5: Column headers
  for (let c = 1; c <= 13; c++) {
    ws.getRow(5).getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.colHeader.size, color: { argb: 'FF000000' } } as any;
  }

  // ── 6. Clear old data rows (6+) and write new ───────────────────
  // ExcelJS spliceRows silently no-ops when deleting the tail of the sheet
  // (start + count > rowCount). The template's shared formulas survive and
  // break writeBuffer. Un-merge + truncate rows instead.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w: any = ws;
  if (ws.rowCount > 5) {
    Object.keys(w._merges || {}).forEach((addr: string) => {
      const row = parseInt((addr.match(/\d+/) || ['0'])[0], 10);
      if (row >= 6) ws.unMergeCells(addr);
    });
    w._rows.splice(5, w._rows.length - 5);
  }

  // Now write new data rows starting at row 6
  let currentRow = 6;

  dataRows.forEach((dr) => {
    const row = ws.getRow(currentRow);

    if (dr.type === 'divider') {
      // Area divider row
      row.getCell(1).value = '';
      row.getCell(2).value = `▶  ${dr.areaName}`;
      for (let c = 3; c <= 13; c++) row.getCell(c).value = '';
      // Apply divider styling
      row.getCell(2).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.divider.size, color: { argb: 'FF000000' } } as any;
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } } as any;
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      // Merge B:M
      ws.mergeCells(`B${currentRow}:M${currentRow}`);
      row.height = 18;
      // Apply borders to entire row
      for (let c = 1; c <= 13; c++) {
        row.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      }
    } else if (dr.type === 'subheader') {
      // Sub-header row — copy style from template
      const headers = ['No', 'NAMA BARANG', 'SATUAN', 'THRESHOLD', 'STEP 1\nUTUH', 'STEP 2\nTERBUKA', 'TOTAL', 'STEP 1\nUTUH\n', 'STEP 2\nTERBUKA\n', 'TOTAL 2', 'PEMAKAIAN', 'STATUS\nSTOK', 'KETERANGAN'];
      for (let c = 1; c <= 13; c++) {
        row.getCell(c).value = headers[c - 1];
        row.getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.colHeader.size, color: { argb: 'FF000000' } } as any;
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } as any;
        row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        row.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      }
      row.height = 28;
    } else if (dr.type === 'item') {
      // Regular item row
      const r = currentRow;
      row.getCell(1).value = dr.no;
      row.getCell(2).value = dr.nama || '';
      row.getCell(3).value = dr.satuan || '';
      row.getCell(4).value = dr.threshold ?? '';
      row.getCell(5).value = dr.prevS1 ?? '';
      row.getCell(6).value = dr.prevS2 ?? '';
      row.getCell(7).value = dr.prevTotal ?? '';
      row.getCell(8).value = dr.s1 || 0;
      row.getCell(9).value = dr.s2 || 0;
      row.getCell(10).value = { formula: `SUM(H${r},I${r})` };
      row.getCell(11).value = { formula: `IF(COUNTA(G${r},J${r})=0,"",J${r}-G${r})` };
      row.getCell(12).value = { formula: `IF(D${r}=0,"—",IF(J${r}<=D${r},"🔴 KRITIS",IF(J${r}<=D${r}*2,"🟠 HAMPIR HABIS","🟢 AMAN")))` };
      row.getCell(13).value = dr.keterangan || '';

      // Status color
      const s1 = Number(dr.s1) || 0;
      const s2 = Number(dr.s2) || 0;
      const total = s1 + s2;
      const th = typeof dr.threshold === 'number' ? dr.threshold : null;
      let bgColor = 'FFFFFFFF';
      let textColor = 'FF1E293B';
      if (th != null && th > 0) {
        if (total <= th) { bgColor = 'FFFEE2E2'; textColor = 'FFB91C1C'; }
        else if (total <= th * 2) { bgColor = 'FFFEF9C3'; textColor = 'FFA16207'; }
        else { bgColor = 'FFD1FAE5'; textColor = 'FF047857'; }
      }

      for (let c = 1; c <= 13; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } } as any;
        row.getCell(c).alignment = {
          horizontal: [1, 4, 5, 6, 7, 8, 9, 10, 11].includes(c) ? 'center' : 'left',
          vertical: 'middle', wrapText: true,
        };
        row.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
        row.getCell(c).font = { name: XLSX_FONT.family, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
      }
      row.getCell(11).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
      row.getCell(11).numFmt = '+0;-0;0';
      row.getCell(12).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: textColor } } as any;
      row.height = 18;
    } else if (dr.type === 'utilgas') {
      // Utilitas Gas/Minyak row
      const r = currentRow;
      row.getCell(1).value = dr.no;
      row.getCell(2).value = dr.nama || '';
      row.getCell(3).value = dr.satuan || '';
      row.getCell(4).value = dr.threshold ?? '';
      row.getCell(5).value = dr.statusIsi || '';
      row.getCell(7).value = dr.tglRefill || '';
      row.getCell(9).value = dr.tglPakai || '';
      row.getCell(11).value = { formula: `E${r}-H${r}` };
      row.getCell(12).value = { formula: `IF(D${r}=0,"—",IF(H${r}<=D${r},"🔴 KRITIS",IF(H${r}<=D${r}*2,"🟠 HAMPIR HABIS","🟢 AMAN")))` };
      row.getCell(13).value = dr.keterangan || '';

      // Merge E:F, G:H, I:J
      ws.mergeCells(`E${r}:F${r}`);
      ws.mergeCells(`G${r}:H${r}`);
      ws.mergeCells(`I${r}:J${r}`);

      const th = typeof dr.threshold === 'number' ? dr.threshold : null;
      let bgColor = 'FFFFFFFF';
      if (th != null && th > 0) {
        const val = Number(dr.statusIsi === 'Penuh' ? 1 : dr.statusIsi === 'Dipakai' ? 0.5 : 0);
        if (val <= th) bgColor = 'FFFEE2E2';
        else if (val <= th * 2) bgColor = 'FFFEF9C3';
        else bgColor = 'FFD1FAE5';
      }

      for (let c = 1; c <= 13; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } } as any;
        row.getCell(c).alignment = {
          horizontal: [1, 4, 5, 6, 7, 8, 9, 10, 11].includes(c) ? 'center' : 'left',
          vertical: 'middle', wrapText: true,
        };
        row.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
        row.getCell(c).font = { name: XLSX_FONT.family, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
      }
      [5, 8, 11].forEach((c) => {
        row.getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
      });
      row.getCell(11).numFmt = '+0;-0;0';
      row.height = 18;
    } else if (dr.type === 'utiltoken') {
      // Utilitas Token Listrik row
      const r = currentRow;
      row.getCell(1).value = dr.no;
      row.getCell(2).value = dr.nama || '';
      row.getCell(3).value = dr.satuan || '';
      row.getCell(4).value = dr.threshold ?? '';
      row.getCell(5).value = dr.prevS1 ?? ''; // Jumlah Restock
      row.getCell(6).value = dr.tglRefill || '';
      row.getCell(8).value = dr.prevS2 ?? ''; // Nilai Saat Ini
      row.getCell(9).value = dr.tglPakai || '';
      row.getCell(11).value = { formula: `E${r}-H${r}` };
      row.getCell(12).value = { formula: `IF(D${r}=0,"—",IF(H${r}<=D${r},"🔴 KRITIS",IF(H${r}<=D${r}*2,"🟠 HAMPIR HABIS","🟢 AMAN")))` };
      row.getCell(13).value = dr.keterangan || '';

      ws.mergeCells(`E${r}:F${r}`);
      ws.mergeCells(`G${r}:H${r}`);
      ws.mergeCells(`I${r}:J${r}`);

      const th = typeof dr.threshold === 'number' ? dr.threshold : null;
      let bgColor = 'FFFFFFFF';
      if (th != null && th > 0) {
        const val = Number(dr.prevS2) || 0;
        if (val <= th) bgColor = 'FFFEE2E2';
        else if (val <= th * 2) bgColor = 'FFFEF9C3';
        else bgColor = 'FFD1FAE5';
      }

      for (let c = 1; c <= 13; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } } as any;
        row.getCell(c).alignment = {
          horizontal: [1, 4, 5, 6, 7, 8, 9, 10, 11].includes(c) ? 'center' : 'left',
          vertical: 'middle', wrapText: true,
        };
        row.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
        row.getCell(c).font = { name: XLSX_FONT.family, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
      }
      [5, 8, 11].forEach((c) => {
        row.getCell(c).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.data.size, color: { argb: 'FF000000' } } as any;
      });
      row.getCell(11).numFmt = '+0;-0;0';
      row.height = 18;
    } else if (dr.type === 'note') {
      // Note header
      row.getCell(1).value = 'KETERANGAN / CATATAN:';
      ws.mergeCells(`A${currentRow}:M${currentRow}`);
      row.getCell(1).font = { name: XLSX_FONT.family, bold: true, size: XLSX_FONT.note.size, color: { argb: 'FFFFFFFF' } } as any;
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } } as any;
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 1; c <= 13; c++) {
        row.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      }
      row.height = 18;
      currentRow++;

      // Note content
      const noteRow = ws.getRow(currentRow);
      noteRow.getCell(1).value = dr.noteText || '';
      ws.mergeCells(`A${currentRow}:M${currentRow}`);
      noteRow.getCell(1).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      noteRow.getCell(1).font = { name: XLSX_FONT.family, size: XLSX_FONT.note.size, color: { argb: 'FF000000' } } as any;
      for (let c = 1; c <= 13; c++) {
        noteRow.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      }
      noteRow.height = 60;
    }

    currentRow++;
  });

  // ── 7. Write buffer ──────────────────────────────────────────────
  const buffer = (await wb.xlsx.writeBuffer()) as unknown as Buffer;
  return { buffer, fileName };
}
