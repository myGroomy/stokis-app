// lib/domain/ids.ts
// Generator ID + validasi murni (tanpa dependensi eksternal).
// Port dari SOValidation.js / Utils.js di Apps Script.

import { createHash, randomUUID } from 'crypto';

export const SHIFT_VALUES = ['Opening', 'Closing'];
export const MAX_ITEMS_PER_SESI = 500;
export const SESI_ID_RE = /^SES[_-][A-Za-z0-9_-]{4,64}$/i;
export const ITEM_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
export const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidSesiId(v: unknown): boolean {
  return typeof v === 'string' && SESI_ID_RE.test(v.trim());
}

export function isValidItemId(v: unknown): boolean {
  return typeof v === 'string' && ITEM_ID_RE.test(v.trim());
}

export function isValidTanggal(v: unknown): boolean {
  if (typeof v !== 'string' || !TANGGAL_RE.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function isValidShift(v: unknown): boolean {
  return SHIFT_VALUES.indexOf(v as string) !== -1;
}

export function randomToken(len = 6): string {
  return randomUUID().replace(/-/g, '').substring(0, len).toUpperCase();
}

function padSeq(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

export function buildSesiId(token: string): string {
  return 'SES_' + String(token || '');
}

export function buildTransaksiId(tanggalOperasional: string, seq: number, token: string): string {
  const datePart = String(tanggalOperasional).replace(/-/g, '');
  return 'TRX_' + datePart + '_' + padSeq(seq, 3) + '_' + String(token || '');
}

export function buildLaporanId(tanggalOperasional: string, token: string): string {
  const datePart = String(tanggalOperasional).replace(/-/g, '');
  return 'RPT_' + datePart + '_' + String(token || '');
}

export function buildCabangId(token: string): string {
  return 'CBG' + String(token || '');
}

export function buildItemId(token: string): string {
  return 'ITM' + String(token || '');
}

export function buildPetugasId(token: string): string {
  return 'PTG' + String(token || '');
}

export function hashPin(pin: string): string {
  return createHash('sha256').update(String(pin)).digest('hex');
}

/** Constant-time string comparison. */
export function secureKeyEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(String(a || '')).digest();
  const hb = createHash('sha256').update(String(b || '')).digest();
  if (ha.length !== hb.length) return false;
  let diff = 0;
  for (let i = 0; i < ha.length; i++) {
    diff |= ha[i] ^ hb[i];
  }
  return diff === 0;
}

/** format YYYY-MM-DD dari Date, timezone lokal. */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
