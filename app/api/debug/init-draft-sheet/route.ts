// app/api/debug/init-draft-sheet/route.ts
// Debug route untuk langsung membuat sheet SO_Draft di Registry Spreadsheet via Google Sheets API
import { NextResponse } from 'next/server';
import { ensureSheet } from '@/lib/google/sheets';

export async function GET() {
  try {
    const registryId = process.env.REGISTRY_SPREADSHEET_ID;
    if (!registryId) {
      return NextResponse.json({ success: false, error: 'REGISTRY_SPREADSHEET_ID belum dikonfigurasi di env' }, { status: 500 });
    }

    const headers = ['Username', 'Cabang_ID', 'Shift', 'Draft_JSON', 'Updated_At'];
    await ensureSheet(registryId, 'SO_Draft', headers);

    return NextResponse.json({
      success: true,
      message: 'Sheet SO_Draft berhasil diperiksa / dibuat di Registry Spreadsheet!',
      registryId,
      headers,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
