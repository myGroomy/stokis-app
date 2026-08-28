// app/api/so/previous/route.ts
import { NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsscript';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cabangId = searchParams.get('cabang');

    if (!cabangId) {
      return NextResponse.json(
        { success: false, error: { message: 'Parameter cabang wajib disertakan' } },
        { status: 400 }
      );
    }

    const result = await callAppsScript('getPreviousSO', cabangId);

    if (result.success) {
      // GAS returns { latest: {...}, items: {...}, history: [...] }
      return NextResponse.json({
        success: true,
        data: {
          latest: result.data?.latest || null,
          items: result.data?.items || {},
          history: result.data?.history || [],
        },
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: 'Gagal mengambil data SO sebelumnya: ' + err.message } },
      { status: 500 }
    );
  }
}
