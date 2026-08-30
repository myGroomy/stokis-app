// app/api/laporan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';
import { withAuth, assertCabangAccess } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, _ctx, session) => {
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';
  const tanggal = searchParams.get('tanggal') || '';
  const shift = searchParams.get('shift') || '';
  const petugas = searchParams.get('petugas') || '';

  const guard = assertCabangAccess(session, cabangId);
  if (guard) return guard;

  const result = await callAppsScript('searchLaporan', cabangId, { tanggal, shift, petugas });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
});
