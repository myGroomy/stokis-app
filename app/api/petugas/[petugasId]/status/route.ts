// app/api/petugas/[petugasId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ petugasId: string }> }
) {
  const { petugasId } = await params;
  const body = await req.json();
  const { cabangId, aktif } = body;
  const result = await callAppsScript('setPetugasActive', cabangId, { petugasId, aktif });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
