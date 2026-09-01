// lib/domain/pdf-report.ts
// Generator laporan SO (PDF) — Redesign sesuai template Mochikin.
// A4 Landscape, brand header, meta info borderless, badge status, zebra striping.

import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export interface SOReportItem {
  itemId?: string;
  namaBarang?: string;
  satuan?: string;
  area?: string;
  threshold?: number;
  step1?: number;
  step2?: number;
  keterangan?: string;
  prevStep1?: number | null;
  prevStep2?: number | null;
  prevTotal?: number | null;
  prevTanggal?: string | null;
  prevShift?: string | null;
}

export interface SOReportInput {
  laporanId: string;
  cabangNama: string;
  cabangKode: string;
  tanggalOperasional: string;
  shift: string;
  petugas: string;
  items: SOReportItem[];
  previousSOInfo?: {
    tanggal?: string | number | null;
    shift?: string;
    petugas?: string;
    waktu?: string;
  } | null;
  waktuDibuat?: string | Date | number | null;
}

type StatusType = 'Kritis' | 'Hampir Habis' | 'Aman' | 'Tidak Dipantau';

function getStatus(item: SOReportItem): StatusType {
  const total = Number(item.step1) + Number(item.step2);
  const threshold = Number(item.threshold) || 0;
  if (!threshold || threshold <= 0) return 'Tidak Dipantau';
  if (total <= threshold) return 'Kritis';
  if (total <= threshold * 2) return 'Hampir Habis';
  return 'Aman';
}

const STATUS_ORDER: Record<StatusType, number> = {
  Kritis: 0,
  'Hampir Habis': 1,
  Aman: 2,
  'Tidak Dipantau': 3,
};

// Badge colors — sesuai design spec
const BADGE_BG: Record<StatusType, string> = {
  Kritis: '#FEE2E2',
  'Hampir Habis': '#FEF9C3',
  Aman: '#D1FAE5',
  'Tidak Dipantau': '#F1F5F9',
};

const BADGE_FG: Record<StatusType, string> = {
  Kritis: '#B91C1C',
  'Hampir Habis': '#A16207',
  Aman: '#047857',
  'Tidak Dipantau': '#64748B',
};

const BADGE_BORDER: Record<StatusType, string> = {
  Kritis: '#F87171',
  'Hampir Habis': '#FACC15',
  Aman: '#34D399',
  'Tidak Dipantau': '#CBD5E1',
};

// Header group colors
const COL_INFO_BG = '#2563EB';     // Biru — Informasi Barang
const COL_PREV_BG = '#4B5563';     // Abu Gelap — SO Sebelumnya
const COL_CURR_BG = '#059669';     // Hijau Tua — SO Sekarang
const COL_HASIL_BG = '#D97706';    // Oranye — Hasil & Analisis

