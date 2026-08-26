// app/api/dashboard/mingguan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';
  const dari = searchParams.get('dari') || '';
  const sampai = searchParams.get('sampai') || '';

  const result = await callAppsScript('getDashboardMingguan', cabangId, { dari, sampai });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
