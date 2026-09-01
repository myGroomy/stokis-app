// lib/domain/pdf-report.ts
// Generator laporan SO (PDF) — dipakai bersama oleh endpoint submit (/api/so/)
// dan endpoint penyajian/serve (/api/so/[laporanId]/pdf-file) agar hasilnya
// identik. Port dari apps-script/PDF.js.

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
  previousSOInfo?: { tanggal?: string; shift?: string } | null;
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

const STATUS_COLOR: Record<StatusType, string> = {
  Kritis: '#CA3521',
  'Hampir Habis': '#B38600',
  Aman: '#216E4E',
  'Tidak Dipantau': '#6B778C',
};

const STATUS_BG: Record<StatusType, string> = {
  Kritis: '#FFEBE6',
  'Hampir Habis': '#FFFAE6',
  Aman: '#E3FCEF',
  'Tidak Dipantau': '#F1F2F4',
};

function buildFileName(input: Pick<SOReportInput, 'cabangKode' | 'tanggalOperasional' | 'shift' | 'petugas'>): string {
  const kode = (input.cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const tglRaw = input.tanggalOperasional || '';
  const [yy, mm, dd] = String(tglRaw).split('-');
  const tgl = dd && mm && yy ? `${dd}-${mm}-${yy}` : String(tglRaw);
  const shiftLabel = (input.shift || 'SO').toUpperCase();
  const petugasLabel = String(input.petugas || 'Petugas').replace(/[/\\:*?"<>|]/g, '').trim();
  return `${kode} - ${tgl} - ${shiftLabel} - ${petugasLabel}.pdf`;
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  yPos: number,
  pageWidth: number,
  cols: Record<string, number>,
  labels: Record<string, string>,
  headerColor: string = '#1868DB'
) {
  doc.rect(40, yPos, pageWidth, 14).fill(headerColor);
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#FFFFFF');
  let x = 44;
  for (const [key, width] of Object.entries(cols)) {
    const align = ['prevS1', 'prevS2', 'prevT', 'currS1', 'currS2', 'currT', 'penggunaan', 'threshold'].includes(key)
      ? 'right'
      : key === 'status'
        ? 'center'
        : 'left';
    doc.text(labels[key] || key, x, yPos + 3, { width, align: align as 'left' | 'right' | 'center' });
    x += width;
  }
  return yPos + 14;
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
    margins: { top: 40, bottom: 50, left: 40, right: 40 },
    bufferPages: true,
  });

  doc.pipe(stream);
  const pageWidth = doc.page.width - 80; // 515 pt usable

  // ── PAGE 1: HEADER ────────────────────────────────────────
  doc.rect(40, 40, pageWidth, 52).fill('#1868DB');
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('LAPORAN STOCK OPNAME', 40, 50, { width: pageWidth, align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor('#B3D4FF');
  doc.text(`${input.cabangNama}  ·  ${input.tanggalOperasional}  ·  Shift ${input.shift}`, 40, 70, { width: pageWidth, align: 'center' });

  let yPos = 104;

  // Info row
  doc.fontSize(8).font('Helvetica').fillColor('#44546F');
  const infoBoxW = pageWidth / 3;
  const infoItems = [
    { label: 'NO. LAPORAN', value: input.laporanId },
    { label: 'PETUGAS', value: input.petugas },
    { label: 'KODE CABANG', value: input.cabangKode || '-' },
  ];
  infoItems.forEach((info, i) => {
    const x = 40 + i * infoBoxW;
    doc.rect(x, yPos, infoBoxW - 2, 28).fill('#F7F8F9').stroke('#DCDFE4');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#44546F');
    doc.text(info.label, x + 6, yPos + 5, { width: infoBoxW - 14 });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#172B4D');
    doc.text(info.value, x + 6, yPos + 15, { width: infoBoxW - 14 });
  });
  yPos += 36;

  // ── SECTION: STATUS OVERVIEW ─────────────────────────────
  const countByStatus = { Kritis: 0, 'Hampir Habis': 0, Aman: 0, 'Tidak Dipantau': 0 };
  sortedItems.forEach(item => {
    countByStatus[getStatus(item)]++;
  });

  const statBoxW = pageWidth / 4;
  (Object.entries(countByStatus) as [StatusType, number][]).forEach(([status, count], i) => {
    const x = 40 + i * statBoxW;
    doc.rect(x, yPos, statBoxW - 3, 30).fill(STATUS_BG[status]).stroke(STATUS_COLOR[status]);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(STATUS_COLOR[status]);
    doc.text(String(count), x + 4, yPos + 4, { width: statBoxW - 14, align: 'center' });
    doc.fontSize(6).font('Helvetica-Bold').fillColor(STATUS_COLOR[status]);
    doc.text(status.toUpperCase(), x + 4, yPos + 22, { width: statBoxW - 14, align: 'center' });
  });
  yPos += 38;

  // ── SECTION: SO COMPARISON TABLE ─────────────────────────
  const hasPrevData = sortedItems.some(i => (i.prevTotal != null || i.prevStep1 != null));
  const previousSOInfo = input.previousSOInfo;

  if (hasPrevData && previousSOInfo) {
    doc.rect(40, yPos, pageWidth, 14).fill('#E9F2FF');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1868DB');
    const prevLabel = `SO Sebelumnya: ${previousSOInfo.tanggal || '-'} · Shift ${previousSOInfo.shift || '-'}`;
    const currLabel = `SO Sekarang: ${input.tanggalOperasional} · Shift ${input.shift}`;
    doc.text(prevLabel, 44, yPos + 3, { width: pageWidth / 2 - 4 });
    doc.text(currLabel, 44 + pageWidth / 2, yPos + 3, { width: pageWidth / 2 - 4 });
    yPos += 16;
  }

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#172B4D');
  doc.text('PERBANDINGAN STOK (KRITIS LEBIH DULU)', 40, yPos, { width: pageWidth });
  yPos += 14;

  // | Nama Barang | Area | Satuan | Threshold | SO SEBELUMNYA (STEP1|STEP2|TOTAL) | SO SEKARANG (STEP1|STEP2|TOTAL) | Penggunaan | Status | Keterangan |
  const cols = {
    nama: 92,
    area: 40,
    satuan: 34,
    threshold: 32,
    prevS1: 26, prevS2: 26, prevT: 32,
    currS1: 26, currS2: 26, currT: 32,
    penggunaan: 32,
    status: 55,
    ket: 62,
  } as const;

  const labels: Record<string, string> = {
    nama: 'NAMA BARANG', area: 'AREA', satuan: 'SATUAN', threshold: 'THRESHOLD',
    prevS1: 'STEP 1', prevS2: 'STEP 2', prevT: 'TOTAL',
    currS1: 'STEP 1', currS2: 'STEP 2', currT: 'TOTAL',
    penggunaan: 'PENGGUNAAN', status: 'STATUS', ket: 'KETERANGAN',
  };

  const prevGroupW = cols.prevS1 + cols.prevS2 + cols.prevT;
  const currGroupW = cols.currS1 + cols.currS2 + cols.currT;
  const prevGroupStartX = 44 + cols.nama + cols.area + cols.satuan + cols.threshold;
  const currGroupStartX = prevGroupStartX + prevGroupW;
  const prevLabel = `SO ${previousSOInfo?.tanggal || '-'} ${(previousSOInfo?.shift || '').toUpperCase()}`.trim();
  const currLabel = `SO ${input.tanggalOperasional || '-'} ${(input.shift || '').toUpperCase()}`.trim();

  const drawMegaHeader = (yy: number) => {
    doc.rect(40, yy, pageWidth, 11).fill('#172B4D');
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text(prevLabel, prevGroupStartX, yy + 2, { width: prevGroupW, align: 'center' });
    doc.text(currLabel, currGroupStartX, yy + 2, { width: currGroupW, align: 'center' });
  };
  drawMegaHeader(yPos);
  yPos += 11;

  yPos = drawTableHeader(doc, yPos, pageWidth, cols, labels, '#44546F');

  doc.fontSize(7).font('Helvetica').fillColor('#172B4D');
  let rowCount = 0;

  for (const item of sortedItems) {
    if (yPos > 760) {
      doc.addPage();
      yPos = 40;
      drawMegaHeader(yPos);
      yPos += 11;
      yPos = drawTableHeader(doc, yPos, pageWidth, cols, labels, '#44546F');
      doc.fontSize(7).font('Helvetica').fillColor('#172B4D');
    }

    const status = getStatus(item);
    const total = Number(item.step1) + Number(item.step2);
    const prevTotal = item.prevTotal != null ? Number(item.prevTotal) : null;
    const penggunaan = prevTotal !== null ? prevTotal - total : null;

    const rowBg = status === 'Kritis' ? '#FFF5F3' :
                  status === 'Hampir Habis' ? '#FFFCF0' :
                  rowCount % 2 === 0 ? '#F7F8F9' : '#FFFFFF';
    doc.rect(40, yPos, pageWidth, 13).fill(rowBg);

    if (status === 'Kritis' || status === 'Hampir Habis') {
      doc.rect(40, yPos, 3, 13).fill(STATUS_COLOR[status]);
    }

    doc.fillColor('#172B4D');
    let x = 44;

    doc.text(item.namaBarang || '', x, yPos + 3, { width: cols.nama }); x += cols.nama;
    doc.fontSize(6.5).fillColor('#6B778C');
    doc.text(item.area || '-', x, yPos + 3, { width: cols.area }); x += cols.area;
    doc.text(item.satuan || '-', x, yPos + 3, { width: cols.satuan }); x += cols.satuan;
    doc.fontSize(7).fillColor('#44546F');
    doc.text(item.threshold != null && item.threshold > 0 ? String(item.threshold) : '-', x, yPos + 3, { width: cols.threshold, align: 'right' }); x += cols.threshold;

    // SO Sebelumnya
    doc.text(item.prevStep1 != null ? String(item.prevStep1) : '-', x, yPos + 3, { width: cols.prevS1, align: 'right' }); x += cols.prevS1;
    doc.text(item.prevStep2 != null ? String(item.prevStep2) : '-', x, yPos + 3, { width: cols.prevS2, align: 'right' }); x += cols.prevS2;
    doc.font('Helvetica-Bold').text(prevTotal !== null ? String(prevTotal) : '-', x, yPos + 3, { width: cols.prevT, align: 'right' }); x += cols.prevT;
    doc.font('Helvetica');

    // SO Sekarang
    doc.text(String(item.step1 ?? 0), x, yPos + 3, { width: cols.currS1, align: 'right' }); x += cols.currS1;
    doc.text(String(item.step2 ?? 0), x, yPos + 3, { width: cols.currS2, align: 'right' }); x += cols.currS2;
    doc.font('Helvetica-Bold').fillColor('#172B4D').text(String(total), x, yPos + 3, { width: cols.currT, align: 'right' }); x += cols.currT;
    doc.font('Helvetica');

    // Penggunaan
    if (penggunaan !== null) {
      const pColor = penggunaan > 0 ? '#CA3521' : penggunaan < 0 ? '#216E4E' : '#44546F';
      doc.fillColor(pColor).font('Helvetica-Bold');
      doc.text(penggunaan > 0 ? `+${penggunaan}` : String(penggunaan), x, yPos + 3, { width: cols.penggunaan, align: 'right' });
      doc.font('Helvetica');
    } else {
      doc.fillColor('#B3BAC5').text('-', x, yPos + 3, { width: cols.penggunaan, align: 'right' });
    }
    x += cols.penggunaan;

    // Status
    doc.rect(x, yPos, cols.status, 13).fill(STATUS_BG[status]);
    doc.fontSize(6).font('Helvetica-Bold').fillColor(STATUS_COLOR[status]);
    doc.text(status.toUpperCase(), x, yPos + 3.5, { width: cols.status, align: 'center' });
    x += cols.status;
    doc.font('Helvetica').fontSize(7).fillColor('#172B4D');

    // Keterangan
    const ket = item.keterangan || '';
    doc.fontSize(6).fillColor('#44546F').text(ket, x, yPos + 3, { width: cols.ket, lineBreak: false });
    x += cols.ket;
    doc.fontSize(7).fillColor('#172B4D');

    if (status === 'Kritis') {
      doc.moveTo(40, yPos + 13).lineTo(40 + pageWidth, yPos + 13).strokeColor('#FFBDAD').lineWidth(0.5).stroke();
    }

    yPos += 13;
    rowCount++;
  }

  // ── FOOTER on every page ─────────────────────────────────
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.moveTo(40, doc.page.height - 35).lineTo(40 + pageWidth, doc.page.height - 35).strokeColor('#DCDFE4').lineWidth(0.5).stroke();
    doc.fontSize(7).font('Helvetica').fillColor('#B3BAC5');
    doc.text(
      `${fileName}  ·  Halaman ${i + 1} dari ${pageCount}  ·  Sistem Stokis  ·  ${new Date().toLocaleString('id-ID')}`,
      40, doc.page.height - 28,
      { width: pageWidth, align: 'center' }
    );
  }

  doc.end();

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return { buffer: Buffer.concat(chunks), fileName };
}