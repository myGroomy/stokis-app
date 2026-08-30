// lib/appsscript.ts
// Berjalan di Server Function / API Routes Vercel

import { getEnv } from '@/lib/env';

const env = getEnv();
const APPS_SCRIPT_URL = env.APPS_SCRIPT_URL;
const API_KEY = env.STOKIS_API_KEY;
const REQUEST_TIMEOUT_MS = 120_000; // GAS cold start + write batch bisa lambat

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callAppsScript<T = any>(
  action: string,
  cabangId?: string,
  payload?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data as ApiResponse<T>;
    } catch {
      const isConsentPage = text.includes('consent') || text.includes('oauth_v2') || text.includes('ppConfig');
      const hint = isConsentPage
        ? ' | Deployment access mungkin belum "Anyone". Buka Apps Script Editor > Deploy > Manage deployments > Edit > Who has access: Anyone.'
        : '';
      return {
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Respon dari Apps Script bukan format JSON valid: ' + text.substring(0, 150) + hint }
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: err instanceof Error ? err.message : 'Gagal memanggil API Apps Script' }
    };
  }
}
