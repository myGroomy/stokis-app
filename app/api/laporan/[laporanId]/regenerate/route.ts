// app/api/laporan/[laporanId]/regenerate/route.ts
// Regenerate PDF & XLSX untuk laporan yang sudah ada berdasarkan data di Laporan_SO.
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, assertCabangAccess } from '@/lib/auth';
import { resolveCabang } from '@/lib/google/registry';
import { uploadPdfToDrive, uploadXlsxToDrive } from '@/lib/google/drive';
import { updateLaporanPdfLink, updateLaporanXlsxLink, getLaporanById, getLaporanDetail } from '@/lib/domain/laporan-service';
import { generateSOReportPdf, type SOReportItem } from '@/lib/domain/pdf-report';
import * as XLSX from 'xlsx';

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

  // 4. Map detail rows to SOReportItem[]
  const items: SOReportItem[] = detailRows.map((r) => ({
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
    prevTanggal: r['Prev_Tanggal'] ? String(r['Prev_Tanggal']) : null,
    prevShift: r['Prev_Shift'] ? String(r['Prev_Shift']) : null,
  }));

  const previousSOInfo = {
    tanggal: detailRows[0]?.['Prev_Tanggal'] ? String(detailRows[0]['Prev_Tanggal']) : '',
    shift: detailRows[0]?.['Prev_Shift'] ? String(detailRows[0]['Prev_Shift']) : '',
  };

  const results: { pdf?: string; xlsx?: string; error?: string } = {};

  // 5. Generate PDF
  try {
    const { buffer, fileName } = await generateSOReportPdf({
      laporanId,
      cabangNama,
      cabangKode,
      tanggalOperasional,
      shift,
      petugas,
      items,
      previousSOInfo,
      waktuDibuat: new Date(),
    });

    let pdfLink = '';
    if (folderId) {
      try {
        const res = await uploadPdfToDrive(folderId, fileName, buffer);
        pdfLink = res.webViewLink || res.downloadUrl;
      } catch (err) {
        console.error('[Regenerate] PDF Drive upload gagal:', err);
      }
    }
    if (!pdfLink) {
      const origin = req.nextUrl?.origin || process.env.APP_URL || '';
      pdfLink = `${origin}/api/so/${encodeURIComponent(laporanId)}/pdf-file?cabang=${encodeURIComponent(cabangId)}`;
    }

    await updateLaporanPdfLink(cabangId, sesiId || laporanId, laporanId, pdfLink);
    results.pdf = pdfLink;
  } catch (err) {
    results.error = 'PDF: ' + (err instanceof Error ? err.message : String(err));
  }

  // 6. Generate XLSX
  try {
    const prevTanggal = previousSOInfo.tanggal;
    const prevShift = previousSOInfo.shift;

    const xlsxRows: Record<string, unknown>[] = items.map((it, idx) => {
      const step1 = Number(it.step1) || 0;
      const step2 = Number(it.step2) || 0;
      const total = step1 + step2;
      const prevTotal = it.prevTotal != null ? Number(it.prevTotal) : null;
      const penggunaan = prevTotal != null ? prevTotal - total : null;
      const threshold = Number(it.threshold) || 0;
      let status = 'Tidak Dipantau';
      if (threshold > 0) {
        if (total <= threshold) status = 'Kritis';
        else if (total <= threshold * 2) status = 'Hampir Habis';
        else status = 'Aman';
      }
      return {
        'No': idx + 1,
        'Nama Barang': it.namaBarang || '',
        'Area': it.area || '',
        'Satuan': it.satuan || '',
        'Batas Min': threshold || '',
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

    const wb = XLSX.utils.book_new();
    const summaryData: Record<string, unknown>[] = [
      { 'Field': 'Cabang', 'Value': cabangNama },
      { 'Field': 'Kode Cabang', 'Value': cabangKode },
      { 'Field': 'Tanggal Operasional', 'Value': tanggalOperasional },
      { 'Field': 'Shift', 'Value': shift },
      { 'Field': 'Petugas', 'Value': petugas },
      { 'Field': 'Total Item', 'Value': items.length },
      { 'Field': 'Jumlah Kritis', 'Value': items.filter(i => { const t = (Number(i.step1)||0)+(Number(i.step2)||0); const th = Number(i.threshold)||0; return th>0 && t<=th; }).length },
      { 'Field': 'Jumlah Hampir Habis', 'Value': items.filter(i => { const t = (Number(i.step1)||0)+(Number(i.step2)||0); const th = Number(i.threshold)||0; return th>0 && t>th && t<=th*2; }).length },
      { 'Field': 'Jumlah Aman', 'Value': items.filter(i => { const t = (Number(i.step1)||0)+(Number(i.step2)||0); const th = Number(i.threshold)||0; return th>0 && t>th*2; }).length },
      { 'Field': 'Jumlah Tidak Dipantau', 'Value': items.filter(i => !(Number(i.threshold)||0)).length },
      { 'Field': 'Laporan ID', 'Value': laporanId },
      { 'Field': 'Waktu Dibuat', 'Value': new Date().toLocaleString('id-ID') },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Ringkasan');

    if (xlsxRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(xlsxRows);
      ws['!cols'] = Object.keys(xlsxRows[0]).map((k) => ({
        wch: Math.max(k.length + 2, ...xlsxRows.map((r) => String(r[k] ?? '').length + 2)),
      }));
      XLSX.utils.book_append_sheet(wb, ws, 'Detail SO');
    }

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const kode = cabangKode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const [yy, mm, dd] = tanggalOperasional.split('-');
    const tgl = dd && mm && yy ? `${dd}-${mm}-${yy}` : tanggalOperasional;
    const xlsxFileName = `${kode} - ${tgl} - ${shift.toUpperCase()} - ${petugas.replace(/[/\\:*?"<>|]/g, '').trim()}.xlsx`;

    let xlsxLink = '';
    if (folderId) {
      try {
        const res = await uploadXlsxToDrive(folderId, xlsxFileName, Buffer.from(xlsxBuffer));
        xlsxLink = res.webViewLink || res.downloadUrl;
      } catch (err) {
        console.error('[Regenerate] XLSX Drive upload gagal:', err);
      }
    }
    if (!xlsxLink) {
      const origin = req.nextUrl?.origin || process.env.APP_URL || '';
      xlsxLink = `${origin}/api/so/${encodeURIComponent(laporanId)}/xlsx-file?cabang=${encodeURIComponent(cabangId)}`;
    }

    await updateLaporanXlsxLink(cabangId, sesiId || laporanId, laporanId, xlsxLink);
    results.xlsx = xlsxLink;
  } catch (err) {
    results.error = (results.error ? results.error + '; ' : '') + 'XLSX: ' + (err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({ success: true, data: results });
});
