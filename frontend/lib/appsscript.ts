// lib/appsscript.ts
// Berjalan di Server Function / API Routes Vercel

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';
const API_KEY = process.env.STOKIS_API_KEY || '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function callAppsScript<T = any>(
  action: string,
  cabangId?: string,
  payload?: Record<string, any>
): Promise<ApiResponse<T>> {
  if (!APPS_SCRIPT_URL) {
    return {
      success: false,
      error: { code: 'CONFIG_ERROR', message: 'APPS_SCRIPT_URL belum dikonfigurasi di Environment Variable' }
    };
  }

  try {
    const body: Record<string, any> = {
      'x-api-key': API_KEY,
      action: action,
    };
    if (cabangId) body.cabangId = cabangId;
    if (payload) body.payload = payload;

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data as ApiResponse<T>;
    } catch {
      return {
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Respon dari Apps Script bukan format JSON valid: ' + text.substring(0, 100) }
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: err.message || 'Gagal memanggil API Apps Script' }
    };
  }
}
