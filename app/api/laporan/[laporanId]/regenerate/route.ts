// app/api/laporan/[laporanId]/regenerate/route.ts
// Regenerate XLSX untuk laporan yang sudah ada berdasarkan data di Laporan_SO.
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, assertCabangAccess } from '@/lib/auth';
import { resolveCabang } from '@/lib/google/registry';
import { uploadFileToGASDrive } from '@/lib/appsscript';
import { updateLaporanXlsxLink, getLaporanById, getLaporanDetail } from '@/lib/domain/laporan-service';
import { generateXlsxReport, type XlsxItem } from '@/lib/domain/xlsx-report';

export const POST = withAuth(async (req: NextRequest, { params }, session) => {
  const { laporanId } = await params;
  const body = await req.json().catch(() => ({}));
  const cabangId = typeof body.cabangId === 'string' ? body.cabangId : '';

  if (!cabangId) {
    return NextResponse.json(
      { success: false, error: { code: 'CABANG_REQUIRED', message: 'Parameter cabangId wajib disertakan' } },
      { status: 400 }
    );
  }

  const guard = assertCabangAccess(session, cabangId);
  if (guard) return guard;

  // 1. Read laporan metadata
  const laporan = await getLaporanById(cabangId, laporanId);
  if (!laporan) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Laporan ' + laporanId + ' tidak ditemukan' } },
      { status: 404 }
    );
  }

  // 2. Read detail items from Laporan_SO
  const detailRows = await getLaporanDetail(cabangId, laporanId);
  if (detailRows.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_DETAIL', message: 'Detail item laporan tidak ditemukan di Laporan_SO' } },
      { status: 404 }
    );
  }

  // 3. Resolve cabang info
  const { folderId, cabang } = await resolveCabang(cabangId);
  const cabangNama = String(cabang['Nama_Cabang'] || '');
  const cabangKode = String(cabang['Cabang_ID'] || '');
  const tanggalOperasional = String(laporan['Tanggal_Operasional'] || '');
  const shift = String(laporan['Shift'] || '');
  const petugas = String(laporan['Petugas'] || '');
  const sesiId = String(laporan['Sesi_ID'] || '');

  // 4. Map detail rows to XlsxItem[]
  const items: XlsxItem[] = detailRows.map((r) => ({
    itemId: String(r['Item_ID'] || ''),
    namaBarang: String(r['Nama_Barang'] || ''),
    satuan: String(r['Satuan'] || ''),
    area: String(r['Area'] || ''),
    threshold: Number(r['Threshold']) || 0,
    step1: Number(r['Step1']) || 0,
    step2: Number(r['Step2']) || 0,
    keterangan: String(r['Keterangan'] || ''),
    prevStep1: r['Prev_Step1'] != null && r['Prev_Step1'] !== '' ? Number(r['Prev_Step1']) : null,
    prevStep2: r['Prev_Step2'] != null && r['Prev_Step2'] !== '' ? Number(r['Prev_Step2']) : null,
    prevTotal: r['Prev_Total'] != null && r['Prev_Total'] !== '' ? Number(r['Prev_Total']) : null,
  }));

  const previousSOInfo = {
    tanggal: detailRows[0]?.['Prev_Tanggal'] ? String(detailRows[0]['Prev_Tanggal']) : '',
    shift: detailRows[0]?.['Prev_Shift'] ? String(detailRows[0]['Prev_Shift']) : '',
  };

  const results: { xlsx?: string; error?: string } = {};

  // 5. Generate XLSX
  try {
    const { buffer, fileName } = await generateXlsxReport({
      laporanId,
      cabangNama,
      cabangKode,
      tanggalOperasional,
      shift,
      petugas,
      items,
      previousSOInfo,
    });

    let xlsxLink = '';
    if (folderId) {
      try {
        const res = await uploadFileToGASDrive({ folderId, fileName, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer });
        xlsxLink = res.webViewLink || res.downloadUrl;
      } catch (err) {
        console.error('[Regenerate] XLSX GAS upload gagal:', err);
      }
    }
    if (!xlsxLink) {
      const origin = req.nextUrl?.origin || process.env.APP_URL || '';
      xlsxLink = `${origin}/api/so/${encodeURIComponent(laporanId)}/xlsx-file?cabang=${encodeURIComponent(cabangId)}`;
    }
    await updateLaporanXlsxLink(cabangId, sesiId || laporanId, laporanId, xlsxLink);
    results.xlsx = xlsxLink;
  } catch (err) {
    results.error = 'XLSX: ' + (err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({ success: true, data: results });
});
