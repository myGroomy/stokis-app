// app/api/so/[laporanId]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, assertCabangAccess } from '@/lib/auth';
import { resolveCabang } from '@/lib/google/registry';
import { uploadPdfToDrive } from '@/lib/google/drive';
import { updateLaporanPdfLink } from '@/lib/domain/laporan-service';
import { generateSOReportPdf, type SOReportItem } from '@/lib/domain/pdf-report';

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

  const { buffer, fileName } = await generateSOReportPdf({
    laporanId,
    cabangNama,
    cabangKode,
    tanggalOperasional,
    shift,
    petugas,
    items: (Array.isArray(items) ? items : []) as SOReportItem[],
    previousSOInfo,
    waktuDibuat: new Date(),
  });

  // Catat link PDF ke Laporan_PDF — SELALU dicatat, baik berhasil upload ke
  // Drive maupun fallback link dari aplikasi sendiri.
  const keySesi = typeof sesiId === 'string' && sesiId ? sesiId : laporanId;
  let pdfLink = '';

  try {
    const { folderId } = await resolveCabang(cabangId);
    if (folderId) {
      const res = await uploadPdfToDrive(folderId, fileName, buffer);
      pdfLink = res.webViewLink || res.downloadUrl;
    }
  } catch {
    // Service account umumnya tanpa kuota Drive → fallback ke link aplikasi.
    pdfLink = '';
  }

  if (!pdfLink) {
    const origin = req.nextUrl?.origin || process.env.APP_URL || '';
    pdfLink = `${origin}/api/so/${encodeURIComponent(laporanId)}/pdf-file?cabang=${encodeURIComponent(cabangId)}`;
  }

  try {
    await updateLaporanPdfLink(cabangId, keySesi, laporanId, pdfLink);
  } catch {
    // non-critical
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
});