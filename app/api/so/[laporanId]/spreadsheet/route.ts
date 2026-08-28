// app/api/so/[laporanId]/spreadsheet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

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

const STATUS_COLOR_HEX: Record<StatusType, string> = {
  Kritis: 'CA3521',
  'Hampir Habis': 'B38600',
  Aman: '216E4E',
  'Tidak Dipantau': '6B778C',
};

const STATUS_BG_HEX: Record<StatusType, string> = {
  Kritis: 'FFEBE6',
  'Hampir Habis': 'FFFAE6',
  Aman: 'E3FCEF',
  'Tidak Dipantau': 'F1F2F4',
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ laporanId: string }> }
) {
  const { laporanId } = await params;
  const body = await req.json();
  const { items, cabangNama, cabangKode, tanggalOperasional, shift, petugas, previousSOInfo } = body;

  // Sort items: Kritis → Hampir Habis → Aman → Tidak Dipantau
  const sortedItems: ItemData[] = [...items].sort((a: ItemData, b: ItemData) => {
    return STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)];
  });

  // Standardized filename
  const kode = (cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const tgl = (tanggalOperasional || '').replace(/-/g, '');
  const shiftLabel = (shift || 'SO').toUpperCase();
  const fileName = `${kode}-${tgl}-${shiftLabel}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Stokis';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Laporan SO', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  // ── COLUMN WIDTHS ──────────────────────────────────────
  sheet.columns = [
    { header: '', key: 'no', width: 5 },        // A: No
    { header: '', key: 'nama', width: 22 },      // B: Nama Barang
    { header: '', key: 'area', width: 16 },      // C: Area
    { header: '', key: 'prevS1', width: 8 },     // D: SO Sebelumnya S1
    { header: '', key: 'prevS2', width: 8 },     // E: SO Sebelumnya S2
    { header: '', key: 'prevT', width: 9 },      // F: SO Sebelumnya Total
    { header: '', key: 'currS1', width: 8 },     // G: SO Sekarang S1
    { header: '', key: 'currS2', width: 8 },     // H: SO Sekarang S2
    { header: '', key: 'currT', width: 9 },      // I: SO Sekarang Total
    { header: '', key: 'penggunaan', width: 11 }, // J: Pemakaian
    { header: '', key: 'keterangan', width: 20 }, // K: Keterangan
    { header: '', key: 'status', width: 14 },    // L: Status
  ];

  // ── TITLE ROW ──────────────────────────────────────────
  const titleRow = sheet.addRow(['LAPORAN STOCK OPNAME']);
  sheet.mergeCells('A1:L1');
  titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1868DB' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 32;

  // ── SUBTITLE ROW ───────────────────────────────────────
  const subtitleRow = sheet.addRow([`${cabangNama}  ·  ${tanggalOperasional}  ·  Shift ${shift}`]);
  sheet.mergeCells('A2:L2');
  subtitleRow.getCell(1).font = { size: 10, color: { argb: 'FFB3D4FF' } };
  subtitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1868DB' } };
  subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  subtitleRow.height = 20;

  // ── INFO ROW ───────────────────────────────────────────
  const infoRow = sheet.addRow(['', `NO. LAPORAN: ${laporanId}`, '', `PETUGAS: ${petugas}`, '', '', `KODE CABANG: ${cabangKode || '-'}`, '', '', '', '', '']);
  sheet.mergeCells('A3:B3');
  sheet.mergeCells('D3:F3');
  sheet.mergeCells('G3:I3');
  for (let col = 1; col <= 12; col++) {
    const cell = infoRow.getCell(col);
    cell.font = { size: 9, bold: true, color: { argb: 'FF44546F' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F8F9' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFDCDFE4' } },
      bottom: { style: 'thin', color: { argb: 'FFDCDFE4' } },
      left: { style: 'thin', color: { argb: 'FFDCDFE4' } },
      right: { style: 'thin', color: { argb: 'FFDCDFE4' } },
    };
  }
  infoRow.height = 22;

  // ── STATUS OVERVIEW ROW ────────────────────────────────
  const countByStatus = { Kritis: 0, 'Hampir Habis': 0, Aman: 0, 'Tidak Dipantau': 0 };
  sortedItems.forEach(item => {
    const s = getStatus(item);
    countByStatus[s]++;
  });

  const statusRow = sheet.addRow([
    '',
    `Kritis: ${countByStatus.Kritis}`,
    '',
    `Hampir Habis: ${countByStatus['Hampir Habis']}`,
    '',
    `Aman: ${countByStatus.Aman}`,
    '',
    `Tidak Dipantau: ${countByStatus['Tidak Dipantau']}`,
    '', '', '', ''
  ]);
  sheet.mergeCells('A4:B4');
  sheet.mergeCells('C4:D4');
  sheet.mergeCells('E4:F4');
  sheet.mergeCells('G4:H4');

  const statusKeys: StatusType[] = ['Kritis', 'Hampir Habis', 'Aman', 'Tidak Dipantau'];
  const statusCellRanges = ['A4:B4', 'C4:D4', 'E4:F4', 'G4:H4'];
  statusKeys.forEach((status, i) => {
    const cellAddr = statusCellRanges[i].split(':')[0];
    const cell = statusRow.getCell(cellAddr);
    cell.font = { bold: true, size: 9, color: { argb: 'FF' + STATUS_COLOR_HEX[status] } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + STATUS_BG_HEX[status] } };
    cell.alignment = { horizontal: 'center' };
  });
  for (let col = 1; col <= 12; col++) {
    statusRow.getCell(col).border = {
      top: { style: 'thin', color: { argb: 'FFDCDFE4' } },
      bottom: { style: 'thin', color: { argb: 'FFDCDFE4' } },
      left: { style: 'thin', color: { argb: 'FFDCDFE4' } },
      right: { style: 'thin', color: { argb: 'FFDCDFE4' } },
    };
  }
  statusRow.height = 20;

  // ── BLANK ROW ──────────────────────────────────────────
  sheet.addRow([]);

  // ── PREV SO INFO BANNER ───────────────────────────────
  if (previousSOInfo) {
    const prevBannerRow = sheet.addRow([
      `SO Sebelumnya: ${previousSOInfo.tanggal || '-'} · Shift ${previousSOInfo.shift || '-'}     |     SO Sekarang: ${tanggalOperasional} · Shift ${shift}`
    ]);
    sheet.mergeCells('A6:L6');
    prevBannerRow.getCell(1).font = { bold: true, size: 9, color: { argb: 'FF1868DB' } };
    prevBannerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9F2FF' } };
    prevBannerRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    prevBannerRow.height = 20;
  }

  // ── MEGA HEADER ROW (SO Sebelumnya / SO Sekarang) ─────
  const megaHeaderRowNum = previousSOInfo ? 8 : 7;
  const megaHeaderRow = sheet.getRow(megaHeaderRowNum);
  megaHeaderRow.getCell(1).value = '';
  megaHeaderRow.getCell(4).value = 'SO SEBELUMNYA';
  megaHeaderRow.getCell(7).value = 'SO SEKARANG';

  sheet.mergeCells(`D${megaHeaderRowNum}:F${megaHeaderRowNum}`);
  sheet.mergeCells(`G${megaHeaderRowNum}:I${megaHeaderRowNum}`);

  for (let col = 1; col <= 12; col++) {
    const cell = megaHeaderRow.getCell(col);
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF172B4D' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF172B4D' } },
      bottom: { style: 'thin', color: { argb: 'FF172B4D' } },
      left: { style: 'thin', color: { argb: 'FF172B4D' } },
      right: { style: 'thin', color: { argb: 'FF172B4D' } },
    };
  }
  megaHeaderRow.height = 18;

  // ── COLUMN HEADER ROW ─────────────────────────────────
  const headerRowNum = megaHeaderRowNum + 1;
  const headerRow = sheet.getRow(headerRowNum);
  const headers = ['No', 'Nama Barang', 'Area', 'S1', 'S2', 'Total', 'S1', 'S2', 'Total', 'Pemakaian', 'Keterangan', 'Status'];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF44546F' } };
    cell.alignment = {
      horizontal: ['S1', 'S2', 'Total', 'Pemakaian', 'No'].includes(h) ? 'right' : 'left',
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB3D4FF' } },
      bottom: { style: 'thin', color: { argb: 'FFB3D4FF' } },
      left: { style: 'thin', color: { argb: 'FFB3D4FF' } },
      right: { style: 'thin', color: { argb: 'FFB3D4FF' } },
    };
  });
  headerRow.height = 18;

  // ── DATA ROWS ─────────────────────────────────────────
  let rowNum = headerRowNum + 1;
  sortedItems.forEach((item, idx) => {
    const status = getStatus(item);
    const total = item.step1 + item.step2;
    const prevTotal = item.prevTotal;
    const penggunaan = prevTotal !== null ? prevTotal - total : null;

    const row = sheet.addRow([
      idx + 1,
      item.namaBarang,
      item.area || '-',
      item.prevStep1 !== null ? item.prevStep1 : '-',
      item.prevStep2 !== null ? item.prevStep2 : '-',
      item.prevTotal !== null ? item.prevTotal : '-',
      item.step1,
      item.step2,
      total,
      penggunaan !== null ? penggunaan : '-',
      item.keterangan || '',
      status,
    ]);

    // Row styling
    const rowBg = status === 'Kritis' ? 'FFFFF5F3' :
                  status === 'Hampir Habis' ? 'FFFFFCF0' :
                  idx % 2 === 0 ? 'FFF7F8F9' : 'FFFFFFFF';

    for (let col = 1; col <= 12; col++) {
      const cell = row.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDCDFE4' } },
        bottom: { style: 'thin', color: { argb: 'FFDCDFE4' } },
        left: { style: 'thin', color: { argb: 'FFDCDFE4' } },
        right: { style: 'thin', color: { argb: 'FFDCDFE4' } },
      };
      cell.font = { size: 9, color: { argb: 'FF172B4D' } };
      cell.alignment = { vertical: 'middle' };

      // Right-align numeric columns
      if ([1, 4, 5, 6, 7, 8, 9, 10].includes(col)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    }

    // Bold for totals
    row.getCell(6).font = { bold: true, size: 9, color: { argb: 'FF172B4D' } };
    row.getCell(9).font = { bold: true, size: 9, color: { argb: 'FF172B4D' } };

    // Pemakaian color
    if (penggunaan !== null) {
      const pColor = penggunaan > 0 ? 'FFCA3521' : penggunaan < 0 ? 'FF216E4E' : 'FF44546F';
      row.getCell(10).font = { bold: true, size: 9, color: { argb: pColor } };
    }

    // Status color
    row.getCell(12).font = { bold: true, size: 9, color: { argb: 'FF' + STATUS_COLOR_HEX[status] } };
    row.getCell(12).alignment = { horizontal: 'center', vertical: 'middle' };

    // Keterangan smaller font
    row.getCell(11).font = { size: 8, color: { argb: 'FF44546F' } };

    // Left border stripe for kritis/hampir habis
    if (status === 'Kritis' || status === 'Hampir Habis') {
      row.getCell(1).border = {
        ...row.getCell(1).border,
        left: { style: 'medium', color: { argb: 'FF' + STATUS_COLOR_HEX[status] } },
      };
    }

    row.height = 16;
    rowNum++;
  });

  // ── KRITIS DETAIL SECTION ─────────────────────────────
  const kritisItems = sortedItems.filter(i => getStatus(i) === 'Kritis');
  if (kritisItems.length > 0) {
    sheet.addRow([]); // blank row
    rowNum++;

    const sectionRow = sheet.addRow([`DAFTAR ITEM KRITIS (${kritisItems.length} ITEM) - SEGERA RESTOK`]);
    sheet.mergeCells(`A${rowNum}:L${rowNum}`);
    sectionRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFCA3521' } };
    sectionRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBE6' } };
    sectionRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    sectionRow.height = 22;
    rowNum++;

    kritisItems.forEach((item, idx) => {
      const total = item.step1 + item.step2;
      const deficit = item.threshold - total;
      const bg = idx % 2 === 0 ? 'FFFFEBE6' : 'FFFFF5F3';

      const detailRow = sheet.addRow([
        idx + 1,
        item.namaBarang,
        item.area || '-',
        '', '', '',
        `Stok: ${total}`,
        `Min: ${item.threshold}`,
        `Kekurangan: ${deficit}`,
        '',
        item.keterangan || '',
        '',
      ]);

      for (let col = 1; col <= 12; col++) {
        const cell = detailRow.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFFFBDAD' } },
          bottom: { style: 'thin', color: { argb: 'FFFFBDAD' } },
          left: { style: 'thin', color: { argb: 'FFFFBDAD' } },
          right: { style: 'thin', color: { argb: 'FFFFBDAD' } },
        };
        cell.font = { size: 9, color: { argb: 'FF172B4D' } };
        cell.alignment = { vertical: 'middle' };
      }

      // Bold item name
      detailRow.getCell(2).font = { bold: true, size: 9, color: { argb: 'FF172B4D' } };

      // Red for deficit
      detailRow.getCell(9).font = { bold: true, size: 9, color: { argb: 'FFCA3521' } };

      // Keterangan
      detailRow.getCell(11).font = { size: 8, color: { argb: 'FF6B778C' } };

      detailRow.height = 18;
      rowNum++;
    });
  }

  // ── FOOTER ─────────────────────────────────────────────
  sheet.addRow([]);
  rowNum++;
  const footerRow = sheet.addRow([
    `${fileName}  ·  Sistem Stokis  ·  ${new Date().toLocaleString('id-ID')}`
  ]);
  sheet.mergeCells(`A${rowNum}:L${rowNum}`);
  footerRow.getCell(1).font = { size: 8, color: { argb: 'FFB3BAC5' } };
  footerRow.getCell(1).alignment = { horizontal: 'center' };

  // ── AUTO-FILTER ────────────────────────────────────────
  sheet.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: 12 },
  };

  // ── GENERATE BUFFER ────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
}
