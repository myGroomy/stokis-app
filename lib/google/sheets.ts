// lib/google/sheets.ts
// Operasi CRUD dasar Google Sheets API v4 — pengganti fungsi helper GAS
// seperti sheetToObjects_, appendRow, setValues, getLastRow, getRange.

import { getSheetsClient } from './client';

export interface SheetData {
  headers: string[];
  rows: unknown[][];
}

/**
 * Baca seluruh data sebuah sheet dan kembalikan sebagai { headers, rows }.
 * Baris kosong (tanpa nilai di semua sel) dihilangkan agar konsisten dengan
 * sheetToObjects_ yang mengabaikan baris kosong.
 */
export async function readSheetData(
  spreadsheetId: string,
  range: string
): Promise<SheetData> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const values = res.data.values || [];
  if (values.length === 0) return { headers: [], rows: [] };

  const headers = (values[0] || []).map((h) => String(h).trim());
  const rows = values
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ''));
  return { headers, rows };
}

/**
 * Konversi { headers, rows } menjadi array objek dengan kunci = header.
 * Mirip sheetToObjects_ di GAS.
 */
export function sheetToObjects(headers: string[], rows: unknown[][]): Record<string, unknown>[] {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

/**
 * Cari index baris (0-based di dalam rows, di mana row[0] = baris data pertama
 * setelah header) berdasarkan nilai pada kolom tertentu. Mengembalikan
 * { index, row }. index = -1 bila tidak ditemukan.
 */
export function findRowIndex(
  rows: unknown[][],
  columnIndex: number,
  value: string
): { index: number; row: unknown[] | null } {
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][columnIndex]) === value) {
      return { index: i, row: rows[i] };
    }
  }
  return { index: -1, row: null };
}

/** Ambil nilai satu sel. */
export async function getCellValue(
  spreadsheetId: string,
  range: string
): Promise<unknown> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const values = res.data.values || [];
  return values[0]?.[0];
}

/**
 * Tulis satu baris penuh (1 row, N columns) ke posisi tertentu.
 * Index 1-based seperti spreadsheets API.
 */
export async function writeRow(
  spreadsheetId: string,
  range: string,
  row: unknown[]
): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

/** Set nilai satu sel. */
export async function setCellValue(
  spreadsheetId: string,
  range: string,
  value: unknown
): Promise<void> {
  await writeRow(spreadsheetId, range, [value]);
}

/**
 * Append beberapa baris sekaligus ke bagian bawah sheet (batch write).
 * Mempertahankan pola `setValues` 1 batch daripada 1 write per baris.
 */
export async function appendRows(
  spreadsheetId: string,
  sheetName: string,
  rows: unknown[][]
): Promise<void> {
  if (rows.length === 0) return;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
}
