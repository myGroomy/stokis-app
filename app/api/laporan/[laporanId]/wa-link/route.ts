// app/api/laporan/[laporanId]/wa-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';
import { withAuth, assertCabangAccess } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, { params }, session) => {
  const { laporanId } = await params;
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';

  const guard = assertCabangAccess(session, cabangId);
  if (guard) return guard;

  const result = await callAppsScript('getShareWhatsAppLink', cabangId, { laporanId });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
});
