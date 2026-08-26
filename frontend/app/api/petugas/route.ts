// app/api/petugas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';
  const result = await callAppsScript('getPetugasList', cabangId);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cabangId, ...payload } = body;
  const result = await callAppsScript('addPetugas', cabangId, payload);
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
