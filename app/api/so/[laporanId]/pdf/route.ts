// app/api/so/[laporanId]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, assertCabangAccess } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface ItemData {
  itemId: string;
  namaBarang: string;
  satuan: string;
  area: string;
  threshold: number;
  step1: number;
  step2: number;
  keterangan?: string;
  prevStep1: number | null;
  prevStep2: number | null;
  prevTotal: number | null;
  prevTanggal?: string | null;
  prevShift?: string | null;
}

type StatusType = 'Kritis' | 'Hampir Habis' | 'Aman' | 'Tidak Dipantau';

function getStatus(item: ItemData): StatusType {
  const total = item.step1 + item.step2;
  if (!item.threshold || item.threshold <= 0) return 'Tidak Dipantau';
  if (total <= item.threshold) return 'Kritis';
  if (total <= item.threshold * 2) return 'Hampir Habis';
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

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  yPos: number,
  pageWidth: number,
  cols: Record<string, number>,
  labels: Record<string, string>,
  headerColor: string = '#1868DB'
) {
  doc.rect(40, yPos, pageWidth, 14).fill(headerColor);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF');
  let x = 44;
  for (const [key, width] of Object.entries(cols)) {
    const align = ['step1', 'step2', 'total', 'prevS1', 'prevS2', 'prevT', 'currS1', 'currS2', 'currT', 'penggunaan', 'threshold'].includes(key) ? 'right' : 'left';
    doc.text(labels[key] || key, x, yPos + 3, { width, align: align as 'left' | 'right' | 'center' });
    x += width;
  }
  return yPos + 14;
}

