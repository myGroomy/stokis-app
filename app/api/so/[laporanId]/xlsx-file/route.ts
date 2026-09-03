// app/api/so/[laporanId]/xlsx-file/route.ts
// Sajikan XLSX laporan secara publik berdasarkan data tersimpan di spreadsheet.
// Dipakai sebagai link fallback bila upload ke Drive gagal.
import { NextRequest, NextResponse } from 'next/server';
import { resolveCabang } from '@/lib/google/registry';
import { readSheetData, sheetToObjects } from '@/lib/google/sheets';
import * as ExcelJS from 'exceljs';

function fmtDateValue(v: unknown): string {
  const d = normalizeDate(v);
  if (!d) return String(v ?? '');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/** Normalkan serial number Google Sheets / ISO ke Date (origin 25569 = 1970-01-01). */
function normalizeDate(v: unknown): Date | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(v).trim();
  if (/^\d{5,6}$/.test(s)) {
    const d = new Date(Math.round((Number(s) - 25569) * 86400000));
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

import { parseThreshold } from '@/lib/domain/so';

function getStatus(step1: number, step2: number, threshold: number | null | undefined): string {
  const total = step1 + step2;
  if (threshold === null || threshold === undefined || isNaN(threshold) || threshold < 0) {
    return 'Tidak Dipantau';
  }
  if (total <= threshold) return 'Kritis';
  if (threshold > 0 && total <= threshold * 2) return 'Hampir Habis';
  return 'Aman';
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ laporanId: string }> }
) {
  const { laporanId } = await context.params;
  const cabangId = req.nextUrl?.searchParams.get('cabang') || '';

  if (!laporanId) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }
  if (!cabangId) {
    return NextResponse.json({ success: false, error: { code: 'CABANG_REQUIRED' } }, { status: 400 });
  }

  let spreadsheetId: string;
  let cabang;
  try {
    const resolved = await resolveCabang(cabangId);
    spreadsheetId = resolved.spreadsheetId;
    cabang = resolved.cabang;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  const cabangNama = String(cabang['Nama_Cabang'] || cabangId);
  const cabangKode = cabangId;

  // 1) Header laporan dari Laporan_PDF
  const laporanData = await readSheetData(spreadsheetId, 'Laporan_PDF');
  const laporanRows = sheetToObjects(laporanData.headers, laporanData.rows);
  const laporan = laporanRows.find((r) => String(r['Laporan_ID']) === laporanId);
  if (!laporan) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // 2) Detail item dari Laporan_SO
  const detailData = await readSheetData(spreadsheetId, 'Laporan_SO');
  const detailRows = sheetToObjects(detailData.headers, detailData.rows);
  const detail = detailRows.filter((r) => String(r['Laporan_ID']) === laporanId);

  if (detail.length === 0) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Detail laporan belum tersedia' } }, { status: 404 });
  }

  const tanggalOperasional = fmtDateValue(laporan['Tanggal_Operasional']);
  const shift = String(laporan['Shift'] || '');
  const petugas = String(laporan['Petugas'] || '');
  const prevTanggal = detail[0]?.['Prev_Tanggal'] ? fmtDateValue(detail[0]['Prev_Tanggal']) : '';
  const prevShift = String(detail[0]?.['Prev_Shift'] || '');

  // Build XLSX rows
  const items = detail.map((r, idx) => {
    const step1 = Number(r['Step1']) || 0;
    const step2 = Number(r['Step2']) || 0;
    const total = step1 + step2;
    const threshold = parseThreshold(r['Threshold']);
    const prevTotal = r['Prev_Total'] != null && String(r['Prev_Total']) !== '' ? Number(r['Prev_Total']) : null;
    const penggunaan = prevTotal != null ? prevTotal - total : null;
    return {
      'No': idx + 1,
      'Nama Barang': String(r['Nama_Barang'] || ''),
      'Area': String(r['Area'] || ''),
      'Satuan': String(r['Satuan'] || ''),
      'Batas Min': threshold != null ? threshold : '',
      'SO Sebelumnya (S1)': r['Prev_Step1'] != null && String(r['Prev_Step1']) !== '' ? Number(r['Prev_Step1']) : '',
      'SO Sebelumnya (S2)': r['Prev_Step2'] != null && String(r['Prev_Step2']) !== '' ? Number(r['Prev_Step2']) : '',
      'SO Sebelumnya (Total)': prevTotal ?? '',
      'Tanggal SO Sebelumnya': (r['Prev_Tanggal'] ? fmtDateValue(r['Prev_Tanggal']) : '') || prevTanggal,
      'Shift SO Sebelumnya': String(r['Prev_Shift'] || '') || prevShift,
      'SO Sekarang (S1)': step1,
      'SO Sekarang (S2)': step2,
      'SO Sekarang (Total)': total,
      'Penggunaan': penggunaan ?? '',
      'Keterangan Sebelumnya': String(r['Prev_Keterangan'] || ''),
      'Keterangan': String(r['Keterangan'] || ''),
      'Status': getStatus(step1, step2, threshold),
    };
  });

  const wb = new ExcelJS.Workbook();

  const summaryData: { Field: string; Value: unknown }[] = [
    { Field: 'Cabang', Value: cabangNama },
    { Field: 'Kode Cabang', Value: cabangKode },
    { Field: 'Tanggal Operasional', Value: tanggalOperasional },
    { Field: 'Shift', Value: shift },
    { Field: 'Petugas', Value: petugas },
    { Field: 'Total Item', Value: items.length },
    { Field: 'Laporan ID', Value: laporanId },
    { Field: 'Waktu Dibuat', Value: new Date().toLocaleString('id-ID') },
  ];
  const wsSummary = wb.addWorksheet('Ringkasan');
  wsSummary.columns = [{ header: 'Field', key: 'Field', width: 24 }, { header: 'Value', key: 'Value', width: 40 }];
  summaryData.forEach((r) => wsSummary.addRow(r));

  if (items.length > 0) {
    const wsDetail = wb.addWorksheet('Detail SO');
    const first = items[0];
    const keys = Object.keys(first);
    wsDetail.columns = keys.map((k) => ({
      header: k,
      key: k,
      width: Math.max(k.length + 2, ...items.map((r) => String((r as Record<string, unknown>)[k] ?? '').length + 2)),
    }));
    items.forEach((r) => wsDetail.addRow(r as Record<string, unknown>));
  }

  const xlsxBuffer = await wb.xlsx.writeBuffer();
  const raw = new Uint8Array(xlsxBuffer);
  const byteArray = new Uint8Array(raw.byteLength);
  byteArray.set(raw);
  const kode = cabangKode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const tgl = /^\d{2}\/\d{2}\/\d{4}$/.test(tanggalOperasional)
    ? tanggalOperasional.split('/').join('-')
    : tanggalOperasional;
  const shiftLabel = (shift || 'SO').toUpperCase();
  const petugasLabel = petugas.replace(/[/\\:*?"<>|]/g, '').trim() || 'Petugas';
  const fileName = `${kode} - ${tgl} - ${shiftLabel} - ${petugasLabel}.xlsx`;

  return new NextResponse(byteArray, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
