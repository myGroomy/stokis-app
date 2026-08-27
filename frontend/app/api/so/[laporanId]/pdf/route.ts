// app/api/so/[laporanId]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
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
  total: number;
  keterangan: string;
  prevStep1: number | null;
  prevStep2: number | null;
  prevTotal: number | null;
  status: string;
}

function getStatusColor(status: string): string {
  if (status === 'Kritis') return '#CA3521';
  if (status === 'Hampir Habis') return '#B38600';
  return '#216E4E';
}

function getStatusBg(status: string): string {
  if (status === 'Kritis') return '#FFEBE6';
  if (status === 'Hampir Habis') return '#FFFAE6';
  return '#E3FCEF';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ laporanId: string }> }
) {
  const { laporanId } = await params;
  const body = await req.json();
  const { items, cabangNama, tanggalOperasional, shift, petugas, previousSO } = body;

  const stream = new PassThrough();
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
  });

  doc.pipe(stream);

  const pageWidth = doc.page.width - 80;

  // Header
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#172B4D');
  doc.text('LAPORAN STOCK OPNAME', 40, 40, { width: pageWidth, align: 'center' });
  
  doc.fontSize(10).font('Helvetica').fillColor('#44546F');
  doc.text(`${cabangNama} | ${tanggalOperasional} | Shift ${shift}`, 40, 62, { width: pageWidth, align: 'center' });
  doc.text(`Petugas: ${petugas} | No. Laporan: ${laporanId}`, 40, 75, { width: pageWidth, align: 'center' });

  doc.moveTo(40, 92).lineTo(40 + pageWidth, 92).strokeColor('#DCDFE4').lineWidth(1).stroke();

  let yPos = 105;

  // Critical/Restock items section
  const criticalItems = items.filter((item: ItemData) => {
    if (item.threshold > 0 && item.total <= item.threshold) return true;
    if (item.threshold > 0 && item.total <= item.threshold * 2) return true;
    return false;
  });

  if (criticalItems.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#CA3521');
    doc.text('ITEM KRITIS / PERLU RESTOCK', 40, yPos, { width: pageWidth });
    yPos += 18;

    // Critical items table header
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.rect(40, yPos, pageWidth, 16).fill('#CA3521');
    doc.fillColor('#FFFFFF');
    
    const colWidths = { no: 25, nama: 140, s1: 35, s2: 35, total: 35, threshold: 45, status: 75 };
    let x = 45;
    doc.text('No', x, yPos + 4, { width: colWidths.no }); x += colWidths.no;
    doc.text('Nama Barang', x, yPos + 4, { width: colWidths.nama }); x += colWidths.nama;
    doc.text('Step 1', x, yPos + 4, { width: colWidths.s1, align: 'right' }); x += colWidths.s1;
    doc.text('Step 2', x, yPos + 4, { width: colWidths.s2, align: 'right' }); x += colWidths.s2;
    doc.text('Total', x, yPos + 4, { width: colWidths.total, align: 'right' }); x += colWidths.total;
    doc.text('Threshold', x, yPos + 4, { width: colWidths.threshold, align: 'right' }); x += colWidths.threshold;
    doc.text('Status', x, yPos + 4, { width: colWidths.status, align: 'center' });
    yPos += 16;

    doc.fontSize(8).font('Helvetica').fillColor('#172B4D');
    criticalItems.forEach((item: ItemData, idx: number) => {
      if (yPos > 750) {
        doc.addPage();
        yPos = 40;
      }

      const bgColor = idx % 2 === 0 ? '#F7F8F9' : '#FFFFFF';
      doc.rect(40, yPos, pageWidth, 14).fill(bgColor);
      doc.fillColor('#172B4D');

      const status = item.threshold > 0 && item.total <= item.threshold ? 'Kritis' : 'Hampir Habis';
      
      let kx = 45;
      doc.text(`${idx + 1}`, kx, yPos + 3, { width: colWidths.no }); kx += colWidths.no;
      doc.text(item.namaBarang, kx, yPos + 3, { width: colWidths.nama }); kx += colWidths.nama;
      doc.text(String(item.step1), kx, yPos + 3, { width: colWidths.s1, align: 'right' }); kx += colWidths.s1;
      doc.text(String(item.step2), kx, yPos + 3, { width: colWidths.s2, align: 'right' }); kx += colWidths.s2;
      doc.text(String(item.total), kx, yPos + 3, { width: colWidths.total, align: 'right' }); kx += colWidths.total;
      doc.text(String(item.threshold), kx, yPos + 3, { width: colWidths.threshold, align: 'right' }); kx += colWidths.threshold;
      
      doc.fontSize(7).font('Helvetica-Bold').fillColor(getStatusColor(status));
      doc.text(status, kx, yPos + 3, { width: colWidths.status, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#172B4D');
      
      yPos += 14;
    });

    yPos += 10;
  }

  // Previous SO Summary
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#172B4D');
  doc.text('RINGKASAN SO SEBELUMNYA', 40, yPos, { width: pageWidth });
  yPos += 18;

  const prevDate = previousSO?.date || '-';
  const prevShift = previousSO?.shift || '-';
  doc.fontSize(9).font('Helvetica').fillColor('#44546F');
  doc.text(`Tanggal: ${prevDate} | Shift: ${prevShift}`, 40, yPos, { width: pageWidth });
  yPos += 14;

  // Previous SO table
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.rect(40, yPos, pageWidth, 16).fill('#44546F');
  doc.fillColor('#FFFFFF');

  const prevCols = { no: 25, nama: 120, s1: 40, s2: 40, total: 40 };
  let px = 45;
  doc.text('No', px, yPos + 4, { width: prevCols.no }); px += prevCols.no;
  doc.text('Nama Barang', px, yPos + 4, { width: prevCols.nama }); px += prevCols.nama;
  doc.text('Step 1', px, yPos + 4, { width: prevCols.s1, align: 'right' }); px += prevCols.s1;
  doc.text('Step 2', px, yPos + 4, { width: prevCols.s2, align: 'right' }); px += prevCols.s2;
  doc.text('Total', px, yPos + 4, { width: prevCols.total, align: 'right' });
  yPos += 16;

  doc.fontSize(8).font('Helvetica').fillColor('#172B4D');
  const itemsWithPrev = items.filter((item: ItemData) => item.prevTotal !== null);
  itemsWithPrev.forEach((item: ItemData, idx: number) => {
    if (yPos > 750) {
      doc.addPage();
      yPos = 40;
    }

    const bgColor = idx % 2 === 0 ? '#F7F8F9' : '#FFFFFF';
    doc.rect(40, yPos, pageWidth, 12).fill(bgColor);
    doc.fillColor('#172B4D');

    let ix = 45;
    doc.text(`${idx + 1}`, ix, yPos + 2, { width: prevCols.no }); ix += prevCols.no;
    doc.text(item.namaBarang, ix, yPos + 2, { width: prevCols.nama }); ix += prevCols.nama;
    doc.text(String(item.prevStep1 ?? '-'), ix, yPos + 2, { width: prevCols.s1, align: 'right' }); ix += prevCols.s1;
    doc.text(String(item.prevStep2 ?? '-'), ix, yPos + 2, { width: prevCols.s2, align: 'right' }); ix += prevCols.s2;
    doc.text(String(item.prevTotal ?? '-'), ix, yPos + 2, { width: prevCols.total, align: 'right' });
    yPos += 12;
  });

  yPos += 10;

  // Comparison table - Previous vs Current
  if (yPos > 600) {
    doc.addPage();
    yPos = 40;
  }

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#172B4D');
  doc.text('PERBANDINGAN SO SEBELUMNYA vs SEKARANG', 40, yPos, { width: pageWidth });
  yPos += 20;

  // Comparison table header
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.rect(40, yPos, pageWidth, 20).fill('#1868DB');
  doc.fillColor('#FFFFFF');

  const compCols = {
    no: 20, nama: 75, 
    prevS1: 25, prevS2: 25, prevT: 25,
    currS1: 25, currS2: 25, currT: 25,
    diff: 25, ket: 65, status: 40
  };

  // Row 1 - group headers
  let cx = 42;
  doc.text('', cx, yPos + 2, { width: compCols.no + compCols.nama });
  doc.text('SO Sebelumnya', cx + compCols.no + compCols.nama, yPos + 2, { width: 75, align: 'center' });
  doc.text('SO Sekarang', cx + compCols.no + compCols.nama + 75, yPos + 2, { width: 75, align: 'center' });
  doc.text('Selisih', cx + compCols.no + compCols.nama + 150, yPos + 2, { width: compCols.diff, align: 'center' });
  doc.text('Ket', cx + compCols.no + compCols.nama + 175, yPos + 2, { width: compCols.ket, align: 'center' });
  doc.text('Status', cx + compCols.no + compCols.nama + 240, yPos + 2, { width: compCols.status, align: 'center' });

  // Row 2 - column headers
  yPos += 10;
  cx = 42;
  doc.text('No', cx, yPos + 2, { width: compCols.no }); cx += compCols.no;
  doc.text('Nama Barang', cx, yPos + 2, { width: compCols.nama }); cx += compCols.nama;
  doc.text('S1', cx, yPos + 2, { width: compCols.prevS1, align: 'right' }); cx += compCols.prevS1;
  doc.text('S2', cx, yPos + 2, { width: compCols.prevS2, align: 'right' }); cx += compCols.prevS2;
  doc.text('Tot', cx, yPos + 2, { width: compCols.prevT, align: 'right' }); cx += compCols.prevT;
  doc.text('S1', cx, yPos + 2, { width: compCols.currS1, align: 'right' }); cx += compCols.currS1;
  doc.text('S2', cx, yPos + 2, { width: compCols.currS2, align: 'right' }); cx += compCols.currS2;
  doc.text('Tot', cx, yPos + 2, { width: compCols.currT, align: 'right' }); cx += compCols.currT;
  doc.text('+/-', cx, yPos + 2, { width: compCols.diff, align: 'right' }); cx += compCols.diff;
  doc.text('Keterangan', cx, yPos + 2, { width: compCols.ket, align: 'center' }); cx += compCols.ket;
  doc.text('Status', cx, yPos + 2, { width: compCols.status, align: 'center' });
  yPos += 14;

  // Comparison data rows
  doc.fontSize(7).font('Helvetica').fillColor('#172B4D');
  items.forEach((item: ItemData, idx: number) => {
    if (yPos > 750) {
      doc.addPage();
      yPos = 40;
      // Re-draw header
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.rect(40, yPos, pageWidth, 14).fill('#1868DB');
      doc.fillColor('#FFFFFF');
      let rx = 42;
      doc.text('No', rx, yPos + 3, { width: compCols.no }); rx += compCols.no;
      doc.text('Nama Barang', rx, yPos + 3, { width: compCols.nama }); rx += compCols.nama;
      doc.text('S1', rx, yPos + 3, { width: compCols.prevS1, align: 'right' }); rx += compCols.prevS1;
      doc.text('S2', rx, yPos + 3, { width: compCols.prevS2, align: 'right' }); rx += compCols.prevS2;
      doc.text('Tot', rx, yPos + 3, { width: compCols.prevT, align: 'right' }); rx += compCols.prevT;
      doc.text('S1', rx, yPos + 3, { width: compCols.currS1, align: 'right' }); rx += compCols.currS1;
      doc.text('S2', rx, yPos + 3, { width: compCols.currS2, align: 'right' }); rx += compCols.currS2;
      doc.text('Tot', rx, yPos + 3, { width: compCols.currT, align: 'right' }); rx += compCols.currT;
      doc.text('+/-', rx, yPos + 3, { width: compCols.diff, align: 'right' }); rx += compCols.diff;
      doc.text('Keterangan', rx, yPos + 3, { width: compCols.ket, align: 'center' }); rx += compCols.ket;
      doc.text('Status', rx, yPos + 3, { width: compCols.status, align: 'center' });
      yPos += 14;
      doc.fontSize(7).font('Helvetica').fillColor('#172B4D');
    }

    const bgColor = idx % 2 === 0 ? '#F7F8F9' : '#FFFFFF';
    doc.rect(40, yPos, pageWidth, 11).fill(bgColor);
    doc.fillColor('#172B4D');

    const diff = item.prevTotal !== null ? item.total - item.prevTotal : null;
    const status = item.threshold > 0 && item.total <= item.threshold ? 'Kritis' :
                   item.threshold > 0 && item.total <= item.threshold * 2 ? 'Hampir Habis' : 'Aman';

    let dx = 42;
    doc.text(`${idx + 1}`, dx, yPos + 2, { width: compCols.no }); dx += compCols.no;
    doc.text(item.namaBarang, dx, yPos + 2, { width: compCols.nama }); dx += compCols.nama;
    doc.text(String(item.prevStep1 ?? '-'), dx, yPos + 2, { width: compCols.prevS1, align: 'right' }); dx += compCols.prevS1;
    doc.text(String(item.prevStep2 ?? '-'), dx, yPos + 2, { width: compCols.prevS2, align: 'right' }); dx += compCols.prevS2;
    doc.text(String(item.prevTotal ?? '-'), dx, yPos + 2, { width: compCols.prevT, align: 'right' }); dx += compCols.prevT;
    doc.text(String(item.step1), dx, yPos + 2, { width: compCols.currS1, align: 'right' }); dx += compCols.currS1;
    doc.text(String(item.step2), dx, yPos + 2, { width: compCols.currS2, align: 'right' }); dx += compCols.currS2;
    doc.text(String(item.total), dx, yPos + 2, { width: compCols.currT, align: 'right' }); dx += compCols.currT;

    // Diff with color
    if (diff !== null) {
      const diffColor = diff > 0 ? '#216E4E' : diff < 0 ? '#CA3521' : '#44546F';
      doc.fillColor(diffColor);
      doc.text(diff > 0 ? `+${diff}` : String(diff), dx, yPos + 2, { width: compCols.diff, align: 'right' });
    } else {
      doc.fillColor('#B3BAC5');
      doc.text('-', dx, yPos + 2, { width: compCols.diff, align: 'right' });
    }
    dx += compCols.diff;

    // Keterangan
    const ket = (item as any).keterangan || '';
    if (ket) {
      doc.fillColor('#44546F');
      doc.fontSize(6);
      doc.text(ket, dx, yPos + 2, { width: compCols.ket, align: 'left' });
      doc.fontSize(7);
    }
    dx += compCols.ket;

    doc.fillColor(getStatusColor(status));
    doc.fontSize(6).font('Helvetica-Bold');
    doc.text(status, dx, yPos + 2, { width: compCols.status, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#172B4D');

    yPos += 11;
  });

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(7).fillColor('#B3BAC5');
    doc.text(
      `Halaman ${i + 1} dari ${pageCount} | Dibuat oleh Sistem Stokis - ${new Date().toLocaleString('id-ID')}`,
      40, doc.page.height - 30,
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
      'Content-Disposition': `inline; filename="SO-${laporanId}.pdf"`,
    },
  });
}
