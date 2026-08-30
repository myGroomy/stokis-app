// app/api/dashboard/harian/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';
  const tanggal = searchParams.get('tanggal') || '';

  const result = await callAppsScript('getDashboardHarian', cabangId, { tanggal });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
});
