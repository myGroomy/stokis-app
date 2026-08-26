// app/api/so/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cabangId, ...payload } = body;
  const result = await callAppsScript('submitSO', cabangId, payload);
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
