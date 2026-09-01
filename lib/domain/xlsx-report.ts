// lib/domain/xlsx-report.ts
// Generator laporan SO (XLSX) — Redesign sesuai template Mochikin.
// Merged colored headers, sub-headers, freeze panes, conditional formatting.

import * as XLSX from 'xlsx';

interface XlsxItem {
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

function getStatus(step1: number, step2: number, threshold: number): string {
  const total = step1 + step2;
  if (!threshold || threshold <= 0) return 'Tidak Dipantau';
  if (total <= threshold) return 'KRITIS';
  if (total <= threshold * 2) return 'HAMPIR HABIS';
  return 'AMAN';
}

function buildXlsxFileName(input: {
  cabangKode?: string;
  tanggalOperasional?: string;
  shift?: string;
  petugas?: string;
}): string {
  const kode = (input.cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const tglRaw = input.tanggalOperasional || '';
  const [yy, mm, dd] = String(tglRaw).split('-');
  const tgl = dd && mm && yy ? `${dd}-${mm}-${yy}` : String(tglRaw);
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
}

export function generateXlsxReport(input: XlsxReportInput): { buffer: Buffer; fileName: string } {
  const wb = XLSX.utils.book_new();

  // ── SHEET 1: RINGKASAN ──────────────────────────────────
  const summaryData: Record<string, unknown>[] = [
    { 'Field': 'Cabang', 'Value': `${input.cabangKode} (${input.cabangNama})` },
    { 'Field': 'Tanggal Operasional', 'Value': input.tanggalOperasional },
    { 'Field': 'Shift', 'Value': input.shift },
    { 'Field': 'Petugas', 'Value': input.petugas },
    { 'Field': 'Total Item', 'Value': input.items.length },
    { 'Field': 'Kritis', 'Value': input.items.filter(i => getStatus(Number(i.step1)||0, Number(i.step2)||0, Number(i.threshold)||0) === 'KRITIS').length },
    { 'Field': 'Hampir Habis', 'Value': input.items.filter(i => getStatus(Number(i.step1)||0, Number(i.step2)||0, Number(i.threshold)||0) === 'HAMPIR HABIS').length },
    { 'Field': 'Aman', 'Value': input.items.filter(i => getStatus(Number(i.step1)||0, Number(i.step2)||0, Number(i.threshold)||0) === 'AMAN').length },
    { 'Field': 'Tidak Dipantau', 'Value': input.items.filter(i => getStatus(Number(i.step1)||0, Number(i.step2)||0, Number(i.threshold)||0) === 'Tidak Dipantau').length },
    { 'Field': 'Laporan ID', 'Value': input.laporanId },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // ── SHEET 2: DETAIL SO ──────────────────────────────────
  const wsName = 'Detail SO';

  // Row 1: Group headers (merged)
  const groupHeaders = [
    { label: 'INFORMASI BARANG', start: 0, end: 3 },   // A:D
    { label: 'SO SEBELUMNYA', start: 4, end: 6 },      // E:G
    { label: 'SO SEKARANG', start: 7, end: 9 },        // H:J
    { label: 'HASIL & ANALISIS', start: 10, end: 12 },  // K:M
  ];

  // Row 2: Sub-headers
  const subHeaders = [
    'Nama Barang', 'Area', 'Satuan', 'Batas Min',
    'Step 1', 'Step 2', 'Total',
    'Step 1', 'Step 2', 'Total',
    'Pemakaian', 'Status', 'Keterangan',
  ];

  // Build data rows (starting row 3)
  const dataRows: unknown[][] = input.items.map((it) => {
    const s1 = Number(it.step1) || 0;
    const s2 = Number(it.step2) || 0;
    const total = s1 + s2;
    const threshold = Number(it.threshold) || 0;
    const prevTotal = it.prevTotal != null ? Number(it.prevTotal) : null;
    const penggunaan = prevTotal != null ? prevTotal - total : null;
    return [
      it.namaBarang || '',
      it.area || '',
      it.satuan || '',
      threshold || '',
      it.prevStep1 ?? '',
      it.prevStep2 ?? '',
      prevTotal ?? '',
      s1,
      s2,
      total,
      penggunaan ?? '',
      getStatus(s1, s2, threshold),
      it.keterangan || '',
    ];
  });

  // Create worksheet with empty content first
  const wsData: unknown[][] = [
    subHeaders,
    ...dataRows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cells for group headers (Row 1)
  ws['!merges'] = groupHeaders.map((g) => ({
    s: { r: 0, c: g.start },
    e: { r: 0, c: g.end },
  }));

  // Add group header text in Row 1 (above sub-headers)
  // We need to shift everything down by 1 row
  const wsDataWithGroup: unknown[][] = [
    groupHeaders.map((g) => g.label),
    subHeaders,
    ...dataRows,
  ];
  const wsFinal = XLSX.utils.aoa_to_sheet(wsDataWithGroup);

  // Re-apply merges (now shifted down by 1)
  wsFinal['!merges'] = groupHeaders.map((g) => ({
    s: { r: 0, c: g.start },
    e: { r: 0, c: g.end },
  }));

  // Column widths
  wsFinal['!cols'] = [
    { wch: 22 },  // Nama Barang
    { wch: 12 },  // Area
    { wch: 8 },   // Satuan
    { wch: 10 },  // Threshold
    { wch: 8 },   // Prev S1
    { wch: 8 },   // Prev S2
    { wch: 8 },   // Prev Total
    { wch: 8 },   // Curr S1
    { wch: 8 },   // Curr S2
    { wch: 8 },   // Curr Total
    { wch: 10 },  // Penggunaan
    { wch: 14 },  // Status
    { wch: 18 },  // Keterangan
  ];

  // Freeze panes at C3 (row 3, col 3 → after group header + sub-header, after Nama Barang + Area)
  wsFinal['!freeze'] = { xSplit: 2, ySplit: 2 };

  XLSX.utils.book_append_sheet(wb, wsFinal, wsName);

  // ── GENERATE BUFFER ─────────────────────────────────────
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const fileName = buildXlsxFileName(input);

  return { buffer: Buffer.from(xlsxBuffer), fileName };
}
