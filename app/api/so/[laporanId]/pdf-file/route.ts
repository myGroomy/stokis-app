// app/api/so/[laporanId]/pdf-file/route.ts
// Sajikan PDF laporan secara publik berdasarkan data tersimpan di spreadsheet
// (Laporan_PDF + Laporan_SO + Daftar_Cabang). Dipakai sebagai link fallback
// bila upload ke Drive gagal (mis. service account tanpa kuota Drive).
import { NextRequest, NextResponse } from 'next/server';
import { resolveCabang } from '@/lib/google/registry';
import { readSheetData, sheetToObjects } from '@/lib/google/sheets';
import { generateSOReportPdf } from '@/lib/domain/pdf-report';

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

  // 1) Header laporan dari Laporan_PDF
  const laporanData = await readSheetData(spreadsheetId, 'Laporan_PDF');
  const laporanRows = sheetToObjects(laporanData.headers, laporanData.rows);
  const laporan = laporanRows.find((r) => String(r['Laporan_ID']) === laporanId);
  if (!laporan) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // 2) Detail item dari Laporan_SO (data perbandingan SO lama vs sekarang)
  const detailData = await readSheetData(spreadsheetId, 'Laporan_SO');
  const detailRows = sheetToObjects(detailData.headers, detailData.rows);
  const detail = detailRows.filter((r) => String(r['Laporan_ID']) === laporanId);

  if (detail.length === 0) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Detail laporan belum tersedia' } }, { status: 404 });
  }

  const items = detail.map((r) => ({
    itemId: String(r['Item_ID'] || ''),
    namaBarang: String(r['Nama_Barang'] || ''),
    satuan: String(r['Satuan'] || ''),
    area: String(r['Area'] || ''),
    threshold: Number(r['Threshold']) || 0,
    step1: Number(r['Step1']) || 0,
    step2: Number(r['Step2']) || 0,
    keterangan: String(r['Keterangan'] || ''),
    prevStep1: r['Prev_Step1'] != null && String(r['Prev_Step1']) !== '' ? Number(r['Prev_Step1']) : null,
    prevStep2: r['Prev_Step2'] != null && String(r['Prev_Step2']) !== '' ? Number(r['Prev_Step2']) : null,
    prevTotal: r['Prev_Total'] != null && String(r['Prev_Total']) !== '' ? Number(r['Prev_Total']) : null,
    prevTanggal: fmtDateValue(r['Prev_Tanggal']),
    prevShift: String(r['Prev_Shift'] || '') || null,
  }));

  const firstPrev = detail.find((r) => String(r['Prev_Tanggal'] || '').trim());
  const previousSOInfo = firstPrev
    ? { tanggal: fmtDateValue(firstPrev['Prev_Tanggal']), shift: String(firstPrev['Prev_Shift'] || '') }
    : null;

  const { buffer, fileName } = await generateSOReportPdf({
    laporanId,
    cabangNama: String(cabang['Nama_Cabang'] || cabangId),
    cabangKode: cabangId,
    tanggalOperasional: fmtDateValue(laporan['Tanggal_Operasional']),
    shift: String(laporan['Shift'] || ''),
    petugas: String(laporan['Petugas'] || ''),
    items,
    previousSOInfo,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

/**
 * Google Sheets menyimpan tanggal sebagai serial number (mis. 46266) atau
 * string. Normalkan menjadi YYYY-MM-DD agar konsisten dengan input form.
 */
function fmtDateValue(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'number') {
    const ms = Math.round((v - 25569) * 86400000);
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) {
      return (
        `${d.getUTCFullYear()}-` +
        `${String(d.getUTCMonth() + 1).padStart(2, '0')}-` +
        `${String(d.getUTCDate()).padStart(2, '0')}`
      );
    }
    return String(v);
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return (
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return s;
}