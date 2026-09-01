// app/api/so/[laporanId]/xlsx/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, assertCabangAccess } from '@/lib/auth';
import { resolveCabang } from '@/lib/google/registry';
import { updateLaporanXlsxLink } from '@/lib/domain/laporan-service';
import { uploadFileToGASDrive } from '@/lib/appsscript';
import { generateXlsxReport } from '@/lib/domain/xlsx-report';

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

  const { buffer, fileName } = await generateXlsxReport({
    laporanId,
    cabangNama,
    cabangKode,
    tanggalOperasional,
    shift,
    petugas,
    items: Array.isArray(items) ? items : [],
    previousSOInfo,
  });

  // Upload to Drive via GAS
  const keySesi = typeof sesiId === 'string' && sesiId ? sesiId : laporanId;
  let xlsxLink = '';

  try {
    const { folderId } = await resolveCabang(cabangId);
    if (folderId) {
      const res = await uploadFileToGASDrive({
        folderId,
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer,
      });
      xlsxLink = res.webViewLink || res.downloadUrl;
    }
  } catch (err) {
    console.error('[XLSX] GAS upload gagal, fallback ke xlsx-file:', err);
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

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
});
