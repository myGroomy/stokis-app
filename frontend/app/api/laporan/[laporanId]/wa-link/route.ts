// app/api/laporan/[laporanId]/wa-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ laporanId: string }> }
) {
  const { laporanId } = await params;
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';
  const result = await callAppsScript('getShareWhatsAppLink', cabangId, { laporanId });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
