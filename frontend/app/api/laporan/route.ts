// app/api/laporan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';
  const tanggal = searchParams.get('tanggal') || '';
  const shift = searchParams.get('shift') || '';
  const petugas = searchParams.get('petugas') || '';

  const result = await callAppsScript('searchLaporan', cabangId, { tanggal, shift, petugas });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