function buildFileName(input: Pick<SOReportInput, 'cabangKode' | 'tanggalOperasional' | 'shift' | 'petugas'>): string {
  const kode = (input.cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const tglRaw = input.tanggalOperasional || '';
  const [yy, mm, dd] = String(tglRaw).split('-');
  const tgl = dd && mm && yy ? `${dd}-${mm}-${yy}` : String(tglRaw);
  const shiftLabel = (input.shift || 'SO').toUpperCase();
  const petugasLabel = String(input.petugas || 'Petugas').replace(/[/\\:*?"<>|]/g, '').trim();
  return `${kode} - ${tgl} - ${shiftLabel} - ${petugasLabel}.pdf`;
}

function shortTgl(tgl: string | number | null | undefined): string {
  const s = String(tgl ?? '').trim();
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s || '-';
}

function fmtTimeLabel(v: string | Date | number | null | undefined): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`;
  }
  const s = String(v ?? '').trim();
  const m = s.match(/(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  return '';
}

export async function generateSOReportPdf(input: SOReportInput): Promise<{
  buffer: Buffer;
  fileName: string;
}> {
  const fileName = buildFileName(input);
  const sortedItems = [...input.items].sort((a, b) => STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)]);

  const stream = new PassThrough();
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 15 * 2.835, bottom: 15 * 2.835, left: 15 * 2.835, right: 15 * 2.835 },
    bufferPages: true,
  });

  doc.pipe(stream);

  // A4 Landscape: 842 x 595 pt, margins 42pt → usable 758 x 511
  const ML = 42, MR = 42, MT = 42, MB = 42;
  const pageW = doc.page.width - ML - MR;
  const pageH = doc.page.height - MT - MB;

  // ── BACKGROUND ──────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FAF8F5');

  // ── BRAND HEADER ────────────────────────────────────────
  let yPos = MT;
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0F172A');
  doc.text('LAPORAN STOCK OPNAME', ML, yPos, { width: pageW, align: 'left' });
  yPos += 22;
  // Red underline
  doc.moveTo(ML, yPos).lineTo(ML + 160, yPos).strokeColor('#E11D48').lineWidth(2).stroke();
  yPos += 10;

  // ── META INFO (borderless 2x2) ──────────────────────────
  const metaColW = pageW / 2;
  doc.fontSize(8).font('Helvetica').fillColor('#64748B');

  // Row 1
  doc.font('Helvetica-Bold').fillColor('#334155').text('Cabang:', ML, yPos, { continued: true, width: 60 });
  doc.font('Helvetica').fillColor('#0F172A').text(` ${input.cabangKode} (${input.cabangNama})`, { width: metaColW - 60 });
  doc.font('Helvetica-Bold').fillColor('#334155').text('Tanggal Laporan:', ML + metaColW, yPos, { continued: true, width: 90 });
  doc.font('Helvetica').fillColor('#0F172A').text(` ${shortTgl(input.tanggalOperasional)}`, { width: metaColW - 90 });
  yPos += 14;

  // Row 2
  const waktuStr = fmtTimeLabel(input.waktuDibuat ?? new Date());
  doc.font('Helvetica-Bold').fillColor('#334155').text('Petugas:', ML, yPos, { continued: true, width: 60 });
  doc.font('Helvetica').fillColor('#0F172A').text(` ${input.petugas}`, { width: metaColW - 60 });
  doc.font('Helvetica-Bold').fillColor('#334155').text('Shift:', ML + metaColW, yPos, { continued: true, width: 90 });
  doc.font('Helvetica').fillColor('#0F172A').text(` ${input.shift}${waktuStr ? ` (${waktuStr} WIB)` : ''}`, { width: metaColW - 90 });
  yPos += 20;

  // ── STATUS OVERVIEW ─────────────────────────────────────
  const countByStatus = { Kritis: 0, 'Hampir Habis': 0, Aman: 0, 'Tidak Dipantau': 0 };
  sortedItems.forEach(item => { countByStatus[getStatus(item)]++; });

  const statBoxW = pageW / 4 - 4;
  (Object.entries(countByStatus) as [StatusType, number][]).forEach(([status, count], i) => {
    const x = ML + i * (statBoxW + 5);
    doc.roundedRect(x, yPos, statBoxW, 32, 4).fill(BADGE_BG[status]).stroke(BADGE_BORDER[status]);
    doc.fontSize(18).font('Helvetica-Bold').fillColor(BADGE_FG[status]);
    doc.text(String(count), x, yPos + 4, { width: statBoxW, align: 'center' });
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor(BADGE_FG[status]);
    doc.text(status.toUpperCase(), x, yPos + 24, { width: statBoxW, align: 'center' });
  });
  yPos += 42;

  // ── TABLE ───────────────────────────────────────────────
  // Column definitions
  const cols = {
    no: 24,
    nama: 100,
    area: 48,
    satuan: 36,
    threshold: 38,
    prevS1: 30, prevS2: 30, prevT: 36,
    currS1: 30, currS2: 30, currT: 36,
    penggunaan: 38,
    status: 64,
    ket: 78,
  } as const;

  const colKeys = Object.keys(cols) as (keyof typeof cols)[];
  const totalColsW = colKeys.reduce((sum, k) => sum + cols[k], 0);

  const labels: Record<string, string> = {
    no: 'NO', nama: 'NAMA BARANG', area: 'AREA', satuan: 'SAT', threshold: 'Batas Min',
    prevS1: 'S1', prevS2: 'S2', prevT: 'Total',
    currS1: 'S1', currS2: 'S2', currT: 'Total',
    penggunaan: 'Pemakaian', status: 'Status', ket: 'Keterangan',
  };

  // Group header positions
  const grpInfo = { x: ML, w: cols.no + cols.nama + cols.area + cols.satuan + cols.threshold };
  const grpPrev = { x: ML + grpInfo.w, w: cols.prevS1 + cols.prevS2 + cols.prevT };
  const grpCurr = { x: ML + grpInfo.w + grpPrev.w, w: cols.currS1 + cols.currS2 + cols.currT };
  const grpHasil = { x: ML + grpInfo.w + grpPrev.w + grpCurr.w, w: cols.penggunaan + cols.status + cols.ket };

  const drawGroupHeader = (y: number) => {
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.rect(grpInfo.x, y, grpInfo.w, 12).fill(COL_INFO_BG);
    doc.text('INFORMASI BARANG', grpInfo.x, y + 2, { width: grpInfo.w, align: 'center' });
    doc.rect(grpPrev.x, y, grpPrev.w, 12).fill(COL_PREV_BG);
    doc.text('SO SEBELUMNYA', grpPrev.x, y + 2, { width: grpPrev.w, align: 'center' });
    doc.rect(grpCurr.x, y, grpCurr.w, 12).fill(COL_CURR_BG);
    doc.text('SO SEKARANG', grpCurr.x, y + 2, { width: grpCurr.w, align: 'center' });
    doc.rect(grpHasil.x, y, grpHasil.w, 12).fill(COL_HASIL_BG);
    doc.text('HASIL & ANALISIS', grpHasil.x, y + 2, { width: grpHasil.w, align: 'center' });
  };

  const drawSubHeader = (y: number) => {
    doc.rect(ML, y, pageW, 11).fill('#E2E8F0');
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#475569');
    let x = ML + 2;
    for (const key of colKeys) {
      const w = cols[key];
      const align = ['prevS1', 'prevS2', 'prevT', 'currS1', 'currS2', 'currT', 'penggunaan', 'threshold', 'no'].includes(key)
        ? 'center' : key === 'status' ? 'center' : 'left';
      doc.text(labels[key], x, y + 2.5, { width: w - 4, align: align as 'left' | 'right' | 'center' });
      x += w;
    }
  };

  drawGroupHeader(yPos);
  yPos += 12;
  drawSubHeader(yPos);
  yPos += 11;

  // ── DATA ROWS ───────────────────────────────────────────
  doc.font('Helvetica').fontSize(6.5);
  let rowCount = 0;

  const maxRowsPerPage = Math.floor((pageH - (yPos - MT) - 20) / 11);

  for (const item of sortedItems) {
    if (yPos + 11 > doc.page.height - MB) {
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FAF8F5');
      yPos = MT;
      drawGroupHeader(yPos);
      yPos += 12;
      drawSubHeader(yPos);
      yPos += 11;
      doc.font('Helvetica').fontSize(6.5);
      rowCount = 0;
    }

    const status = getStatus(item);
    const total = Number(item.step1) + Number(item.step2);
    const prevTotal = item.prevTotal != null ? Number(item.prevTotal) : null;
    const penggunaan = prevTotal !== null ? prevTotal - total : null;

    // Zebra striping
    const rowBg = rowCount % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(ML, yPos, pageW, 11).fill(rowBg);

    // Status indicator bar on left
    if (status === 'Kritis') {
      doc.rect(ML, yPos, 2.5, 11).fill('#EF4444');
    } else if (status === 'Hampir Habis') {
      doc.rect(ML, yPos, 2.5, 11).fill('#EAB308');
    }

    let x = ML + 2;
    doc.fillColor('#1E293B');

    // No
    doc.text(String(rowCount + 1), x, yPos + 2.5, { width: cols.no - 4, align: 'center' }); x += cols.no;
    // Nama Barang
    doc.text(item.namaBarang || '', x, yPos + 2.5, { width: cols.nama - 4, lineBreak: false }); x += cols.nama;
    // Area
    doc.fontSize(6).fillColor('#64748B').text(item.area || '-', x, yPos + 2.5, { width: cols.area - 4 }); x += cols.area;
    // Satuan
    doc.text(item.satuan || '-', x, yPos + 2.5, { width: cols.satuan - 4, align: 'center' }); x += cols.satuan;
    // Threshold
    doc.fontSize(6.5).fillColor('#475569').text(
      item.threshold != null && item.threshold > 0 ? String(item.threshold) : '-',
      x, yPos + 2.5, { width: cols.threshold - 4, align: 'right' }
    ); x += cols.threshold;

    // SO Sebelumnya
    doc.fillColor('#1E293B');
    doc.text(item.prevStep1 != null ? String(item.prevStep1) : '-', x, yPos + 2.5, { width: cols.prevS1 - 4, align: 'right' }); x += cols.prevS1;
    doc.text(item.prevStep2 != null ? String(item.prevStep2) : '-', x, yPos + 2.5, { width: cols.prevS2 - 4, align: 'right' }); x += cols.prevS2;
    doc.font('Helvetica-Bold').text(prevTotal !== null ? String(prevTotal) : '-', x, yPos + 2.5, { width: cols.prevT - 4, align: 'right' }); x += cols.prevT;
    doc.font('Helvetica');

    // SO Sekarang
    doc.text(String(item.step1 ?? 0), x, yPos + 2.5, { width: cols.currS1 - 4, align: 'right' }); x += cols.currS1;
    doc.text(String(item.step2 ?? 0), x, yPos + 2.5, { width: cols.currS2 - 4, align: 'right' }); x += cols.currS2;
    doc.font('Helvetica-Bold').text(String(total), x, yPos + 2.5, { width: cols.currT - 4, align: 'right' }); x += cols.currT;
    doc.font('Helvetica');

    // Penggunaan
    if (penggunaan !== null) {
      const pColor = penggunaan > 0 ? '#DC2626' : penggunaan < 0 ? '#059669' : '#475569';
      doc.font('Helvetica-Bold').fillColor(pColor);
      doc.text(penggunaan > 0 ? `+${penggunaan}` : String(penggunaan), x, yPos + 2.5, { width: cols.penggunaan - 4, align: 'right' });
      doc.font('Helvetica');
    } else {
      doc.fillColor('#94A3B8').text('-', x, yPos + 2.5, { width: cols.penggunaan - 4, align: 'right' });
    }
    x += cols.penggunaan;

    // Status badge
    const badgeW = cols.status - 4;
    const badgeH = 8;
    const badgeX = x;
    const badgeY = yPos + 1.5;
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2).fill(BADGE_BG[status]).stroke(BADGE_BORDER[status]);
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor(BADGE_FG[status]);
    doc.text(status.toUpperCase(), badgeX, badgeY + 1, { width: badgeW, align: 'center' });
    doc.font('Helvetica');
    x += cols.status;

    // Keterangan
    doc.fontSize(5.5).fillColor('#64748B').text(item.keterangan || '', x, yPos + 2.5, { width: cols.ket - 4, lineBreak: false });

    yPos += 11;
    rowCount++;
  }

  // ── FOOTER on every page ────────────────────────────────
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.moveTo(ML, doc.page.height - MB + 10).lineTo(ML + pageW, doc.page.height - MB + 10).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.fontSize(6).font('Helvetica').fillColor('#94A3B8');
    doc.text(
      `${fileName}  ·  Halaman ${i + 1} dari ${pageCount}  ·  Sistem Stokis  ·  ${new Date().toLocaleString('id-ID')}`,
      ML, doc.page.height - MB + 14,
      { width: pageW, align: 'center' }
    );
  }

  doc.end();

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return { buffer: Buffer.concat(chunks), fileName };
}
