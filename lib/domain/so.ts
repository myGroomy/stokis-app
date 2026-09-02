// lib/domain/so.ts
// Konstanta kolom + tipe domain untuk tabel Stock Opname & Laporan.
// Port dari SO_COL (Utils.js) dan struktur sheet.

export const SO_COL = {
  Transaksi_ID: 1,
  Timestamp: 2,
  Tanggal_Operasional: 3,
  Shift: 4,
  Item_ID: 5,
  Nama_Barang: 6,
  Area: 7,
  Step1: 8,
  Step2: 9,
  Total: 10,
  Petugas: 11,
  Sesi_ID: 12,
  Keterangan: 13,
} as const;

export function calculateStatus(total: number, threshold: number | null | undefined): string {
  if (threshold === null || threshold === undefined || isNaN(threshold) || threshold < 0) {
    return 'Tidak Dipantau';
  }
  if (total <= threshold) return 'Kritis';
  if (threshold > 0 && total <= threshold * 2) return 'Hampir Habis';
  return 'Aman';
}

export function parseThreshold(v: unknown): number | null {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  const s = String(v).replace(',', '.').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export interface SOItem {
  itemId: string;
  step1: number;
  step2: number;
  total: number;
  keterangan: string;
}

export interface ValidatedSOPayload {
  sesiId: string;
  tanggalOperasional: string;
  shift: string;
  petugas: string;
  items: SOItem[];
}

export function isNonNegativeNumber(v: unknown): boolean {
  if (typeof v === 'number') return isFinite(v) && v >= 0;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return isFinite(n) && n >= 0;
  }
  return false;
}

export function normalizeCount(v: unknown): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return isFinite(n) && n >= 0 ? n : 0;
}

export interface ValidationError {
  code: string;
  message: string;
}
