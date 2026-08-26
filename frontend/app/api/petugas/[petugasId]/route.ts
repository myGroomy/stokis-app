// app/api/petugas/[petugasId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ petugasId: string }> }
) {
  const { petugasId } = await params;
  const body = await req.json();
  const { cabangId, ...payload } = body;
  const result = await callAppsScript('updatePetugas', cabangId, { petugasId, ...payload });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
