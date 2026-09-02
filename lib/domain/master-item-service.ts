// lib/domain/master-item-service.ts
// Operasi Master Item — port dari MasterItem.js.

import { resolveCabang } from '@/lib/google/registry';
import { readSheetData, sheetToObjects, findRowIndex, appendRows, writeRow } from '@/lib/google/sheets';
import { ApiError } from './errors';
import { randomToken, buildItemId } from './ids';

import { parseThreshold } from './so';

export interface MasterItemPayload {
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Konversi_Isi?: string;
  Konversi_Keterangan?: string;
  Threshold?: number;
}

export async function getMasterItems(cabangId: string) {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const { headers, rows } = await readSheetData(spreadsheetId, 'Master_Item');
  const list = sheetToObjects(headers, rows);
  return list
    .filter((r) => r['Aktif'] === true || r['Aktif'] === 'true' || r['Aktif'] === 'TRUE' || r['Aktif'] === 'True')
    .map((r) => ({
      ...r,
      Threshold: parseThreshold(r['Threshold']),
    }));
}

export async function addItem(cabangId: string, payload: MasterItemPayload): Promise<{ itemId: string }> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const itemId = buildItemId(randomToken(6));
  await appendRows(spreadsheetId, 'Master_Item', [[
    itemId,
    payload.Nama_Barang,
    payload.Area,
    payload.Satuan,
    payload.Konversi_Isi || '',
    payload.Konversi_Keterangan || '',
    parseThreshold(payload.Threshold),
    true,
    new Date(),
  ]]);
  return { itemId };
}

export async function updateThreshold(
  cabangId: string,
  itemId: string,
  threshold: unknown
): Promise<{ itemId: string; threshold: number }> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const { rows } = await readSheetData(spreadsheetId, 'Master_Item');
  const found = findRowIndex(rows, 0, itemId);
  if (found.index === -1) throw new ApiError('not_found', 'Item ' + itemId + ' tidak ditemukan');
  const rowNumber = found.index + 2;
  const th = parseThreshold(threshold);
  await writeRow(spreadsheetId, `Master_Item!G${rowNumber}`, [th ?? '']);
  return { itemId, threshold: th ?? 0 };
}

export async function setItemActive(
  cabangId: string,
  itemId: string,
  aktif: unknown
): Promise<{ itemId: string; aktif: boolean }> {
  const { spreadsheetId } = await resolveCabang(cabangId);
  const { rows } = await readSheetData(spreadsheetId, 'Master_Item');
  const found = findRowIndex(rows, 0, itemId);
  if (found.index === -1) throw new ApiError('not_found', 'Item ' + itemId + ' tidak ditemukan');
  const rowNumber = found.index + 2;
  const val = aktif === true || aktif === 'true';
  await writeRow(spreadsheetId, `Master_Item!H${rowNumber}`, [val]);
  return { itemId, aktif: val };
}
