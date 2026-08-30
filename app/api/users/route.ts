import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';
import { withAuth, assertCabangAccess } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, _context, session) => {
  const { searchParams } = new URL(req.url);
  const cabangId = searchParams.get('cabang') || '';

  const guard = assertCabangAccess(session, cabangId);
  if (guard) return guard;

  const result = await callAppsScript('getUsers', cabangId);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const result = await callAppsScript('addUser', '', body);
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}, { requiredRole: 'admin' });
