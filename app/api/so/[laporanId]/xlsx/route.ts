// app/api/so/[laporanId]/xlsx/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, assertCabangAccess } from '@/lib/auth';
import { resolveCabang } from '@/lib/google/registry';
import { uploadXlsxToDrive } from '@/lib/google/drive';
import { updateLaporanXlsxLink } from '@/lib/domain/laporan-service';
import * as XLSX from 'xlsx';

interface XlsxItem {
  itemId?: string;
  namaBarang?: string;
  satuan?: string;
  area?: string;
  threshold?: number;
  step1?: number;
  step2?: number;
  keterangan?: string;
  prevStep1?: number | null;
  prevStep2?: number | null;
  prevTotal?: number | null;
  prevTanggal?: string | null;
  prevShift?: string | null;
}

function getStatus(item: XlsxItem): string {
  const total = (Number(item.step1) || 0) + (Number(item.step2) || 0);
  const threshold = Number(item.threshold) || 0;
  if (!threshold || threshold <= 0) return 'Tidak Dipantau';
  if (total <= threshold) return 'Kritis';
  if (total <= threshold * 2) return 'Hampir Habis';
  return 'Aman';
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

export const POST = withAuth(async (req: NextRequest, { params }, session) => {
  const { laporanId } = await params;
  const body = await req.json();
  const { items, cabangId, cabangNama, cabangKode, tanggalOperasional, shift, petugas, previousSOInfo, sesiId } = body;

  if (!cabangId || typeof cabangId !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'CABANG_REQUIRED', message: 'Parameter cabangId wajib disertakan' } },
      { status: 400 }
    );
  }

  const guard = assertCabangAccess(session, cabangId);
  if (guard) return guard;

  const itemList: XlsxItem[] = Array.isArray(items) ? items : [];
  const prevTanggal = previousSOInfo?.tanggal || '';
  const prevShift = previousSOInfo?.shift || '';

  // Build worksheet data
  const rows: Record<string, unknown>[] = itemList.map((it, idx) => {
    const step1 = Number(it.step1) || 0;
    const step2 = Number(it.step2) || 0;
    const total = step1 + step2;
    const prevTotal = it.prevTotal != null ? Number(it.prevTotal) : null;
    const penggunaan = prevTotal != null ? prevTotal - total : null;
    const status = getStatus(it);
    return {
      'No': idx + 1,
      'Nama Barang': it.namaBarang || '',
      'Area': it.area || '',
      'Satuan': it.satuan || '',
      'Batas Min': it.threshold || '',
      'SO Sebelumnya (S1)': it.prevStep1 ?? '',
      'SO Sebelumnya (S2)': it.prevStep2 ?? '',
      'SO Sebelumnya (Total)': prevTotal ?? '',
      'Tanggal SO Sebelumnya': (it.prevTanggal || prevTanggal) || '',
      'Shift SO Sebelumnya': (it.prevShift || prevShift) || '',
      'SO Sekarang (S1)': step1,
      'SO Sekarang (S2)': step2,
      'SO Sekarang (Total)': total,
      'Penggunaan': penggunaan ?? '',
      'Keterangan': it.keterangan || '',
      'Status': status,
    };
  });

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData: Record<string, unknown>[] = [
    { 'Field': 'Cabang', 'Value': cabangNama || '' },
    { 'Field': 'Kode Cabang', 'Value': cabangKode || '' },
    { 'Field': 'Tanggal Operasional', 'Value': tanggalOperasional || '' },
    { 'Field': 'Shift', 'Value': shift || '' },
    { 'Field': 'Petugas', 'Value': petugas || '' },
    { 'Field': 'Total Item', 'Value': itemList.length },
    { 'Field': 'Jumlah Kritis', 'Value': itemList.filter(i => getStatus(i) === 'Kritis').length },
    { 'Field': 'Jumlah Hampir Habis', 'Value': itemList.filter(i => getStatus(i) === 'Hampir Habis').length },
    { 'Field': 'Jumlah Aman', 'Value': itemList.filter(i => getStatus(i) === 'Aman').length },
    { 'Field': 'Jumlah Tidak Dipantau', 'Value': itemList.filter(i => getStatus(i) === 'Tidak Dipantau').length },
    { 'Field': 'Laporan ID', 'Value': laporanId || '' },
    { 'Field': 'Waktu Dibuat', 'Value': new Date().toLocaleString('id-ID') },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Detail sheet
  if (rows.length > 0) {
    const wsDetail = XLSX.utils.json_to_sheet(rows);
    // Auto-width columns
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length + 2, ...rows.map((r) => String(r[key] ?? '').length + 2)),
    }));
    wsDetail['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail SO');
  }

  // Generate buffer
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const fileName = buildXlsxFileName({ cabangKode, tanggalOperasional, shift, petugas });

  // Upload to Drive
  const keySesi = typeof sesiId === 'string' && sesiId ? sesiId : laporanId;
  let xlsxLink = '';

  try {
    const { folderId } = await resolveCabang(cabangId);
    if (folderId) {
      const res = await uploadXlsxToDrive(folderId, fileName, Buffer.from(xlsxBuffer));
      xlsxLink = res.webViewLink || res.downloadUrl;
    }
  } catch {
    xlsxLink = '';
  }

  if (!xlsxLink) {
    const origin = req.nextUrl?.origin || process.env.APP_URL || '';
    xlsxLink = `${origin}/api/so/${encodeURIComponent(laporanId)}/xlsx-file?cabang=${encodeURIComponent(cabangId)}`;
  }

  try {
    await updateLaporanXlsxLink(cabangId, keySesi, laporanId, xlsxLink);
  } catch {
    // non-critical
  }

  return new NextResponse(new Uint8Array(xlsxBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
});