export const POST = withAuth(async (req: NextRequest, { params }, session) => {
  const { laporanId } = await params;
  const body = await req.json();
  const { items, cabangId, cabangNama, cabangKode, tanggalOperasional, shift, petugas, previousSOInfo } = body;

  if (!cabangId || typeof cabangId !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'CABANG_REQUIRED', message: 'Parameter cabangId wajib disertakan' } },
      { status: 400 }
    );
  }

  const guard = assertCabangAccess(session, cabangId);
  if (guard) return guard;

  // Sort items: Kritis → Hampir Habis → Aman → Tidak Dipantau
  const sortedItems: ItemData[] = [...items].sort((a: ItemData, b: ItemData) => {
    return STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)];
  });

  // Standardized filename: [KODE_CABANG]-[TANGGAL]-[SHIFT]
  const kode = (cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const tgl = (tanggalOperasional || '').replace(/-/g, '');
  const shiftLabel = (shift || 'SO').toUpperCase();
  const fileName = `${kode}-${tgl}-${shiftLabel}.pdf`;

  const stream = new PassThrough();
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 50, left: 40, right: 40 },
    bufferPages: true,
  });

  doc.pipe(stream);
  const pageWidth = doc.page.width - 80; // 515 pt usable

  // ── PAGE 1: HEADER ────────────────────────────────────────
  // Logo-area / title block
  doc.rect(40, 40, pageWidth, 52).fill('#1868DB');
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('LAPORAN STOCK OPNAME', 40, 50, { width: pageWidth, align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor('#B3D4FF');
  doc.text(`${cabangNama}  ·  ${tanggalOperasional}  ·  Shift ${shift}`, 40, 70, { width: pageWidth, align: 'center' });

  let yPos = 104;

  // Info row
  doc.fontSize(8).font('Helvetica').fillColor('#44546F');
  const infoBoxW = pageWidth / 3;
  const infoItems = [
    { label: 'NO. LAPORAN', value: laporanId },
    { label: 'PETUGAS', value: petugas },
    { label: 'KODE CABANG', value: cabangKode || '-' },
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
    const s = getStatus(item);
    countByStatus[s]++;
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
  // Detect if any item has prev data
  const hasPrevData = sortedItems.some(i => i.prevTotal !== null);

  // Previous SO info banner
  if (hasPrevData && previousSOInfo) {
    doc.rect(40, yPos, pageWidth, 14).fill('#E9F2FF');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1868DB');
    const prevLabel = `SO Sebelumnya: ${previousSOInfo.tanggal || '-'} · Shift ${previousSOInfo.shift || '-'}`;
    const currLabel = `SO Sekarang: ${tanggalOperasional} · Shift ${shift}`;
    doc.text(prevLabel, 44, yPos + 3, { width: pageWidth / 2 - 4 });
    doc.text(currLabel, 44 + pageWidth / 2, yPos + 3, { width: pageWidth / 2 - 4 });
    yPos += 16;
  }

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#172B4D');
  doc.text('PERBANDINGAN STOK (KRITIS LEBIH DULU)', 40, yPos, { width: pageWidth });
  yPos += 14;

  // Table columns
  // | No | Nama Barang | Area | SO LAMA (S1|S2|Tot) | SO BARU (S1|S2|Tot) | Penggunaan | Ket | Status |
  // Total width = 515
  const cols = {
    no: 18,
    nama: 100,
    area: 60,
    prevS1: 24, prevS2: 24, prevT: 28,
    currS1: 24, currS2: 24, currT: 28,
    penggunaan: 36,
    ket: 74,
    status: 45,
  } as const;

  const labels: Record<string, string> = {
    no: 'No', nama: 'Nama Barang', area: 'Area',
    prevS1: 'S1', prevS2: 'S2', prevT: 'Tot',
    currS1: 'S1', currS2: 'S2', currT: 'Tot',
    penggunaan: 'Pemakaian',
    ket: 'Keterangan',
    status: 'Status',
  };

  // Mega-header row (group SO Lama / SO Baru)
  doc.rect(40, yPos, pageWidth, 11).fill('#172B4D');
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#FFFFFF');
  const soLamaStartX = 40 + cols.no + cols.nama + cols.area + 4;
  const soBaStartX = soLamaStartX + cols.prevS1 + cols.prevS2 + cols.prevT;
  doc.text('SO LAMA', soLamaStartX, yPos + 2, { width: cols.prevS1 + cols.prevS2 + cols.prevT, align: 'center' });
  doc.text('SO BARU', soBaStartX, yPos + 2, { width: cols.currS1 + cols.currS2 + cols.currT, align: 'center' });
  yPos += 11;

  // Column header row
  yPos = drawTableHeader(doc, yPos, pageWidth, cols, labels, '#44546F');

  // Data rows
  doc.fontSize(7).font('Helvetica').fillColor('#172B4D');
  let rowCount = 0;

  for (const item of sortedItems) {
    if (yPos > 760) {
      doc.addPage();
      yPos = 40;
      // Redraw group headers on continuation pages
      doc.rect(40, yPos, pageWidth, 11).fill('#172B4D');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('SO LAMA', soLamaStartX, yPos + 2, { width: cols.prevS1 + cols.prevS2 + cols.prevT, align: 'center' });
      doc.text('SO BARU', soBaStartX, yPos + 2, { width: cols.currS1 + cols.currS2 + cols.currT, align: 'center' });
      yPos += 11;
      yPos = drawTableHeader(doc, yPos, pageWidth, cols, labels, '#44546F');
      doc.fontSize(7).font('Helvetica').fillColor('#172B4D');
    }

    const status = getStatus(item);
    const total = item.step1 + item.step2;
    const prevTotal = item.prevTotal;
    const penggunaan = prevTotal !== null ? prevTotal - total : null;

    // Row background: kritis gets subtle tint
    const rowBg = status === 'Kritis' ? '#FFF5F3' :
                  status === 'Hampir Habis' ? '#FFFCF0' :
                  rowCount % 2 === 0 ? '#F7F8F9' : '#FFFFFF';
    doc.rect(40, yPos, pageWidth, 13).fill(rowBg);

    // Left border color stripe for kritis/hampir habis
    if (status === 'Kritis' || status === 'Hampir Habis') {
      doc.rect(40, yPos, 3, 13).fill(STATUS_COLOR[status]);
    }

    doc.fillColor('#172B4D');
    let x = 44;

    doc.text(String(rowCount + 1), x, yPos + 3, { width: cols.no }); x += cols.no;
    doc.text(item.namaBarang, x, yPos + 3, { width: cols.nama }); x += cols.nama;
    doc.fontSize(6.5).fillColor('#6B778C');
    doc.text(item.area || '-', x, yPos + 3, { width: cols.area }); x += cols.area;
    doc.fontSize(7).fillColor('#44546F');

    // SO Lama
    doc.text(item.prevStep1 !== null ? String(item.prevStep1) : '-', x, yPos + 3, { width: cols.prevS1, align: 'right' }); x += cols.prevS1;
    doc.text(item.prevStep2 !== null ? String(item.prevStep2) : '-', x, yPos + 3, { width: cols.prevS2, align: 'right' }); x += cols.prevS2;
    doc.font('Helvetica-Bold').text(item.prevTotal !== null ? String(item.prevTotal) : '-', x, yPos + 3, { width: cols.prevT, align: 'right' }); x += cols.prevT;
    doc.font('Helvetica');

    // SO Baru
    doc.text(String(item.step1), x, yPos + 3, { width: cols.currS1, align: 'right' }); x += cols.currS1;
    doc.text(String(item.step2), x, yPos + 3, { width: cols.currS2, align: 'right' }); x += cols.currS2;
    doc.font('Helvetica-Bold').fillColor('#172B4D').text(String(total), x, yPos + 3, { width: cols.currT, align: 'right' }); x += cols.currT;
    doc.font('Helvetica');

    // Penggunaan (prev - current, represents consumption)
    if (penggunaan !== null) {
      const pColor = penggunaan > 0 ? '#CA3521' : penggunaan < 0 ? '#216E4E' : '#44546F';
      doc.fillColor(pColor).font('Helvetica-Bold');
      doc.text(penggunaan > 0 ? `+${penggunaan}` : String(penggunaan), x, yPos + 3, { width: cols.penggunaan, align: 'right' });
      doc.font('Helvetica');
    } else {
      doc.fillColor('#B3BAC5').text('-', x, yPos + 3, { width: cols.penggunaan, align: 'right' });
    }
    x += cols.penggunaan;

    // Keterangan
    const ket = item.keterangan || '';
    doc.fontSize(6).fillColor('#44546F').text(ket, x, yPos + 3, { width: cols.ket, lineBreak: false });
    x += cols.ket;
    doc.fontSize(7);

    // Status badge
    doc.fontSize(6).font('Helvetica-Bold').fillColor(STATUS_COLOR[status]);
    doc.text(status, x, yPos + 3, { width: cols.status, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#172B4D');

    // Bottom border for critical rows
    if (status === 'Kritis') {
      doc.moveTo(40, yPos + 13).lineTo(40 + pageWidth, yPos + 13).strokeColor('#FFBDAD').lineWidth(0.5).stroke();
    }

    yPos += 13;
    rowCount++;
  }

  // ── SECTION: ITEM KRITIS DETAIL (Summary at bottom) ──────
  const kritisItems = sortedItems.filter(i => getStatus(i) === 'Kritis');
  if (kritisItems.length > 0) {
    yPos += 8;
    if (yPos > 720) {
      doc.addPage();
      yPos = 40;
    }

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#CA3521');
    doc.text(`⚠ DAFTAR ITEM KRITIS (${kritisItems.length} ITEM)`, 40, yPos, { width: pageWidth });
    yPos += 12;

    kritisItems.forEach((item, idx) => {
      if (yPos > 760) { doc.addPage(); yPos = 40; }
      const total = item.step1 + item.step2;
      const deficit = item.threshold - total;
      const bg = idx % 2 === 0 ? '#FFEBE6' : '#FFF5F3';
      doc.rect(40, yPos, pageWidth, 12).fill(bg);
      doc.fontSize(7).font('Helvetica').fillColor('#172B4D');
      doc.text(`${idx + 1}. ${item.namaBarang}`, 44, yPos + 2, { width: 200 });
      doc.fillColor('#44546F').text(`Area: ${item.area || '-'}`, 244, yPos + 2, { width: 100 });
      doc.fillColor('#CA3521').font('Helvetica-Bold');
      doc.text(`Stok: ${total} | Min: ${item.threshold} | Kekurangan: ${deficit}`, 344, yPos + 2, { width: pageWidth - 310 });
      if (item.keterangan) {
        yPos += 12;
        doc.fontSize(6.5).font('Helvetica').fillColor('#6B778C');
        doc.text(`   Ket: ${item.keterangan}`, 44, yPos, { width: pageWidth - 8 });
      }
      yPos += 13;
    });
  }

  // ── FOOTER on every page ─────────────────────────────────
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    // footer line
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
  const pdfBuffer = Buffer.concat(chunks);

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
});
