// app/api/cabang/[cabangId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cabangId: string }> }
) {
  const { cabangId } = await params;
  const body = await req.json();
  const result = await callAppsScript('setCabangActive', cabangId, body);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
